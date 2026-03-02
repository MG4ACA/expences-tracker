/**
 * 002_deployed_deployments
 * Inserts PM2 deployment records for each live client.
 * Requires 001_deployed_businesses to have run first.
 * Skips any entry where pm2_app_name already exists in deployments.
 * vps_id = 1 → "Hostinger VPS 1" (inserted by migrate-deployments.sql)
 */

const DEPLOYMENTS = [
  {
    businessName: 'Pharmacy POS',
    pm2_app_name: 'pharmacy-pos-backend',
    port: 3000,
    vps_path: '/var/www/p',
  },
  {
    businessName: 'SG Prime',
    pm2_app_name: 'sg-prime-backend',
    port: 3001,
    vps_path: '/var/www/s',
  },
  {
    businessName: 'Lumicore Tracker',
    pm2_app_name: 'lumicore-tracker-backend',
    port: 3002,
    vps_path: '/var/www/l',
  },
  {
    businessName: 'Inco Tech',
    pm2_app_name: 'inco-tech-backend',
    port: 8000,
    vps_path: '/var/www/i',
  },
  {
    businessName: 'Flour Dude',
    pm2_app_name: 'flour-dude-backend',
    port: 6000,
    vps_path: '/var/www/f',
  },
  {
    businessName: 'Hasal Products',
    pm2_app_name: 'hasal-products-backend',
    port: 4000,
    vps_path: '/var/www/h',
  },
  {
    businessName: 'Dambulu Furniture',
    pm2_app_name: 'dambulu-furniture-api',
    port: null,
    vps_path: null,
  },
];

async function up(db) {
  // Build a name→id map for businesses
  const [bizRows] = await db.query('SELECT id, name FROM businesses');
  const bizMap = Object.fromEntries(bizRows.map((r) => [r.name, r.id]));

  // Fetch existing pm2_app_names
  const [depRows] = await db.query('SELECT pm2_app_name FROM deployments');
  const existingApps = new Set(depRows.map((r) => r.pm2_app_name));

  // Resolve vps_id = 1 (Hostinger VPS 1); fall back if it doesn't exist yet
  const [vpsRows] = await db.query(
    "SELECT id FROM vps_servers WHERE label = 'Hostinger VPS 1' LIMIT 1",
  );
  const vpsId = vpsRows[0]?.id || null;

  for (const dep of DEPLOYMENTS) {
    if (existingApps.has(dep.pm2_app_name)) {
      console.log(`      skip: deployment "${dep.pm2_app_name}" already exists`);
      continue;
    }

    const businessId = bizMap[dep.businessName];
    if (!businessId) {
      throw new Error(
        `Business "${dep.businessName}" not found — run 001_deployed_businesses first.`,
      );
    }

    await db.query(
      `INSERT INTO deployments (business_id, vps_id, pm2_app_name, port, vps_path, status)
       VALUES (?, ?, ?, ?, ?, 'online')`,
      [businessId, vpsId, dep.pm2_app_name, dep.port ?? 0, dep.vps_path],
    );
    console.log(`      insert: "${dep.pm2_app_name}" → port ${dep.port ?? '(unknown)'}`);
  }
}

async function down(db) {
  const apps = DEPLOYMENTS.map((d) => d.pm2_app_name);
  await db.query(
    `DELETE FROM deployments WHERE pm2_app_name IN (${apps.map(() => '?').join(',')})`,
    apps,
  );
}

module.exports = { up, down };
