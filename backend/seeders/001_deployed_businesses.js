/**
 * 001_deployed_businesses
 * Inserts the 7 already-live client businesses.
 * Skips any individual entry that already exists (matched by name).
 */

const BUSINESSES = [
  {
    name: 'Pharmacy POS',
    type: 'Healthcare / POS',
    notes: 'Deployed client. PM2: pharmacy-pos-backend',
  },
  { name: 'SG Prime', type: 'Business', notes: 'Deployed client. PM2: sg-prime-backend' },
  {
    name: 'Lumicore Tracker',
    type: 'Internal Tool',
    notes: 'Internal system. PM2: lumicore-tracker-backend',
  },
  { name: 'Inco Tech', type: 'Technology', notes: 'Deployed client. PM2: inco-tech-backend' },
  {
    name: 'Flour Dude',
    type: 'Food & Beverage',
    notes: 'Deployed client. PM2: flour-dude-backend',
  },
  {
    name: 'Hasal Products',
    type: 'E-commerce / Products',
    notes: 'Deployed client. PM2: hasal-products-backend',
  },
  {
    name: 'Dambulu Furniture',
    type: 'Furniture / Retail',
    notes: 'Deployed client. PM2: dambulu-furniture-api',
  },
];

async function up(db) {
  // Fetch existing business names to avoid duplicates
  const [existing] = await db.query('SELECT name FROM businesses');
  const existingNames = new Set(existing.map((r) => r.name));

  for (const biz of BUSINESSES) {
    if (existingNames.has(biz.name)) {
      console.log(`      skip: business "${biz.name}" already exists`);
      continue;
    }
    await db.query(
      `INSERT INTO businesses (name, type, status, added_by, assigned_to, notes)
       VALUES (?, ?, 'converted', 1, 1, ?)`,
      [biz.name, biz.type, biz.notes],
    );
    console.log(`      insert: "${biz.name}"`);
  }
}

async function down(db) {
  const names = BUSINESSES.map((b) => b.name);
  await db.query(`DELETE FROM businesses WHERE name IN (${names.map(() => '?').join(',')})`, names);
}

module.exports = { up, down };
