const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/todos?status=pending&date=2026-02-26
router.get('/', async (req, res) => {
  const { status, date } = req.query;
  let query = 'SELECT * FROM todos WHERE user_id = ?';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (date) {
    query += ' AND due_date = ?';
    params.push(date);
  }
  query += ' ORDER BY due_date ASC, priority DESC';

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/todos
router.post('/', async (req, res) => {
  const { title, description, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO todos (user_id, title, description, priority, due_date) VALUES (?,?,?,?,?)',
      [req.user.id, title, description, priority || 'medium', due_date],
    );
    res.status(201).json({ id: result.insertId, message: 'Todo created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  try {
    await db.query(
      'UPDATE todos SET title=?, description=?, status=?, priority=?, due_date=? WHERE id=? AND user_id=?',
      [title, description, status, priority, due_date, req.params.id, req.user.id],
    );
    res.json({ message: 'Todo updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM todos WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
