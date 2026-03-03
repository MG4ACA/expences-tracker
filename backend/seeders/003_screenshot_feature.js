/**
 * 003_screenshot_feature
 * Adds the screenshot import queue table and the social_media_url
 * column to businesses. Safe to run on an existing database.
 */

async function up(db) {
  // 1. Add social_media_url to businesses (only if it doesn't exist yet)
  const [cols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'businesses'
      AND COLUMN_NAME  = 'social_media_url'
  `);
  if (cols.length === 0) {
    await db.query(`
      ALTER TABLE businesses
        ADD COLUMN social_media_url VARCHAR(255) AFTER website
    `);
    console.log('      added: businesses.social_media_url');
  } else {
    console.log('      skip: businesses.social_media_url already exists');
  }

  // 2. Create screenshot_queue table (includes image_hash for duplicate detection)
  await db.query(`
    CREATE TABLE IF NOT EXISTS screenshot_queue (
      id                   INT PRIMARY KEY AUTO_INCREMENT,
      uploaded_by          INT NOT NULL,
      image_filename       VARCHAR(255),
      image_hash           VARCHAR(32),
      status               ENUM('processing','pending_review','approved','discarded','error')
                             DEFAULT 'processing',
      extracted_name       VARCHAR(200),
      extracted_type       VARCHAR(100),
      extracted_phone      VARCHAR(50),
      extracted_address    TEXT,
      extracted_city       VARCHAR(100),
      extracted_website    VARCHAR(255),
      extracted_social_url VARCHAR(255),
      extracted_notes      TEXT,
      raw_response         JSON,
      error_message        TEXT,
      created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('      created: screenshot_queue');
}

async function down(db) {
  await db.query('DROP TABLE IF EXISTS screenshot_queue');
  console.log('      dropped: screenshot_queue');

  const [cols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'businesses'
      AND COLUMN_NAME  = 'social_media_url'
  `);
  if (cols.length > 0) {
    await db.query('ALTER TABLE businesses DROP COLUMN social_media_url');
    console.log('      dropped: businesses.social_media_url');
  }
}

module.exports = { up, down };
