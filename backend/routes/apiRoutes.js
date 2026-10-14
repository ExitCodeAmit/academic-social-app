const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const db = require('../config/db');
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const uploadsDirectory = path.join(__dirname, '..', 'uploads');
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadsDirectory),
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${require('crypto').randomUUID()}.pdf`),
  }),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== 'application/pdf' || path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return callback(new Error('Only PDF files are accepted.'));
    }
    callback(null, true);
  },
});
const roles = ['user', 'researcher', 'moderator', 'group_admin', 'admin'];

router.post('/auth/register', asyncRoute(authController.register));
router.post('/auth/login', asyncRoute(authController.login));
router.get('/auth/me', authenticateToken, asyncRoute(authController.me));

router.get('/users/:id', asyncRoute(async (req, res) => {
  const result = await db.query(
    `SELECT id, name, role, bio, institution, profile_pic, created_at
     FROM users WHERE id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: 'User not found.' });
  res.json(result.rows[0]);
}));

router.patch('/users/me', authenticateToken, asyncRoute(async (req, res) => {
  const { name, bio, institution } = req.body;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'Name is required.' });
  const result = await db.query(
    `UPDATE users SET name = $1, bio = $2, institution = $3
     WHERE id = $4
     RETURNING id, name, email, role, bio, institution, profile_pic, created_at`,
    [name.trim(), typeof bio === 'string' ? bio.trim() : '', institution?.trim() || null, req.user.id]
  );
  res.json(result.rows[0]);
}));

router.get('/users/:id/papers', asyncRoute(async (req, res) => {
  const result = await db.query(
    `SELECT rp.id, rp.title, rp.abstract, rp.pdf_url, rp.doi, rp.status, rp.created_at,
            u.name AS author_name
     FROM research_papers rp JOIN users u ON u.id = rp.author_id
     WHERE rp.author_id = $1 AND (rp.status = 'approved' OR rp.author_id = $2)
     ORDER BY rp.created_at DESC`,
    [req.params.id, req.user?.id || null]
  );
  res.json(result.rows);
}));

router.get('/groups', asyncRoute(async (req, res) => {
  const result = await db.query(
    `SELECT g.id, g.name, g.description, g.created_at, u.name AS creator_name,
            COUNT(DISTINCT gm.user_id)::int AS member_count,
            BOOL_OR(gm.user_id = $1) AS joined
     FROM groups g
     LEFT JOIN users u ON u.id = g.created_by
     LEFT JOIN group_members gm ON gm.group_id = g.id
     GROUP BY g.id, u.name ORDER BY member_count DESC, g.name`,
    [req.user?.id || null]
  );
  res.json(result.rows);
}));

router.post('/groups', authenticateToken, asyncRoute(async (req, res) => {
  const { name, description = '' } = req.body;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'Group name is required.' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const group = await client.query(
      'INSERT INTO groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description, req.user.id]
    );
    await client.query(
      "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin')",
      [group.rows[0].id, req.user.id]
    );
    await client.query('COMMIT');
    res.status(201).json({ ...group.rows[0], joined: true, member_count: 1 });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ message: 'A group with this name already exists.' });
    throw error;
  } finally {
    client.release();
  }
}));

router.post('/groups/:id/join', authenticateToken, asyncRoute(async (req, res) => {
  const result = await db.query(
    `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rowCount) {
    const exists = await db.query('SELECT id FROM groups WHERE id = $1', [req.params.id]);
    if (!exists.rowCount) return res.status(404).json({ message: 'Group not found.' });
    return res.json({ message: 'You are already a member of this group.' });
  }
  res.status(201).json({ message: 'You joined the group.' });
}));

router.get('/posts', asyncRoute(async (req, res) => {
  const values = [req.user?.id || null];
  let filter = '';
  if (req.query.groupId) {
    values.push(req.query.groupId);
    filter = 'WHERE p.group_id = $2';
  }
  const result = await db.query(
    `SELECT p.id, p.title, p.content, p.media_url, p.created_at, p.group_id,
            u.id AS user_id, u.name AS author_name, u.role AS author_role,
            g.name AS group_name
     FROM posts p JOIN users u ON u.id = p.user_id
     LEFT JOIN groups g ON g.id = p.group_id
     ${filter}
     ORDER BY p.created_at DESC LIMIT 100`,
    values
  );
  res.json(result.rows);
}));

router.post('/posts', authenticateToken, asyncRoute(async (req, res) => {
  const { title, content, group_id: groupId = null, media_url: mediaUrl = null } = req.body;
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ message: 'Post title and content are required.' });
  }
  if (groupId) {
    const membership = await db.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, req.user.id]);
    if (!membership.rowCount) return res.status(403).json({ message: 'Join this group before posting to it.' });
  }
  const result = await db.query(
    `INSERT INTO posts (user_id, group_id, title, content, media_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, groupId, title.trim(), content.trim(), mediaUrl]
  );
  res.status(201).json(result.rows[0]);
}));

router.get('/papers', asyncRoute(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const values = [];
  let filter = "WHERE rp.status = 'approved'";
  if (search) {
    values.push(`%${search}%`);
    filter += ` AND (rp.title ILIKE $1 OR rp.abstract ILIKE $1 OR rp.doi ILIKE $1 OR u.name ILIKE $1)`;
  }
  const result = await db.query(
    `SELECT rp.id, rp.title, rp.abstract, rp.pdf_url, rp.doi, rp.status, rp.created_at,
            u.id AS author_id, u.name AS author_name,
            COALESCE(AVG(pr.rating), 0)::numeric(2,1) AS average_rating,
            COUNT(pr.id)::int AS review_count
     FROM research_papers rp
     JOIN users u ON u.id = rp.author_id
     LEFT JOIN paper_reviews pr ON pr.paper_id = rp.id
     ${filter}
     GROUP BY rp.id, u.id ORDER BY rp.created_at DESC`,
    values
  );
  res.json(result.rows);
}));

router.get('/papers/mine', authenticateToken, asyncRoute(async (req, res) => {
  const result = await db.query('SELECT * FROM research_papers WHERE author_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(result.rows);
}));

router.post('/papers', authenticateToken, upload.single('pdf'), asyncRoute(async (req, res) => {
  const { title, abstract, doi } = req.body;
  if (typeof title !== 'string' || !title.trim() || typeof abstract !== 'string' || !abstract.trim()) {
    if (req.file) await fs.unlink(req.file.path);
    return res.status(400).json({ message: 'Paper title and abstract are required.' });
  }
  if (!req.file) return res.status(400).json({ message: 'A PDF file is required.' });
  const fileHandle = await fs.open(req.file.path, 'r');
  const signature = Buffer.alloc(5);
  let bytesRead;
  try {
    ({ bytesRead } = await fileHandle.read(signature, 0, signature.length, 0));
  } finally {
    await fileHandle.close();
  }
  if (bytesRead !== signature.length || signature.toString('ascii') !== '%PDF-') {
    await fs.unlink(req.file.path);
    return res.status(400).json({ message: 'The uploaded file is not a valid PDF.' });
  }
  try {
    const result = await db.query(
      `INSERT INTO research_papers (author_id, title, abstract, pdf_url, doi)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title.trim(), abstract.trim(), `/uploads/${req.file.filename}`, doi?.trim() || null]
    );
    res.status(201).json({ message: 'Your paper has been submitted for review.', paper: result.rows[0] });
  } catch (error) {
    if (req.file) await fs.unlink(req.file.path);
    throw error;
  }
}));

router.get('/papers/:id/reviews', asyncRoute(async (req, res) => {
  const result = await db.query(
    `SELECT pr.id, pr.comment, pr.rating, pr.created_at, u.id AS reviewer_id, u.name AS reviewer_name
     FROM paper_reviews pr JOIN users u ON u.id = pr.reviewer_id
     JOIN research_papers rp ON rp.id = pr.paper_id
     WHERE pr.paper_id = $1 AND rp.status = 'approved'
     ORDER BY pr.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
}));

router.post('/papers/:id/reviews', authenticateToken, asyncRoute(async (req, res) => {
  const { comment, rating } = req.body;
  if (typeof comment !== 'string' || !comment.trim() || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ message: 'A review comment and a rating from 1 to 5 are required.' });
  }
  const paper = await db.query("SELECT id FROM research_papers WHERE id = $1 AND status = 'approved'", [req.params.id]);
  if (!paper.rowCount) return res.status(404).json({ message: 'Approved paper not found.' });
  const result = await db.query(
    `INSERT INTO paper_reviews (paper_id, reviewer_id, comment, rating) VALUES ($1, $2, $3, $4)
     ON CONFLICT (paper_id, reviewer_id) DO UPDATE SET comment = EXCLUDED.comment, rating = EXCLUDED.rating
     RETURNING *`,
    [req.params.id, req.user.id, comment.trim(), Number(rating)]
  );
  res.status(201).json(result.rows[0]);
}));

router.get('/admin/papers', authenticateToken, authorizeRoles('admin', 'moderator'), asyncRoute(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const result = status
    ? await db.query(
      `SELECT rp.*, u.name AS author_name, u.email AS author_email
       FROM research_papers rp JOIN users u ON u.id = rp.author_id
       WHERE rp.status = $1 ORDER BY rp.created_at`,
      [status]
    )
    : await db.query(
      `SELECT rp.*, u.name AS author_name, u.email AS author_email
       FROM research_papers rp JOIN users u ON u.id = rp.author_id
       WHERE rp.status IN ('pending', 'under_review') ORDER BY rp.created_at`
    );
  res.json(result.rows);
}));

router.patch('/admin/papers/:paperId/status', authenticateToken, authorizeRoles('admin', 'moderator'), asyncRoute(async (req, res) => {
  const { status } = req.body;
  if (!['under_review', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be under_review, approved, or rejected.' });
  }
  const result = await db.query('UPDATE research_papers SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.paperId]);
  if (!result.rowCount) return res.status(404).json({ message: 'Paper not found.' });
  res.json(result.rows[0]);
}));

router.get('/admin/users', authenticateToken, authorizeRoles('admin'), asyncRoute(async (_req, res) => {
  const result = await db.query(
    'SELECT id, name, email, role, institution, created_at FROM users ORDER BY created_at DESC LIMIT 200'
  );
  res.json(result.rows);
}));

router.patch('/admin/users/:id/role', authenticateToken, authorizeRoles('admin'), asyncRoute(async (req, res) => {
  const { role } = req.body;
  if (!roles.includes(role)) return res.status(400).json({ message: 'Choose a valid account role.' });
  if (Number(req.params.id) === req.user.id && role !== 'admin') {
    return res.status(400).json({ message: 'You cannot remove your own administrator role.' });
  }
  const result = await db.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [role, req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'User not found.' });
  res.json(result.rows[0]);
}));

module.exports = router;
