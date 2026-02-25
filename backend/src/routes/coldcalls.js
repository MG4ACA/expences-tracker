const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// PUT /api/coldcalls/:id
router.put('/:id', async (req, res) => {
  const { call_date, outcome, notes, next_followup } = req.body;
  try {
    await db.query(
      'UPDATE cold_calls SET call_date=?, outcome=?, notes=?, next_followup=? WHERE id=?',
      [call_date, outcome, notes, next_followup, req.params.id],
    );
    res.json({ message: 'Call updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/coldcalls/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cold_calls WHERE id = ?', [req.params.id]);
    res.json({ message: 'Call deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
