const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── Categories ────────────────────────────────────────────────────

// GET /api/finance/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM finance_categories WHERE user_id = ? ORDER BY type, name',
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/finance/categories
router.post('/categories', async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Name and type required' });
  try {
    const [result] = await db.query(
      'INSERT INTO finance_categories (user_id, name, type) VALUES (?,?,?)',
      [req.user.id, name, type],
    );
    res.status(201).json({ id: result.insertId, name, type });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/finance/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM finance_categories WHERE id=? AND user_id=?', [
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── Records ───────────────────────────────────────────────────────

// GET /api/finance/records?month=2026-02&type=expense
router.get('/records', async (req, res) => {
  const { month, type } = req.query;
  let query = `SELECT r.*, c.name AS category_name FROM finance_records r
               LEFT JOIN finance_categories c ON r.category_id = c.id
               WHERE r.user_id = ?`;
  const params = [req.user.id];

  if (month) {
    query += ' AND DATE_FORMAT(r.date, "%Y-%m") = ?';
    params.push(month);
  }
  if (type) {
    query += ' AND r.type = ?';
    params.push(type);
  }
  query += ' ORDER BY r.date DESC';

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/finance/summary  — monthly income vs expense totals
router.get('/summary', async (req, res) => {
  const { month } = req.query;
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  try {
    const [rows] = await db.query(
      `SELECT type, SUM(amount) AS total FROM finance_records
       WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?
       GROUP BY type`,
      [req.user.id, targetMonth],
    );
    const summary = { income: 0, expense: 0 };
    rows.forEach((r) => {
      summary[r.type] = parseFloat(r.total);
    });
    summary.net = summary.income - summary.expense;
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/finance/records
router.post('/records', async (req, res) => {
  const { category_id, type, amount, description, date } = req.body;
  if (!type || !amount || !date)
    return res.status(400).json({ message: 'Type, amount, and date required' });
  try {
    const [result] = await db.query(
      'INSERT INTO finance_records (user_id, category_id, type, amount, description, date) VALUES (?,?,?,?,?,?)',
      [req.user.id, category_id, type, amount, description, date],
    );
    res.status(201).json({ id: result.insertId, message: 'Record added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/finance/records/:id
router.put('/records/:id', async (req, res) => {
  const { category_id, type, amount, description, date } = req.body;
  try {
    await db.query(
      'UPDATE finance_records SET category_id=?, type=?, amount=?, description=?, date=? WHERE id=? AND user_id=?',
      [category_id, type, amount, description, date, req.params.id, req.user.id],
    );
    res.json({ message: 'Record updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/finance/records/:id
router.delete('/records/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM finance_records WHERE id=? AND user_id=?', [
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
