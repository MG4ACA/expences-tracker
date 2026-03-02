/**
 * 000_vps_servers
 * Seeds the initial VPS server entries.
 * Add more VPS hosts here as the business grows.
 */

const VPS_SERVERS = [
  {
    label: 'Hostinger VPS 1',
    host: '(your-vps-ip)', // update to actual IP after first deploy
    notes: 'Primary shared VPS — runs all current client apps',
  },
];

async function up(db) {
  const [existing] = await db.query('SELECT label FROM vps_servers');
  const existingLabels = new Set(existing.map((r) => r.label));

  for (const vps of VPS_SERVERS) {
    if (existingLabels.has(vps.label)) {
      console.log(`      skip: VPS "${vps.label}" already exists`);
      continue;
    }
    await db.query('INSERT INTO vps_servers (label, host, notes) VALUES (?, ?, ?)', [
      vps.label,
      vps.host,
      vps.notes,
    ]);
    console.log(`      insert: "${vps.label}"`);
  }
}

async function down(db) {
  const labels = VPS_SERVERS.map((v) => v.label);
  await db.query(
    `DELETE FROM vps_servers WHERE label IN (${labels.map(() => '?').join(',')})`,
    labels,
  );
}

module.exports = { up, down };
