const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/academic_social',
  ...(process.env.PGSSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error:', error));

module.exports = pool;