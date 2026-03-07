/**
 * 005_add_business_id_to_screenshot_queue
 * ─────────────────────────────────────────────────────────────────
 * Safely adds business_id foreign key to screenshot_queue for production.
 *
 * Steps:
 *   1. Add business_id column (nullable) if missing
 *   2. Backfill business_id for approved items:
 *      - Match by extracted_name and extracted_phone where possible
 *      - Leaves unmatched items as NULL (safe)
 *   3. Add the CASCADE DELETE foreign key constraint
 *
 * Idempotent — safe to run multiple times.
 */

async function up(db) {
  // ── 1. Add business_id column if it doesn't exist ────────────────
  const [bizColumns] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'screenshot_queue'
      AND COLUMN_NAME  = 'business_id'
  `);

  if (bizColumns.length === 0) {
    console.log('      adding: screenshot_queue.business_id column');
    await db.query(`
      ALTER TABLE screenshot_queue
        ADD COLUMN business_id INT NULL AFTER uploaded_by
    `);
  } else {
    console.log('      skip:   screenshot_queue.business_id already exists');
  }

  // ── 2. Backfill business_id for approved items ────────────────────
  console.log('      backfilling approved items with business_id...');

  // Get all approved items that don't have a business_id yet
  const [approvedItems] = await db.query(`
    SELECT id, extracted_name, extracted_phone
    FROM screenshot_queue
    WHERE status = 'approved' AND business_id IS NULL
  `);

  let matched = 0;
  let unmatched = 0;

  for (const item of approvedItems) {
    let found = false;

    // Try to match by phone first (more reliable)
    if (item.extracted_phone) {
      const [phoneMatch] = await db.query('SELECT id FROM businesses WHERE phone = ? LIMIT 1', [
        item.extracted_phone,
      ]);
      if (phoneMatch.length > 0) {
        await db.query('UPDATE screenshot_queue SET business_id = ? WHERE id = ?', [
          phoneMatch[0].id,
          item.id,
        ]);
        matched++;
        found = true;
      }
    }

    // If not found by phone, try by name
    if (!found && item.extracted_name) {
      const [nameMatch] = await db.query('SELECT id FROM businesses WHERE name = ? LIMIT 1', [
        item.extracted_name,
      ]);
      if (nameMatch.length > 0) {
        await db.query('UPDATE screenshot_queue SET business_id = ? WHERE id = ?', [
          nameMatch[0].id,
          item.id,
        ]);
        matched++;
        found = true;
      }
    }

    if (!found) {
      unmatched++;
    }
  }

  console.log(`      backfill complete: ${matched} matched, ${unmatched} unmatched (left as NULL)`);

  // ── 3. Add foreign key constraint ────────────────────────────────
  const [constraints] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'screenshot_queue'
      AND COLUMN_NAME = 'business_id'
      AND REFERENCED_TABLE_NAME = 'businesses'
  `);

  if (constraints.length === 0) {
    console.log('      adding:  FK constraint fk_screenshot_business');
    try {
      await db.query(`
        ALTER TABLE screenshot_queue
          ADD CONSTRAINT fk_screenshot_business
          FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      `);
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log('      skip:    FK constraint already exists');
      } else {
        throw err;
      }
    }
  } else {
    console.log('      skip:    FK constraint already exists');
  }
}

async function down(db) {
  // Remove the foreign key constraint
  const [constraints] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'screenshot_queue'
      AND COLUMN_NAME = 'business_id'
      AND REFERENCED_TABLE_NAME = 'businesses'
  `);

  if (constraints.length > 0) {
    await db.query(
      `ALTER TABLE screenshot_queue DROP FOREIGN KEY ${constraints[0].CONSTRAINT_NAME}`,
    );
    console.log('      dropped: FK constraint');
  }

  // Remove the business_id column
  const [bizColumns] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'screenshot_queue'
      AND COLUMN_NAME  = 'business_id'
  `);

  if (bizColumns.length > 0) {
    await db.query('ALTER TABLE screenshot_queue DROP COLUMN business_id');
    console.log('      dropped: screenshot_queue.business_id');
  }
}

module.exports = { up, down };
