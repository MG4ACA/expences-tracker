const { GoogleGenAI, createUserContent, createPartFromUri } = require('@google/genai');
const crypto = require('crypto');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/screenshots');

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

// How many images to send in each Gemini call (free tier: 10 RPM, so 5/call = 4 calls for 20 images)
const BATCH_SIZE = 5;

const BATCH_PROMPT = `You are analyzing social media screenshots (Facebook or TikTok) of business pages or profiles.
You will receive multiple images. For EACH image, extract business information and return a JSON ARRAY with exactly one object per image, in the same order as the images:
[
  {
    "name": "business or page name",
    "type": "type of business (e.g. Restaurant, Salon, Retail, Clothing, etc.) — infer from content",
    "phone": "phone number if visible, otherwise null",
    "address": "street address if visible, otherwise null",
    "city": "city or town name if visible, otherwise null",
    "website": "website URL if visible, otherwise null",
    "social_url": "the Facebook/TikTok page URL or username handle if visible, otherwise null",
    "notes": "short summary of what this business does, services, or any useful detail (max 200 chars), otherwise null"
  }
]

Rules:
- Return EXACTLY one object per image in the array, preserving the same order as the images provided
- If a field is not found in an image, return null for that field
- For phone numbers, include the full number with country code if shown (e.g. +94 77 123 4567)
- Return ONLY the raw JSON array — no markdown, no code blocks, no extra explanation`;

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
 * Send multiple images to Gemini in ONE call and return an array of extracted objects.
 * items: [{ imagePath, mimeType }]
 */
async function extractFromBatch(items) {
  const uploadedFiles = [];
  let rawText;
  try {
    // Upload all images in parallel via Files API
    const uploads = await Promise.all(
      items.map(({ imagePath, mimeType }) =>
        ai.files.upload({ file: imagePath, config: { mimeType } }),
      ),
    );
    uploadedFiles.push(...uploads);

    // Prompt first, then one image part per uploaded file
    const parts = [BATCH_PROMPT, ...uploads.map((f) => createPartFromUri(f.uri, f.mimeType))];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [createUserContent(parts)],
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
    // Clean up all uploaded files in parallel
    await Promise.allSettled(
      uploadedFiles.filter((f) => f?.name).map((f) => ai.files.delete(f.name)),
    );
  }

  const cleaned = rawText
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${cleaned.slice(0, 200)}`);
  }

  // Gemini may return a plain object for a batch of 1 — normalise to array
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Batch-enqueue and process a list of multer file objects.
 * Phase 1: duplicate detection + DB inserts for all files (sequential, fast).
 * Phase 2: Gemini extraction in groups of BATCH_SIZE — one API call per group,
 *          6 s gap between groups to respect the free-tier 10 RPM limit.
 * Returns results array in the same order as `files`.
 */
async function enqueueBatch(uploadedBy, files) {
  // ── Phase 1: dedup + insert ────────────────────────────────────────
  const allResults = [];
  const toProcess = []; // { resultIndex, queueId, imagePath, mimeType }

  for (const file of files) {
    const imageBuffer = fs.readFileSync(file.path);
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');

    const [existing] = await db.query(
      `SELECT id, status, extracted_name FROM screenshot_queue
       WHERE image_hash = ? AND status NOT IN ('discarded') LIMIT 1`,
      [imageHash],
    );
    if (existing.length > 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      const dup = existing[0];
      console.log(`[screenshot] Duplicate detected — matches queue item #${dup.id}`);
      allResults.push({
        id: dup.id,
        status: 'duplicate',
        duplicate: true,
        error: `Duplicate image — already in queue as "${dup.extracted_name || 'item #' + dup.id}" (${dup.status})`,
      });
      continue;
    }

    const ext = path.extname(file.originalname || file.filename).toLowerCase();
    const mimeType = MIME_MAP[ext] || 'image/jpeg';

    const [insertResult] = await db.query(
      'INSERT INTO screenshot_queue (uploaded_by, image_filename, image_hash, status) VALUES (?, ?, ?, ?)',
      [uploadedBy, file.filename, imageHash, 'processing'],
    );
    const queueId = insertResult.insertId;
    console.log(`[screenshot] [#${queueId}] Queued for batch processing — file: ${file.filename}`);

    allResults.push({ id: queueId, status: 'processing' }); // placeholder
    toProcess.push({ resultIndex: allResults.length - 1, queueId, imagePath: file.path, mimeType });
  }

  if (toProcess.length === 0) return allResults;

  // ── Phase 2: Gemini in batches of BATCH_SIZE ───────────────────────
  const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);
  console.log(
    `[screenshot] Processing ${toProcess.length} image(s) in ${totalBatches} batch(es) of up to ${BATCH_SIZE} — ~${totalBatches * 6}s total`,
  );

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batch = toProcess.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
    console.log(
      `[screenshot] Batch ${batchIdx + 1}/${totalBatches} — sending ${batch.length} image(s) to Gemini`,
    );

    let extracted = [];
    let batchError = null;
    try {
      extracted = await extractFromBatch(
        batch.map(({ imagePath, mimeType }) => ({ imagePath, mimeType })),
      );
      // Pad with nulls if Gemini returned fewer results than images sent
      if (extracted.length !== batch.length) {
        console.warn(
          `[screenshot] Batch ${batchIdx + 1}: Gemini returned ${extracted.length} result(s) for ${batch.length} image(s) — padding missing entries as errors`,
        );
        while (extracted.length < batch.length) extracted.push(null);
      }
    } catch (err) {
      console.error(`[screenshot] Batch ${batchIdx + 1} FAILED — ${err.message}`);
      batchError = err.message;
    }

    // Persist results for each item in this batch
    for (let i = 0; i < batch.length; i++) {
      const { queueId, resultIndex } = batch[i];
      const data = batchError ? null : extracted[i];

      if (!data) {
        const errMsg = batchError || 'Gemini did not return a result for this image';
        console.error(`[screenshot] [#${queueId}] Extraction FAILED — ${errMsg}`);
        await db.query(
          `UPDATE screenshot_queue SET status = 'error', error_message = ? WHERE id = ?`,
          [errMsg, queueId],
        );
        allResults[resultIndex] = { id: queueId, status: 'error', error: errMsg };
      } else {
        console.log(
          `[screenshot] [#${queueId}] OK — name: "${data.name || 'unknown'}", phone: ${data.phone || 'none'}`,
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
            data.name || null,
            data.type || null,
            data.phone || null,
            data.address || null,
            data.city || null,
            data.website || null,
            data.social_url || null,
            data.notes || null,
            JSON.stringify(data),
            queueId,
          ],
        );
        allResults[resultIndex] = { id: queueId, status: 'pending_review', extracted: data };
      }
    }

    // Wait 6 s between batches (skip delay after the last batch)
    if (batchIdx < totalBatches - 1) {
      console.log(`[screenshot] Waiting 6s before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, 6000));
    }
  }

  const okCount = allResults.filter((r) => r.status === 'pending_review').length;
  const errCount = allResults.filter((r) => r.status === 'error').length;
  const dupCount = allResults.filter((r) => r.status === 'duplicate').length;
  console.log(
    `[screenshot] All batches complete — ${okCount} ok, ${errCount} failed, ${dupCount} duplicate`,
  );
  return allResults;
}

/**
 * Insert a new queue item in 'processing' state and then run Gemini on it.
 * Updates the row to 'pending_review' (or 'error') when done.
 * Skips processing if an identical image hash already exists in the queue.
 */
async function enqueueAndProcess(uploadedBy, imageFilename, imagePath) {
  // ── Duplicate image detection ─────────────────────────────────────
  const imageBuffer = fs.readFileSync(imagePath);
  const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');

  const [existing] = await db.query(
    `SELECT id, status, extracted_name FROM screenshot_queue
     WHERE image_hash = ? AND status NOT IN ('discarded') LIMIT 1`,
    [imageHash],
  );
  if (existing.length > 0) {
    // Delete the newly saved duplicate file — it's wasted disk space
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    const dup = existing[0];
    console.log(`[screenshot] Duplicate image detected — matches queue item #${dup.id}`);
    return {
      id: dup.id,
      status: 'duplicate',
      duplicate: true,
      error: `Duplicate image — already in queue as "${dup.extracted_name || 'item #' + dup.id}" (${dup.status})`,
    };
  }

  // Insert as processing
  const [insertResult] = await db.query(
    'INSERT INTO screenshot_queue (uploaded_by, image_filename, image_hash, status) VALUES (?, ?, ?, ?)',
    [uploadedBy, imageFilename, imageHash, 'processing'],
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
 * Approve a queue item: duplicate-check, create business, delete image, mark approved.
 */
async function approveQueueItem(id, approvedBy) {
  const [rows] = await db.query('SELECT * FROM screenshot_queue WHERE id = ?', [id]);
  const item = rows[0];
  if (!item) throw new Error('Queue item not found');
  if (item.status !== 'pending_review') throw new Error('Item is not in pending_review state');

  // ── Duplicate business check ──────────────────────────────────────
  if (item.extracted_phone) {
    const [phoneMatch] = await db.query('SELECT id, name FROM businesses WHERE phone = ? LIMIT 1', [
      item.extracted_phone,
    ]);
    if (phoneMatch.length > 0) {
      throw new Error(
        `Duplicate: a business with phone "${item.extracted_phone}" already exists — "${phoneMatch[0].name}" (#${phoneMatch[0].id})`,
      );
    }
  }
  if (item.extracted_name) {
    const [nameMatch] = await db.query('SELECT id, name FROM businesses WHERE name = ? LIMIT 1', [
      item.extracted_name,
    ]);
    if (nameMatch.length > 0) {
      throw new Error(
        `Duplicate: a business named "${item.extracted_name}" already exists (#${nameMatch[0].id})`,
      );
    }
  }

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

  // ── Delete image file from disk after approval ────────────────────
  if (item.image_filename) {
    const filePath = path.join(UPLOAD_DIR, item.image_filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {
        /* ignore */
      }
    }
  }

  return insertResult.insertId;
}

/**
 * Approve all pending_review items for a user (or all if admin).
 * Returns { approved: [{id, businessId, name}], skipped: [{id, reason}] }
 */
async function approveAllPending(userId, isAdmin) {
  let rows;
  if (isAdmin) {
    [rows] = await db.query(
      `SELECT id FROM screenshot_queue WHERE status = 'pending_review' ORDER BY created_at ASC`,
    );
  } else {
    [rows] = await db.query(
      `SELECT id FROM screenshot_queue WHERE status = 'pending_review' AND uploaded_by = ? ORDER BY created_at ASC`,
      [userId],
    );
  }

  const approved = [];
  const skipped = [];
  for (const row of rows) {
    try {
      const businessId = await approveQueueItem(row.id, userId);
      approved.push({ id: row.id, businessId });
    } catch (err) {
      skipped.push({ id: row.id, reason: err.message });
    }
  }
  console.log(`[screenshot] Approve-all: ${approved.length} approved, ${skipped.length} skipped`);
  return { approved, skipped };
}

/**
 * Retry Gemini extraction for an item that is in 'error' state.
 */
async function retryQueueItem(id) {
  const [rows] = await db.query('SELECT * FROM screenshot_queue WHERE id = ?', [id]);
  const item = rows[0];
  if (!item) throw new Error('Queue item not found');
  if (item.status !== 'error') throw new Error('Only items in error state can be retried');

  const imagePath = path.join(UPLOAD_DIR, item.image_filename);
  if (!fs.existsSync(imagePath)) {
    throw new Error('Image file no longer exists on disk — please re-upload this screenshot');
  }

  await db.query(
    `UPDATE screenshot_queue SET status = 'processing', error_message = NULL WHERE id = ?`,
    [id],
  );
  console.log(`[screenshot] [#${id}] Retry extraction started`);

  try {
    const extracted = await extractFromImage(imagePath);
    console.log(`[screenshot] [#${id}] Retry OK — name: "${extracted.name || 'unknown'}"`);
    await db.query(
      `UPDATE screenshot_queue SET
        status = 'pending_review',
        extracted_name = ?, extracted_type = ?, extracted_phone = ?,
        extracted_address = ?, extracted_city = ?, extracted_website = ?,
        extracted_social_url = ?, extracted_notes = ?, raw_response = ?
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
        id,
      ],
    );
    return { id, status: 'pending_review', extracted };
  } catch (err) {
    console.error(`[screenshot] [#${id}] Retry FAILED — ${err.message}`);
    await db.query(`UPDATE screenshot_queue SET status = 'error', error_message = ? WHERE id = ?`, [
      err.message,
      id,
    ]);
    throw err;
  }
}

/**
 * Get approved/discarded items (history view).
 */
async function getHistory(userId, isAdmin) {
  if (isAdmin) {
    const [rows] = await db.query(
      `SELECT q.*, u.name AS uploader_name
       FROM screenshot_queue q
       LEFT JOIN users u ON q.uploaded_by = u.id
       WHERE q.status IN ('approved', 'discarded')
       ORDER BY q.created_at DESC
       LIMIT 200`,
    );
    return rows;
  }
  const [rows] = await db.query(
    `SELECT q.*, u.name AS uploader_name
     FROM screenshot_queue q
     LEFT JOIN users u ON q.uploaded_by = u.id
     WHERE q.uploaded_by = ? AND q.status IN ('approved', 'discarded')
     ORDER BY q.created_at DESC
     LIMIT 200`,
    [userId],
  );
  return rows;
}

/**
 * On server startup: mark any items stuck in 'processing' (>10 min old) as error.
 * These are leftovers from a previous server crash mid-upload.
 */
async function cleanStuckProcessing() {
  const [result] = await db.query(
    `UPDATE screenshot_queue
     SET status = 'error',
         error_message = 'Processing timed out — the server was restarted during upload'
     WHERE status = 'processing'
       AND created_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
  );
  if (result.affectedRows > 0) {
    console.log(
      `[screenshot] Cleaned up ${result.affectedRows} stuck 'processing' item(s) on startup`,
    );
  }
}

/**
 * Discard a queue item. Optionally delete the image file.
 */
async function discardQueueItem(id) {
  const [rows] = await db.query('SELECT image_filename FROM screenshot_queue WHERE id = ?', [id]);
  if (rows[0]?.image_filename) {
    const filePath = path.join(UPLOAD_DIR, rows[0].image_filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await db.query(`UPDATE screenshot_queue SET status = 'discarded' WHERE id = ?`, [id]);
}

module.exports = {
  enqueueBatch,
  enqueueAndProcess,
  getQueue,
  updateQueueItem,
  approveQueueItem,
  approveAllPending,
  retryQueueItem,
  getHistory,
  discardQueueItem,
  cleanStuckProcessing,
};
