import http from './http';

export const deploymentApi = {
  // ── Deployments ──────────────────────────────────────────────────
  list: () => http.get('/deployments').then((r) => r.data),
  get: (id) => http.get(`/deployments/${id}`).then((r) => r.data),
  create: (data) => http.post('/deployments', data).then((r) => r.data),
  update: (id, data) => http.put(`/deployments/${id}`, data).then((r) => r.data),
  remove: (id) => http.delete(`/deployments/${id}`).then((r) => r.data),

  // ── VPS Servers ──────────────────────────────────────────────────
  listVps: () => http.get('/deployments/vps').then((r) => r.data),
  createVps: (data) => http.post('/deployments/vps', data).then((r) => r.data),
  updateVps: (id, data) => http.put(`/deployments/vps/${id}`, data).then((r) => r.data),
  removeVps: (id) => http.delete(`/deployments/vps/${id}`).then((r) => r.data),
};
