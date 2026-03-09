const router = require('express').Router();
const progressService = require('../services/progressService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/progress?date=YYYY-MM-DD  (defaults to today)
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    // Basic date format validation to prevent injection
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const data = await progressService.getDailyProgress(
      req.user.id,
      req.user.role === 'admin',
      date,
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
