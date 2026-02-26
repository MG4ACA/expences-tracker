const db = require('../config/db');

async function update(id, { call_date, outcome, notes, next_followup }) {
  await db.query(
    'UPDATE cold_calls SET call_date=?, outcome=?, notes=?, next_followup=? WHERE id=?',
    [call_date, outcome, notes, next_followup, id],
  );
}

async function remove(id) {
  await db.query('DELETE FROM cold_calls WHERE id = ?', [id]);
}

module.exports = { update, remove };
