/**
 * Seeder runner
 * ─────────────────────────────────────────────────────────────────
 * Tracks which seeders have already run in a `seed_history` table
 * so it is safe to execute on any environment without duplicating
 * data.
 *
 * Usage:
 *   node seeders/runner.js           — run all pending seeders
 *   node seeders/runner.js --status  — list seeder status (run / pending)
 *   node seeders/runner.js --fresh   — rollback all then re-run (DEV ONLY)
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('../src/config/db');

const SEEDERS_DIR = __dirname;
const FLAG = process.argv[2];

// ── helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`  [seed] ${msg}`);
}
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function skip(msg) {
  console.log(`  – ${msg} (already run)`);
}
function err(msg) {
  console.error(`  ✗ ${msg}`);
}

async function ensureHistoryTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS seed_history (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      name       VARCHAR(200) NOT NULL UNIQUE,
      ran_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getRanSeeders() {
  const [rows] = await db.query('SELECT name FROM seed_history');
  return new Set(rows.map((r) => r.name));
}

function getSeederFiles() {
  return fs
    .readdirSync(SEEDERS_DIR)
    .filter((f) => /^\d{3}_.*\.js$/.test(f))
    .sort();
}

// ── status ────────────────────────────────────────────────────────────────────

async function status() {
  await ensureHistoryTable();
  const ran = await getRanSeeders();
  const files = getSeederFiles();
  console.log('\nSeeder status:');
  for (const f of files) {
    const mark = ran.has(f) ? '✓ ran   ' : '○ pending';
    console.log(`  ${mark}  ${f}`);
  }
  console.log();
}

// ── run ───────────────────────────────────────────────────────────────────────

async function runPending() {
  await ensureHistoryTable();
  const ran = await getRanSeeders();
  const files = getSeederFiles();
  const pending = files.filter((f) => !ran.has(f));

  if (pending.length === 0) {
    log('Nothing to run — all seeders already applied.');
    return;
  }

  log(`Running ${pending.length} pending seeder(s)…\n`);

  for (const file of pending) {
    const seeder = require(path.join(SEEDERS_DIR, file));
    try {
      await seeder.up(db);
      await db.query('INSERT INTO seed_history (name) VALUES (?)', [file]);
      ok(file);
    } catch (e) {
      err(`${file} — ${e.message}`);
      process.exitCode = 1;
      break; // stop on first failure to avoid cascading bad state
    }
  }
  console.log();
}

// ── fresh (dev only) ──────────────────────────────────────────────────────────

async function fresh() {
  console.warn('\n  ⚠  --fresh will rollback then re-seed. Use in DEV only.\n');
  await ensureHistoryTable();
  const files = [...getSeederFiles()].reverse();

  log('Rolling back…');
  for (const file of files) {
    const seeder = require(path.join(SEEDERS_DIR, file));
    if (typeof seeder.down === 'function') {
      try {
        await seeder.down(db);
        await db.query('DELETE FROM seed_history WHERE name = ?', [file]);
        ok(`rollback: ${file}`);
      } catch (e) {
        err(`rollback ${file} — ${e.message}`);
      }
    }
  }
  console.log();
  log('Re-seeding…');
  await runPending();
}

// ── main ──────────────────────────────────────────────────────────────────────

(async () => {
  try {
    if (FLAG === '--status') await status();
    else if (FLAG === '--fresh') await fresh();
    else await runPending();
  } finally {
    await db.end();
  }
})();
