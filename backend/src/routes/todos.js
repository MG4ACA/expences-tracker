const router = require('express').Router();
const todoService = require('../services/todoService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/todos?status=pending&date=2026-02-26
router.get('/', async (req, res) => {
  try {
    const todos = await todoService.getAll(req.user.id, req.query);
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/todos
router.post('/', async (req, res) => {
  if (!req.body.title) return res.status(400).json({ message: 'Title is required' });
  try {
    const id = await todoService.create(req.user.id, req.body);
    res.status(201).json({ id, message: 'Todo created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
  try {
    await todoService.update(req.params.id, req.user.id, req.body);
    res.json({ message: 'Todo updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
  try {
    await todoService.remove(req.params.id, req.user.id);
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
