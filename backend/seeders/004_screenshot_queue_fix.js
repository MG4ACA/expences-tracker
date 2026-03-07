/**
 * 004_screenshot_queue_fix
 * ─────────────────────────────────────────────────────────────────
 * Repairs databases where 003_screenshot_feature was recorded as
 * run but the schema changes were never applied (e.g. it errored
 * silently).
 *
 * Idempotent — safe to run multiple times.
 *
 * Changes applied:
 *   1. businesses.social_media_url  — added if missing
 *   2. screenshot_queue table       — created if missing (with image_hash)
 *   3. screenshot_queue.image_hash  — added if table existed but column is missing
 */

async function up(db) {
  // ── 1. businesses.social_media_url ───────────────────────────────
  const [socialCols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'businesses'
      AND COLUMN_NAME  = 'social_media_url'
  `);
  if (socialCols.length === 0) {
    await db.query(`
      ALTER TABLE businesses
        ADD COLUMN social_media_url VARCHAR(255) AFTER website
    `);
    console.log('      added: businesses.social_media_url');
  } else {
    console.log('      skip:  businesses.social_media_url already exists');
  }

  // ── 2. screenshot_queue table ─────────────────────────────────────
  const [tables] = await db.query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'screenshot_queue'
  `);

  if (tables.length === 0) {
    // Table does not exist at all — create it with image_hash included
    await db.query(`
      CREATE TABLE screenshot_queue (
        id                   INT PRIMARY KEY AUTO_INCREMENT,
        uploaded_by          INT NOT NULL,
        business_id          INT,
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
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);
    console.log('      created: screenshot_queue (with image_hash)');
  } else {
    console.log('      skip:  screenshot_queue already exists — checking columns…');

    // ── 3. screenshot_queue.business_id ─────────────────────────────
    const [bizCols] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = 'screenshot_queue'
        AND COLUMN_NAME  = 'business_id'
    `);
    if (bizCols.length === 0) {
      await db.query(`
        ALTER TABLE screenshot_queue
          ADD COLUMN business_id INT AFTER uploaded_by
      `);
      // Add the foreign key constraint
      try {
        await db.query(`
          ALTER TABLE screenshot_queue
            ADD CONSTRAINT fk_screenshot_business
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
        `);
        console.log('      added: screenshot_queue.business_id with CASCADE DELETE');
      } catch (err) {
        if (err.message && err.message.includes('already exists')) {
          console.log('      skip:  FK constraint already exists');
        } else {
          throw err;
        }
      }
    } else {
      console.log('      skip:  screenshot_queue.business_id already exists');
    }

    // ── 4. screenshot_queue.image_hash ──────────────────────────────
    const [hashCols] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = 'screenshot_queue'
        AND COLUMN_NAME  = 'image_hash'
    `);
    if (hashCols.length === 0) {
      await db.query(`
        ALTER TABLE screenshot_queue
          ADD COLUMN image_hash VARCHAR(32) AFTER image_filename
      `);
      console.log('      added: screenshot_queue.image_hash');
    } else {
      console.log('      skip:  screenshot_queue.image_hash already exists');
    }
  }
}

async function down(db) {
  // Remove image_hash column if present
  const [hashCols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'screenshot_queue'
      AND COLUMN_NAME  = 'image_hash'
  `);
  if (hashCols.length > 0) {
    await db.query('ALTER TABLE screenshot_queue DROP COLUMN image_hash');
    console.log('      dropped: screenshot_queue.image_hash');
  }
}

module.exports = { up, down };
