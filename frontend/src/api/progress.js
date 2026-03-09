import http from './http';

export const progressApi = {
  getDaily: (date) => http.get('/progress', { params: { date } }).then((r) => r.data),
};
