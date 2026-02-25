import http from './http';

export const businessApi = {
  list: () => http.get('/businesses').then((r) => r.data),
  get: (id) => http.get(`/businesses/${id}`).then((r) => r.data),
  create: (data) => http.post('/businesses', data).then((r) => r.data),
  update: (id, data) => http.put(`/businesses/${id}`, data).then((r) => r.data),
  remove: (id) => http.delete(`/businesses/${id}`).then((r) => r.data),

  // Cold calls
  getCalls: (id) => http.get(`/businesses/${id}/calls`).then((r) => r.data),
  addCall: (id, data) => http.post(`/businesses/${id}/calls`, data).then((r) => r.data),
  updateCall: (callId, data) => http.put(`/coldcalls/${callId}`, data).then((r) => r.data),
  deleteCall: (callId) => http.delete(`/coldcalls/${callId}`).then((r) => r.data),
};
