const db = require('../config/db');

async function getDailyProgress(userId, isAdmin, date) {
  // ── Businesses added on date ─────────────────────────────────────
  const [businesses] = await db.query(
    isAdmin
      ? `SELECT b.id, b.name, b.type, b.city, b.status,
                u.name AS assigned_name, a.name AS added_by_name
         FROM businesses b
         LEFT JOIN users u ON b.assigned_to = u.id
         LEFT JOIN users a ON b.added_by = a.id
         WHERE DATE(b.created_at) = ?
         ORDER BY b.created_at DESC`
      : `SELECT b.id, b.name, b.type, b.city, b.status,
                u.name AS assigned_name, a.name AS added_by_name
         FROM businesses b
         LEFT JOIN users u ON b.assigned_to = u.id
         LEFT JOIN users a ON b.added_by = a.id
         WHERE DATE(b.created_at) = ? AND (b.assigned_to = ? OR b.added_by = ?)
         ORDER BY b.created_at DESC`,
    isAdmin ? [date] : [date, userId, userId],
  );

  // ── Todos added on date ──────────────────────────────────────────
  const [todosAdded] = await db.query(
    `SELECT id, title, description, status, priority, due_date
     FROM todos
     WHERE user_id = ? AND DATE(created_at) = ?
     ORDER BY created_at DESC`,
    [userId, date],
  );

  // ── Todos completed on date ──────────────────────────────────────
  // Uses updated_at as the proxy for when a task was marked done
  const [todosCompleted] = await db.query(
    `SELECT id, title, description, status, priority, due_date
     FROM todos
     WHERE user_id = ? AND status = 'done' AND DATE(updated_at) = ?
     ORDER BY updated_at DESC`,
    [userId, date],
  );

  // ── Cold calls on date ───────────────────────────────────────────
  const [coldCalls] = await db.query(
    isAdmin
      ? `SELECT c.id, c.outcome, c.notes, c.next_followup,
                b.id AS business_id, b.name AS business_name,
                u.name AS caller_name
         FROM cold_calls c
         LEFT JOIN businesses b ON c.business_id = b.id
         LEFT JOIN users u ON c.called_by = u.id
         WHERE c.call_date = ?
         ORDER BY c.created_at DESC`
      : `SELECT c.id, c.outcome, c.notes, c.next_followup,
                b.id AS business_id, b.name AS business_name,
                u.name AS caller_name
         FROM cold_calls c
         LEFT JOIN businesses b ON c.business_id = b.id
         LEFT JOIN users u ON c.called_by = u.id
         WHERE c.call_date = ? AND c.called_by = ?
         ORDER BY c.created_at DESC`,
    isAdmin ? [date] : [date, userId],
  );

  // Outcome breakdown
  const outcomeCounts = {};
  for (const call of coldCalls) {
    const key = call.outcome || 'unknown';
    outcomeCounts[key] = (outcomeCounts[key] || 0) + 1;
  }

  return {
    date,
    businesses: { count: businesses.length, items: businesses },
    todosAdded: { count: todosAdded.length, items: todosAdded },
    todosCompleted: { count: todosCompleted.length, items: todosCompleted },
    coldCalls: { count: coldCalls.length, outcomeCounts, items: coldCalls },
  };
}

module.exports = { getDailyProgress };
