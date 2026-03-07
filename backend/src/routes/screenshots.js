const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const screenshotService = require('../services/screenshotService');

// ── Upload Storage ────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/screenshots');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed (jpg, png, webp, gif)'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────
// POST /api/screenshots/upload
// Accept multiple images, process each with Gemini, return queue items
// ─────────────────────────────────────────────────────────────────────
router.post('/upload', upload.array('screenshots', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const fileCount = req.files.length;
  console.log(`[screenshot] Upload received — ${fileCount} file(s) from user #${req.user.id}`);

  try {
    const results = await screenshotService.enqueueBatch(req.user.id, req.files);
    const okCount = results.filter((r) => r.status === 'pending_review').length;
    const errCount = results.filter((r) => r.status === 'error').length;
    console.log(`[screenshot] Upload complete — ${okCount} ok, ${errCount} failed`);
    res.status(201).json({ message: `${results.length} screenshot(s) processed`, results });
  } catch (err) {
    console.error(`[screenshot] Unexpected route error — ${err.message}`);
    res.status(500).json({ message: 'Processing error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/screenshots/queue
// List items in pending_review / processing / error state
// ─────────────────────────────────────────────────────────────────────
router.get('/queue', async (req, res) => {
  try {
    const items = await screenshotService.getQueue(req.user.id, req.user.role === 'admin');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// PUT /api/screenshots/queue/:id
// Update extracted fields before approving
// ─────────────────────────────────────────────────────────────────────
router.put('/queue/:id', async (req, res) => {
  try {
    await screenshotService.updateQueueItem(req.params.id, req.body);
    res.json({ message: 'Queue item updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/screenshots/queue/approve-all
// Approve every pending_review item in one request
// ─────────────────────────────────────────────────────────────────────
router.post('/queue/approve-all', async (req, res) => {
  try {
    const result = await screenshotService.approveAllPending(
      req.user.id,
      req.user.role === 'admin',
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/screenshots/queue/:id/approve
// Save extracted data as a new business
// ─────────────────────────────────────────────────────────────────────
router.post('/queue/:id/approve', async (req, res) => {
  try {
    const businessId = await screenshotService.approveQueueItem(req.params.id, req.user.id);
    res.json({ message: 'Business created from screenshot', businessId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/screenshots/queue/:id
// Discard a queue item (deletes image file too)
// ─────────────────────────────────────────────────────────────────────
router.delete('/queue/:id', async (req, res) => {
  try {
    await screenshotService.discardQueueItem(req.params.id);
    res.json({ message: 'Queue item discarded' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/screenshots/queue/:id/retry
// Re-run Gemini on a failed (error) queue item
// ─────────────────────────────────────────────────────────────────────
router.post('/queue/:id/retry', async (req, res) => {
  try {
    const result = await screenshotService.retryQueueItem(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/screenshots/history
// Approved and discarded items (audit log)
// ─────────────────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const items = await screenshotService.getHistory(req.user.id, req.user.role === 'admin');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
