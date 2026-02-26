const router = require('express').Router();
const financeService = require('../services/financeService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── Categories ────────────────────────────────────────────────────

// GET /api/finance/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await financeService.getCategories(req.user.id);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/finance/categories
router.post('/categories', async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Name and type required' });
  try {
    const id = await financeService.createCategory(req.user.id, name, type);
    res.status(201).json({ id, name, type });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/finance/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    await financeService.deleteCategory(req.params.id, req.user.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── Records ───────────────────────────────────────────────────────

// GET /api/finance/records?month=2026-02&type=expense
router.get('/records', async (req, res) => {
  try {
    const records = await financeService.getRecords(req.user.id, req.query);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/finance/summary  — monthly income vs expense totals
router.get('/summary', async (req, res) => {
  const targetMonth = req.query.month || new Date().toISOString().slice(0, 7);
  try {
    const summary = await financeService.getSummary(req.user.id, targetMonth);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/finance/records
router.post('/records', async (req, res) => {
  const { type, amount, date } = req.body;
  if (!type || !amount || !date)
    return res.status(400).json({ message: 'Type, amount, and date required' });
  try {
    const id = await financeService.createRecord(req.user.id, req.body);
    res.status(201).json({ id, message: 'Record added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/finance/records/:id
router.put('/records/:id', async (req, res) => {
  try {
    await financeService.updateRecord(req.params.id, req.user.id, req.body);
    res.json({ message: 'Record updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/finance/records/:id
router.delete('/records/:id', async (req, res) => {
  try {
    await financeService.deleteRecord(req.params.id, req.user.id);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
