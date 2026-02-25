import http from './http';

export const financeApi = {
  // Categories
  getCategories: () => http.get('/finance/categories').then((r) => r.data),
  createCategory: (data) => http.post('/finance/categories', data).then((r) => r.data),
  deleteCategory: (id) => http.delete(`/finance/categories/${id}`).then((r) => r.data),

  // Records
  getRecords: (params) => http.get('/finance/records', { params }).then((r) => r.data),
  createRecord: (data) => http.post('/finance/records', data).then((r) => r.data),
  updateRecord: (id, data) => http.put(`/finance/records/${id}`, data).then((r) => r.data),
  deleteRecord: (id) => http.delete(`/finance/records/${id}`).then((r) => r.data),

  // Summary
  getSummary: (month) => http.get('/finance/summary', { params: { month } }).then((r) => r.data),
};
