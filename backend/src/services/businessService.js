const db = require('../config/db');

async function getAll(userId, isAdmin) {
  if (isAdmin) {
    const [rows] = await db.query(
      `SELECT b.*, u.name AS assigned_name, a.name AS added_by_name
       FROM businesses b
       LEFT JOIN users u ON b.assigned_to = u.id
       LEFT JOIN users a ON b.added_by = a.id
       ORDER BY b.created_at DESC`,
    );
    return rows;
  }
  const [rows] = await db.query(
    `SELECT b.*, u.name AS assigned_name, a.name AS added_by_name
     FROM businesses b
     LEFT JOIN users u ON b.assigned_to = u.id
     LEFT JOIN users a ON b.added_by = a.id
     WHERE b.assigned_to = ? OR b.added_by = ?
     ORDER BY b.created_at DESC`,
    [userId, userId],
  );
  return rows;
}

async function getById(id) {
  const [rows] = await db.query(
    `SELECT b.*, u.name AS assigned_name FROM businesses b
     LEFT JOIN users u ON b.assigned_to = u.id WHERE b.id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function create(
  { name, type, phone, address, city, google_maps_url, website, assigned_to, notes },
  addedBy,
) {
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
      assigned_to || addedBy,
      addedBy,
      notes,
    ],
  );
  return result.insertId;
}

async function update(
  id,
  { name, type, phone, address, city, google_maps_url, website, status, assigned_to, notes },
) {
  await db.query(
    'UPDATE businesses SET name=?, type=?, phone=?, address=?, city=?, google_maps_url=?, website=?, status=?, assigned_to=?, notes=? WHERE id=?',
    [name, type, phone, address, city, google_maps_url, website, status, assigned_to, notes, id],
  );
}

async function remove(id) {
  await db.query('DELETE FROM businesses WHERE id = ?', [id]);
}

async function getCallsForBusiness(businessId) {
  const [rows] = await db.query(
    `SELECT c.*, u.name AS caller_name FROM cold_calls c
     LEFT JOIN users u ON c.called_by = u.id
     WHERE c.business_id = ? ORDER BY c.call_date DESC`,
    [businessId],
  );
  return rows;
}

async function addCall(businessId, calledBy, { call_date, outcome, notes, next_followup }) {
  const [result] = await db.query(
    'INSERT INTO cold_calls (business_id, called_by, call_date, outcome, notes, next_followup) VALUES (?,?,?,?,?,?)',
    [businessId, calledBy, call_date, outcome, notes, next_followup],
  );
  return result.insertId;
}

module.exports = { getAll, getById, create, update, remove, getCallsForBusiness, addCall };
