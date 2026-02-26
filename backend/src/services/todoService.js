const db = require('../config/db');

async function getAll(userId, { status, date } = {}) {
  let query = 'SELECT * FROM todos WHERE user_id = ?';
  const params = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (date) {
    query += ' AND due_date = ?';
    params.push(date);
  }
  query += ' ORDER BY due_date ASC, priority DESC';

  const [rows] = await db.query(query, params);
  return rows;
}

async function create(userId, { title, description, priority, due_date }) {
  const [result] = await db.query(
    'INSERT INTO todos (user_id, title, description, priority, due_date) VALUES (?,?,?,?,?)',
    [userId, title, description, priority || 'medium', due_date],
  );
  return result.insertId;
}

async function update(id, userId, { title, description, status, priority, due_date }) {
  await db.query(
    'UPDATE todos SET title=?, description=?, status=?, priority=?, due_date=? WHERE id=? AND user_id=?',
    [title, description, status, priority, due_date, id, userId],
  );
}

async function remove(id, userId) {
  await db.query('DELETE FROM todos WHERE id=? AND user_id=?', [id, userId]);
}

module.exports = { getAll, create, update, remove };
