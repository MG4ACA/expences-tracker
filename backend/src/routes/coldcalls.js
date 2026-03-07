const router = require('express').Router();
const coldCallService = require('../services/coldCallService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/coldcalls — all calls (admin: all, user: their calls or assigned businesses)
router.get('/', async (req, res) => {
  try {
    const calls = await coldCallService.getAllCalls(req.user.id, req.user.role === 'admin');
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/coldcalls/:id
router.put('/:id', async (req, res) => {
  try {
    await coldCallService.update(req.params.id, req.body);
    res.json({ message: 'Call updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/coldcalls/:id
router.delete('/:id', async (req, res) => {
  try {
    await coldCallService.remove(req.params.id);
    res.json({ message: 'Call deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
