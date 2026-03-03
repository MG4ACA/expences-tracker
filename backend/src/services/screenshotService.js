const { GoogleGenAI, createUserContent, createPartFromUri } = require('@google/genai');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EXTRACTION_PROMPT = `You are analyzing a social media screenshot (Facebook or TikTok) of a business page or profile.
Extract the following information and return ONLY a valid JSON object (no markdown, no extra text):
{
  "name": "business or page name",
  "type": "type of business (e.g. Restaurant, Salon, Retail, Clothing, etc.) — infer from the page content",
  "phone": "phone number if visible, otherwise null",
  "address": "street address if visible, otherwise null",
  "city": "city or town name if visible, otherwise null",
  "website": "website URL if visible, otherwise null",
  "social_url": "the Facebook/TikTok page URL or username handle if visible, otherwise null",
  "notes": "short summary of what this business does, services, or any useful detail (max 200 chars), otherwise null"
}

Rules:
- If a field is not found in the image, return null for that field
- For phone numbers, include the full number with country code if shown (e.g. +94 77 123 4567)
- Return ONLY the raw JSON object — no markdown, no code blocks, no extra explanation`;

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/**
 * Send an image to Gemini and return extracted business fields as an object.
 * Uses the Files API for upload — more efficient than base64 inline data.
 */
async function extractFromImage(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = MIME_MAP[ext] || 'image/jpeg';

  let uploadedFile;
  let rawText;
  try {
    // Upload the image via the Files API
    uploadedFile = await ai.files.upload({
      file: imagePath,
      config: { mimeType },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        createUserContent([
          EXTRACTION_PROMPT,
          createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
        ]),
      ],
    });
    rawText = response.text.trim();
  } catch (err) {
    if (err.message && err.message.includes('429')) {
      const retryMatch = err.message.match(/retry in ([\d.]+)s/i);
      const hint = retryMatch ? ` Try again in ${Math.ceil(retryMatch[1])} seconds.` : '';
      throw new Error(`Gemini rate limit reached.${hint}`);
    }
    throw err;
  } finally {
    // Clean up the uploaded file from Gemini's servers
    if (uploadedFile?.name) {
      try {
        await ai.files.delete(uploadedFile.name);
      } catch (_) {
        /* ignore cleanup errors */
      }
    }
  }

  // Strip markdown code fences if Gemini wraps the JSON
  const cleaned = rawText
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${cleaned.slice(0, 200)}`);
  }
}

/**
 * Insert a new queue item in 'processing' state and then run Gemini on it.
 * Updates the row to 'pending_review' (or 'error') when done.
 */
async function enqueueAndProcess(uploadedBy, imageFilename, imagePath) {
  // Insert as processing
  const [insertResult] = await db.query(
    'INSERT INTO screenshot_queue (uploaded_by, image_filename, status) VALUES (?, ?, ?)',
    [uploadedBy, imageFilename, 'processing'],
  );
  const queueId = insertResult.insertId;
  console.log(`[screenshot] [#${queueId}] Processing started — file: ${imageFilename}`);

  try {
    console.log(`[screenshot] [#${queueId}] Sending to Gemini...`);
    const extracted = await extractFromImage(imagePath);
    console.log(
      `[screenshot] [#${queueId}] Gemini extraction OK — name: "${extracted.name || 'unknown'}", phone: ${extracted.phone || 'none'}`,
    );

    await db.query(
      `UPDATE screenshot_queue SET
        status               = 'pending_review',
        extracted_name       = ?,
        extracted_type       = ?,
        extracted_phone      = ?,
        extracted_address    = ?,
        extracted_city       = ?,
        extracted_website    = ?,
        extracted_social_url = ?,
        extracted_notes      = ?,
        raw_response         = ?
       WHERE id = ?`,
      [
        extracted.name || null,
        extracted.type || null,
        extracted.phone || null,
        extracted.address || null,
        extracted.city || null,
        extracted.website || null,
        extracted.social_url || null,
        extracted.notes || null,
        JSON.stringify(extracted),
        queueId,
      ],
    );

    return { id: queueId, status: 'pending_review', extracted };
  } catch (err) {
    console.error(`[screenshot] [#${queueId}] Extraction FAILED — ${err.message}`);
    await db.query(`UPDATE screenshot_queue SET status = 'error', error_message = ? WHERE id = ?`, [
      err.message,
      queueId,
    ]);
    return { id: queueId, status: 'error', error: err.message };
  }
}

/**
 * Get all queue items that are not yet approved/discarded.
 * Admins see everyone's; employees see only their own.
 */
async function getQueue(userId, isAdmin) {
  if (isAdmin) {
    const [rows] = await db.query(
      `SELECT q.*, u.name AS uploader_name
       FROM screenshot_queue q
       LEFT JOIN users u ON q.uploaded_by = u.id
       WHERE q.status IN ('processing', 'pending_review', 'error')
       ORDER BY q.created_at DESC`,
    );
    return rows;
  }
  const [rows] = await db.query(
    `SELECT q.*, u.name AS uploader_name
     FROM screenshot_queue q
     LEFT JOIN users u ON q.uploaded_by = u.id
     WHERE q.uploaded_by = ? AND q.status IN ('processing', 'pending_review', 'error')
     ORDER BY q.created_at DESC`,
    [userId],
  );
  return rows;
}

/**
 * Update editable fields on a queue item (for the review step).
 */
async function updateQueueItem(id, data) {
  const allowed = [
    'extracted_name',
    'extracted_type',
    'extracted_phone',
    'extracted_address',
    'extracted_city',
    'extracted_website',
    'extracted_social_url',
    'extracted_notes',
  ];
  const fields = {};
  for (const key of allowed) {
    if (data[key] !== undefined) fields[key] = data[key];
  }
  if (Object.keys(fields).length === 0) return;

  const setClauses = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(', ');
  const values = [...Object.values(fields), id];
  await db.query(`UPDATE screenshot_queue SET ${setClauses} WHERE id = ?`, values);
}

/**
 * Approve a queue item: create a business record and mark the item as approved.
 */
async function approveQueueItem(id, approvedBy) {
  const [rows] = await db.query('SELECT * FROM screenshot_queue WHERE id = ?', [id]);
  const item = rows[0];
  if (!item) throw new Error('Queue item not found');
  if (item.status !== 'pending_review') throw new Error('Item is not in pending_review state');

  const [insertResult] = await db.query(
    `INSERT INTO businesses
       (name, type, phone, address, city, website, social_media_url, notes, assigned_to, added_by)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      item.extracted_name,
      item.extracted_type,
      item.extracted_phone,
      item.extracted_address,
      item.extracted_city,
      item.extracted_website,
      item.extracted_social_url,
      item.extracted_notes,
      approvedBy,
      approvedBy,
    ],
  );

  await db.query(`UPDATE screenshot_queue SET status = 'approved' WHERE id = ?`, [id]);

  return insertResult.insertId;
}

/**
 * Discard a queue item. Optionally delete the image file.
 */
async function discardQueueItem(id) {
  const [rows] = await db.query('SELECT image_filename FROM screenshot_queue WHERE id = ?', [id]);
  if (rows[0]?.image_filename) {
    const filePath = path.join(__dirname, '../../uploads/screenshots', rows[0].image_filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await db.query(`UPDATE screenshot_queue SET status = 'discarded' WHERE id = ?`, [id]);
}

module.exports = {
  enqueueAndProcess,
  getQueue,
  updateQueueItem,
  approveQueueItem,
  discardQueueItem,
};
