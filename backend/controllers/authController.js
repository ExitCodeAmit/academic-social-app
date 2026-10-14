const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const publicUser = ({ password_hash, ...user }) => user;

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  const { name, email, password, institution } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Name, a valid email, and a password of at least 8 characters are required.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, institution)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, bio, institution, profile_pic, created_at`,
      [name.trim(), normalizedEmail, passwordHash, institution?.trim() || null]
    );
    const user = result.rows[0];
    res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'An account with this email already exists.' });
    throw error;
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  res.json({ token: createToken(user), user: publicUser(user) });
};

exports.me = async (req, res) => {
  const result = await db.query(
    `SELECT id, name, email, role, bio, institution, profile_pic, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: 'User not found.' });
  res.json(result.rows[0]);
};
