require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs/promises');
const path = require('path');
const db = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const uploadsDirectory = path.join(__dirname, 'uploads');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadsDirectory, { fallthrough: false, maxAge: '1d' }));

app.get('/api/health', async (_req, res, next) => {
  try {
    const result = await db.query('SELECT NOW() AS database_time');
    res.json({ status: 'ok', database: 'connected', database_time: result.rows[0].database_time });
  } catch (error) {
    next(error);
  }
});
app.use('/api', apiRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof require('multer').MulterError) {
    return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      message: error.code === 'LIMIT_FILE_SIZE' ? 'PDF files must be 20 MB or smaller.' : error.message,
    });
  }
  if (error.message === 'Only PDF files are accepted.') return res.status(400).json({ message: error.message });
  if (error.code === '23503') return res.status(404).json({ message: 'The requested resource was not found.' });
  if (error.code === '23505') return res.status(409).json({ message: 'This record already exists.' });
  console.error('API request failed:', error);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a random secret with at least 32 characters.');
  }
  await fs.mkdir(uploadsDirectory, { recursive: true });
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(schema);
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`Academic Social API listening on http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Could not start the API:', error);
    process.exitCode = 1;
  });
}

module.exports = app;
