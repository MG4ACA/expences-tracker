const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { buildUpdate } = require('../utils/dbHelpers');

async function getAll() {
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC',
  );
  return rows;
}

async function create({ name, email, password, role }) {
  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashed, role || 'employee'],
  );
  return { id: result.insertId, name, email, role: role || 'employee' };
}

async function update(id, { name, email, role, password }) {
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (email !== undefined) fields.email = email;
  if (role !== undefined) fields.role = role;
  if (password !== undefined) fields.password = await bcrypt.hash(password, 10);
  const { set, values } = buildUpdate(fields);
  await db.query(`UPDATE users SET ${set} WHERE id = ?`, [...values, id]);
}

async function remove(id) {
  await db.query('DELETE FROM users WHERE id = ?', [id]);
}

module.exports = { getAll, create, update, remove };
