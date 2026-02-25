import http from './http';

export const todoApi = {
  list: (params) => http.get('/todos', { params }).then((r) => r.data),
  create: (data) => http.post('/todos', data).then((r) => r.data),
  update: (id, data) => http.put(`/todos/${id}`, data).then((r) => r.data),
  remove: (id) => http.delete(`/todos/${id}`).then((r) => r.data),
};
