/**
 * Run this once to set/reset the admin user password.
 * Usage: node scripts/reset-admin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

async function resetAdmin() {
  const email = 'admin@lumicorelabs.com';
  const plainPassword = 'admin123';

  const hash = await bcrypt.hash(plainPassword, 10);
  console.log('Generated hash:', hash);

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

  if (existing.length) {
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hash, email]);
    console.log(`✅ Password updated for ${email}`);
  } else {
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      'Admin',
      email,
      hash,
      'admin',
    ]);
    console.log(`✅ Admin user created: ${email}`);
  }

  console.log(`\nLogin with:\n  Email:    ${email}\n  Password: ${plainPassword}`);
  process.exit(0);
}

resetAdmin().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
