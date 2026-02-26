const router = require('express').Router();
const businessService = require('../services/businessService');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

// GET /api/businesses
router.get('/', async (req, res) => {
  try {
    const businesses = await businessService.getAll(req.user.id, req.user.role === 'admin');
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/businesses/:id
router.get('/:id', async (req, res) => {
  try {
    const business = await businessService.getById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    res.json(business);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/businesses
router.post('/', async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: 'Business name is required' });
  try {
    const id = await businessService.create(req.body, req.user.id);
    res.status(201).json({ id, message: 'Business created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/businesses/:id
router.put('/:id', async (req, res) => {
  try {
    await businessService.update(req.params.id, req.body);
    res.json({ message: 'Business updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/businesses/:id  (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await businessService.remove(req.params.id);
    res.json({ message: 'Business deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/businesses/:id/calls
router.get('/:id/calls', async (req, res) => {
  try {
    const calls = await businessService.getCallsForBusiness(req.params.id);
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/businesses/:id/calls
router.post('/:id/calls', async (req, res) => {
  try {
    const id = await businessService.addCall(req.params.id, req.user.id, req.body);
    res.status(201).json({ id, message: 'Call logged' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
