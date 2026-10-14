const db = require('../config/db');

// Submit Research Paper
exports.uploadPaper = async (req, res) => {
  const { title, abstract, pdf_url, domain, doi } = req.body;
  const author_id = req.user.id;

  try {
    const newPaper = await db.query(
      `INSERT INTO research_papers (author_id, title, abstract, pdf_url, domain, doi, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [author_id, title, abstract, pdf_url, domain, doi || null]
    );

    res.status(201).json({
      message: 'Research paper submitted for review.',
      paper: newPaper.rows[0],
    });
  } catch (error) {
    console.error('Paper Upload Error:', error);
    res.status(500).json({ message: 'Server error uploading paper.' });
  }
};

// Admin/Moderator Approve Paper
exports.approvePaper = async (req, res) => {
  const { paperId } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  try {
    const updatedPaper = await db.query(
      `UPDATE research_papers SET status = $1 WHERE id = $2 RETURNING *`,
      [status, paperId]
    );

    if (updatedPaper.rows.length === 0) {
      return res.status(404).json({ message: 'Paper not found.' });
    }

    res.json({
      message: `Paper status updated to ${status}.`,
      paper: updatedPaper.rows[0],
    });
  } catch (error) {
    console.error('Paper Approval Error:', error);
    res.status(500).json({ message: 'Server error updating paper status.' });
  }
};

// Get All Approved Papers (Public Search)
exports.getApprovedPapers = async (req, res) => {
  const { search } = req.query;

  try {
    let queryText = `
      SELECT rp.*, u.name as author_name 
      FROM research_papers rp
      JOIN users u ON rp.author_id = u.id
      WHERE rp.status = 'approved'
    `;
    const queryParams = [];

    if (search) {
      queryText += ` AND (rp.title ILIKE $1 OR rp.domain ILIKE $1)`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` ORDER BY rp.created_at DESC`;

    const papers = await db.query(queryText, queryParams);
    res.json(papers.rows);
  } catch (error) {
    console.error('Fetch Papers Error:', error);
    res.status(500).json({ message: 'Server error fetching papers.' });
  }
};