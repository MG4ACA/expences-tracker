const db = require('../config/db');
const { buildUpdate } = require('../utils/dbHelpers');

async function update(id, data) {
  const allowed = ['call_date', 'outcome', 'notes', 'next_followup'];
  const fields = {};
  for (const key of allowed) if (data[key] !== undefined) fields[key] = data[key];
  const { set, values } = buildUpdate(fields);
  await db.query(`UPDATE cold_calls SET ${set} WHERE id = ?`, [...values, id]);
}

async function remove(id) {
  await db.query('DELETE FROM cold_calls WHERE id = ?', [id]);
}

module.exports = { update, remove };
