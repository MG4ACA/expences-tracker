require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded screenshot images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api/coldcalls', require('./routes/coldcalls'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/screenshots', require('./routes/screenshots'));
app.use('/api/progress', require('./routes/progress'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Lumicore Tracker API running on port ${PORT}`);
  // Clean up any queue items stuck in 'processing' from a previous server crash
  try {
    await require('./services/screenshotService').cleanStuckProcessing();
  } catch (_) {
    /* non-fatal */
  }
});
