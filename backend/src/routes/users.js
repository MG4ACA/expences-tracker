const router = require('express').Router();
const userService = require('../services/userService');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All user routes require admin
router.use(authenticate, requireAdmin);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email, and password required' });

  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    await userService.update(req.params.id, req.body);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    await userService.remove(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
