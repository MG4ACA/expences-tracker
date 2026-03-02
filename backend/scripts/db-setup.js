/**
 * db-setup.js
 * Creates the database (if not exists) and applies database.sql schema.
 * Reads credentials from .env — no mysql CLI required.
 *
 * Usage:  npm run db:setup
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME) {
  console.error('  ✗ Missing DB_HOST, DB_USER or DB_NAME in .env');
  process.exit(1);
}

(async () => {
  // Connect WITHOUT specifying a database so we can CREATE it
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log(`\n  [db:setup] Connected to MySQL at ${DB_HOST}`);

    const sql = fs.readFileSync(path.join(__dirname, '..', 'database.sql'), 'utf8');
    await conn.query(sql);

    console.log(`  ✓ Schema applied to database "${DB_NAME}"`);
    console.log('  ✓ Run "npm run seed" to populate initial data.\n');
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error(`  ✗ db:setup failed: ${err.message}`);
  process.exit(1);
});
