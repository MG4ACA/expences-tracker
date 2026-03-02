const db = require('../config/db');
const { buildUpdate } = require('../utils/dbHelpers');

// ─── VPS Servers ──────────────────────────────────────────────────

async function getAllVps() {
  const [rows] = await db.query('SELECT * FROM vps_servers ORDER BY created_at ASC');
  return rows;
}

async function createVps({ label, host, notes }) {
  const [result] = await db.query('INSERT INTO vps_servers (label, host, notes) VALUES (?, ?, ?)', [
    label,
    host,
    notes || null,
  ]);
  return result.insertId;
}

async function updateVps(id, data) {
  const allowed = ['label', 'host', 'notes'];
  const fields = {};
  for (const key of allowed) if (data[key] !== undefined) fields[key] = data[key];
  const { set, values } = buildUpdate(fields);
  await db.query(`UPDATE vps_servers SET ${set} WHERE id = ?`, [...values, id]);
}

async function removeVps(id) {
  await db.query('DELETE FROM vps_servers WHERE id = ?', [id]);
}

// ─── Deployments ──────────────────────────────────────────────────

async function getAll() {
  const [rows] = await db.query(
    `SELECT d.*,
            b.name   AS business_name,
            v.label  AS vps_label,
            v.host   AS vps_host
     FROM deployments d
     LEFT JOIN businesses  b ON d.business_id = b.id
     LEFT JOIN vps_servers v ON d.vps_id      = v.id
     ORDER BY b.name ASC, d.pm2_app_name ASC`,
  );
  return rows;
}

async function getById(id) {
  const [rows] = await db.query(
    `SELECT d.*,
            b.name   AS business_name,
            v.label  AS vps_label,
            v.host   AS vps_host
     FROM deployments d
     LEFT JOIN businesses  b ON d.business_id = b.id
     LEFT JOIN vps_servers v ON d.vps_id      = v.id
     WHERE d.id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function create({ business_id, vps_id, pm2_app_name, port, vps_path, status, notes }) {
  const [result] = await db.query(
    `INSERT INTO deployments
       (business_id, vps_id, pm2_app_name, port, vps_path, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      business_id,
      vps_id || null,
      pm2_app_name,
      port,
      vps_path || null,
      status || 'unknown',
      notes || null,
    ],
  );
  return result.insertId;
}

async function update(id, data) {
  const allowed = ['business_id', 'vps_id', 'pm2_app_name', 'port', 'vps_path', 'status', 'notes'];
  const fields = {};
  for (const key of allowed) if (data[key] !== undefined) fields[key] = data[key];
  const { set, values } = buildUpdate(fields);
  await db.query(`UPDATE deployments SET ${set} WHERE id = ?`, [...values, id]);
}

async function remove(id) {
  await db.query('DELETE FROM deployments WHERE id = ?', [id]);
}

/**
 * Phase 2 — called by VPS agent to push live status.
 * Validates the agent_secret before updating.
 */
async function agentStatusUpdate(id, secret, { status, notes }) {
  const [rows] = await db.query('SELECT agent_secret FROM deployments WHERE id = ?', [id]);
  if (!rows[0]) return { ok: false, reason: 'not_found' };
  if (rows[0].agent_secret !== secret) return { ok: false, reason: 'unauthorized' };

  await db.query(
    `UPDATE deployments
     SET status = ?, last_seen_at = NOW(), notes = COALESCE(?, notes)
     WHERE id = ?`,
    [status, notes || null, id],
  );
  return { ok: true };
}

module.exports = {
  getAllVps,
  createVps,
  updateVps,
  removeVps,
  getAll,
  getById,
  create,
  update,
  remove,
  agentStatusUpdate,
};
