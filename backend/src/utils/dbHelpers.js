/**
 * Builds a dynamic SQL SET clause from a plain object,
 * skipping keys whose value is undefined.
 *
 * Returns { set: "col1=?,col2=?", values: [...] }
 * Throws if no updatable fields are found.
 */
function buildUpdate(fields) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) throw new Error('No fields to update');
  const set = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  return { set, values };
}

module.exports = { buildUpdate };
