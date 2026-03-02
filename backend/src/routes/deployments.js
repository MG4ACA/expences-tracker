const router = require('express').Router();
const svc = require('../services/deploymentService');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ─── Phase 2: VPS agent status push (no JWT, uses agent_secret in body) ──────
// POST /api/deployments/agent/status
// Body: { id, secret, status, notes }
router.post('/agent/status', async (req, res) => {
  const { id, secret, status, notes } = req.body;
  if (!id || !secret || !status) {
    return res.status(400).json({ message: 'id, secret and status are required' });
  }
  const allowed = ['online', 'offline', 'error', 'unknown'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
  }
  try {
    const result = await svc.agentStatusUpdate(id, secret, { status, notes });
    if (!result.ok) {
      const code = result.reason === 'not_found' ? 404 : 403;
      return res.status(code).json({ message: result.reason });
    }
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// All remaining routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── VPS Servers ──────────────────────────────────────────────────────────────

// GET /api/deployments/vps
router.get('/vps', async (_req, res) => {
  try {
    res.json(await svc.getAllVps());
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/deployments/vps
router.post('/vps', async (req, res) => {
  const { label, host } = req.body;
  if (!label || !host) {
    return res.status(400).json({ message: 'label and host are required' });
  }
  try {
    const id = await svc.createVps(req.body);
    res.status(201).json({ id, message: 'VPS server created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/deployments/vps/:id
router.put('/vps/:id', async (req, res) => {
  try {
    await svc.updateVps(req.params.id, req.body);
    res.json({ message: 'VPS server updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/deployments/vps/:id
router.delete('/vps/:id', async (req, res) => {
  try {
    await svc.removeVps(req.params.id);
    res.json({ message: 'VPS server deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Deployments ──────────────────────────────────────────────────────────────

// GET /api/deployments
router.get('/', async (_req, res) => {
  try {
    res.json(await svc.getAll());
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/deployments/:id
router.get('/:id', async (req, res) => {
  try {
    const dep = await svc.getById(req.params.id);
    if (!dep) return res.status(404).json({ message: 'Deployment not found' });
    res.json(dep);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/deployments
router.post('/', async (req, res) => {
  const { business_id, pm2_app_name, port } = req.body;
  if (!business_id || !pm2_app_name || !port) {
    return res.status(400).json({ message: 'business_id, pm2_app_name and port are required' });
  }
  try {
    const id = await svc.create(req.body);
    res.status(201).json({ id, message: 'Deployment created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/deployments/:id
router.put('/:id', async (req, res) => {
  try {
    await svc.update(req.params.id, req.body);
    res.json({ message: 'Deployment updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/deployments/:id
router.delete('/:id', async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.json({ message: 'Deployment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
