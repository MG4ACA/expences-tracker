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
};
