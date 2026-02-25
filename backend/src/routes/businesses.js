const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

// GET /api/businesses
router.get('/', async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `SELECT b.*, u.name AS assigned_name, a.name AS added_by_name
               FROM businesses b
               LEFT JOIN users u ON b.assigned_to = u.id
               LEFT JOIN users a ON b.added_by = a.id
               ORDER BY b.created_at DESC`;
      params = [];
    } else {
      query = `SELECT b.*, u.name AS assigned_name, a.name AS added_by_name
               FROM businesses b
               LEFT JOIN users u ON b.assigned_to = u.id
               LEFT JOIN users a ON b.added_by = a.id
               WHERE b.assigned_to = ? OR b.added_by = ?
               ORDER BY b.created_at DESC`;
      params = [req.user.id, req.user.id];
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/businesses/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, u.name AS assigned_name FROM businesses b
       LEFT JOIN users u ON b.assigned_to = u.id WHERE b.id = ?`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ message: 'Business not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/businesses
router.post('/', async (req, res) => {
  const { name, type, phone, address, city, google_maps_url, website, assigned_to, notes } =
    req.body;
  if (!name) return res.status(400).json({ message: 'Business name is required' });

  try {
    const [result] = await db.query(
      'INSERT INTO businesses (name, type, phone, address, city, google_maps_url, website, assigned_to, added_by, notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [
        name,
        type,
        phone,
        address,
        city,
        google_maps_url,
        website,
        assigned_to || req.user.id,
        req.user.id,
        notes,
      ],
    );
    res.status(201).json({ id: result.insertId, message: 'Business created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/businesses/:id
router.put('/:id', async (req, res) => {
  const { name, type, phone, address, city, google_maps_url, website, status, assigned_to, notes } =
    req.body;
  try {
    await db.query(
      'UPDATE businesses SET name=?, type=?, phone=?, address=?, city=?, google_maps_url=?, website=?, status=?, assigned_to=?, notes=? WHERE id=?',
      [
        name,
        type,
        phone,
        address,
        city,
        google_maps_url,
        website,
        status,
        assigned_to,
        notes,
        req.params.id,
      ],
    );
    res.json({ message: 'Business updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/businesses/:id  (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM businesses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Business deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/businesses/:id/calls
router.get('/:id/calls', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.name AS caller_name FROM cold_calls c
       LEFT JOIN users u ON c.called_by = u.id
       WHERE c.business_id = ? ORDER BY c.call_date DESC`,
      [req.params.id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/businesses/:id/calls
router.post('/:id/calls', async (req, res) => {
  const { call_date, outcome, notes, next_followup } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO cold_calls (business_id, called_by, call_date, outcome, notes, next_followup) VALUES (?,?,?,?,?,?)',
      [req.params.id, req.user.id, call_date, outcome, notes, next_followup],
    );
    res.status(201).json({ id: result.insertId, message: 'Call logged' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
