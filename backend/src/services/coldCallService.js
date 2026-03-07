const db = require('../config/db');
const { buildUpdate } = require('../utils/dbHelpers');

async function getAllCalls(userId, isAdmin) {
  if (isAdmin) {
    const [rows] = await db.query(
      `SELECT c.*, b.name AS business_name, u.name AS caller_name
       FROM cold_calls c
       LEFT JOIN businesses b ON c.business_id = b.id
       LEFT JOIN users u ON c.called_by = u.id
       ORDER BY c.call_date DESC`,
    );
    return rows;
  }
  const [rows] = await db.query(
    `SELECT c.*, b.name AS business_name, u.name AS caller_name
     FROM cold_calls c
     LEFT JOIN businesses b ON c.business_id = b.id
     LEFT JOIN users u ON c.called_by = u.id
     WHERE c.called_by = ? OR b.assigned_to = ?
     ORDER BY c.call_date DESC`,
    [userId, userId],
  );
  return rows;
}

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

module.exports = { getAllCalls, update, remove };
