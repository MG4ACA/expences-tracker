import http from './http';

export const screenshotApi = {
  // Upload multiple screenshot files (FormData with field name 'screenshots')
  upload(files, onProgress) {
    const formData = new FormData();
    for (const file of files) formData.append('screenshots', file);

    return http.post('/screenshots/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
      // Gemini processes each image server-side after transfer;
      // with 20 images that can exceed 5 minutes — disable the default 15s timeout
      timeout: 0,
    });
  },

  // Get the review queue
  getQueue: () => http.get('/screenshots/queue').then((r) => r.data),

  // Update extracted fields on a queue item
  updateQueueItem: (id, data) => http.put(`/screenshots/queue/${id}`, data).then((r) => r.data),

  // Approve a queue item (creates a business)
  approveQueueItem: (id) => http.post(`/screenshots/queue/${id}/approve`).then((r) => r.data),

  // Discard a queue item
  discardQueueItem: (id) => http.delete(`/screenshots/queue/${id}`).then((r) => r.data),

  // Approve all pending_review items at once
  approveAll: () => http.post('/screenshots/queue/approve-all').then((r) => r.data),

  // Retry Gemini extraction for a failed (error) item
  retryQueueItem: (id) => http.post(`/screenshots/queue/${id}/retry`).then((r) => r.data),

  // Get approved/discarded history
  getHistory: () => http.get('/screenshots/history').then((r) => r.data),
};
