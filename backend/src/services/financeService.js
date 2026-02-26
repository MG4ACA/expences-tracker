const db = require('../config/db');

// ── Categories ────────────────────────────────────────────────────

async function getCategories(userId) {
  const [rows] = await db.query(
    'SELECT * FROM finance_categories WHERE user_id = ? ORDER BY type, name',
    [userId],
  );
  return rows;
}

async function createCategory(userId, name, type) {
  const [result] = await db.query(
    'INSERT INTO finance_categories (user_id, name, type) VALUES (?,?,?)',
    [userId, name, type],
  );
  return result.insertId;
}

async function deleteCategory(id, userId) {
  await db.query('DELETE FROM finance_categories WHERE id=? AND user_id=?', [id, userId]);
}

// ── Records ───────────────────────────────────────────────────────

async function getRecords(userId, { month, type } = {}) {
  let query = `SELECT r.*, c.name AS category_name FROM finance_records r
               LEFT JOIN finance_categories c ON r.category_id = c.id
               WHERE r.user_id = ?`;
  const params = [userId];

  if (month) {
    query += ' AND DATE_FORMAT(r.date, "%Y-%m") = ?';
    params.push(month);
  }
  if (type) {
    query += ' AND r.type = ?';
    params.push(type);
  }
  query += ' ORDER BY r.date DESC';

  const [rows] = await db.query(query, params);
  return rows;
}

async function getSummary(userId, month) {
  const [rows] = await db.query(
    `SELECT type, SUM(amount) AS total FROM finance_records
     WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?
     GROUP BY type`,
    [userId, month],
  );
  const summary = { income: 0, expense: 0 };
  rows.forEach((r) => {
    summary[r.type] = parseFloat(r.total);
  });
  summary.net = summary.income - summary.expense;
  return summary;
}

async function createRecord(userId, { category_id, type, amount, description, date }) {
  const [result] = await db.query(
    'INSERT INTO finance_records (user_id, category_id, type, amount, description, date) VALUES (?,?,?,?,?,?)',
    [userId, category_id, type, amount, description, date],
  );
  return result.insertId;
}

async function updateRecord(id, userId, { category_id, type, amount, description, date }) {
  await db.query(
    'UPDATE finance_records SET category_id=?, type=?, amount=?, description=?, date=? WHERE id=? AND user_id=?',
    [category_id, type, amount, description, date, id, userId],
  );
}

async function deleteRecord(id, userId) {
  await db.query('DELETE FROM finance_records WHERE id=? AND user_id=?', [id, userId]);
}

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
  getRecords,
  getSummary,
  createRecord,
  updateRecord,
  deleteRecord,
};
