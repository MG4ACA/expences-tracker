require('dotenv').config();
const db = require('../src/config/db');

async function run() {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'screenshot_queue' AND COLUMN_NAME = 'image_hash'`,
    [process.env.DB_NAME || 'lumicore_tracker'],
  );

  if (rows.length > 0) {
    console.log('image_hash column already exists — nothing to do.');
  } else {
    await db.query(
      'ALTER TABLE screenshot_queue ADD COLUMN image_hash VARCHAR(32) AFTER image_filename',
    );
    console.log('image_hash column added successfully.');
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
