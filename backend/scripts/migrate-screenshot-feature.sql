-- Migration: Add screenshot import feature
-- Run this ONCE on your existing database to add the new column and table.
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT COLUMN).

USE lumicore_tracker;

-- ── 1. Add social_media_url column to businesses ─────────────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS social_media_url VARCHAR(255) AFTER website;

-- ── 2. Add image_hash column (duplicate image detection) ─────────────
-- Note: skip if already added
ALTER TABLE screenshot_queue
  ADD COLUMN image_hash VARCHAR(32) AFTER image_filename;

-- ── 3. Create screenshot_queue table (for fresh installs) ────────────
CREATE TABLE IF NOT EXISTS screenshot_queue (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  uploaded_by          INT NOT NULL,
  image_filename       VARCHAR(255),
  image_hash           VARCHAR(32),
  status               ENUM('processing', 'pending_review', 'approved', 'discarded', 'error') DEFAULT 'processing',
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
);

SELECT 'Migration complete' AS result;
