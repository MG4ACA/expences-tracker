import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// ── Request: attach JWT ─────────────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: centralized HTTP-level handling ────────────────────────
// • 401 → redirect to login (except on the login call itself)
// • No response (network down / timeout) → enrich error message
// • All other errors → passed through to useApi() for toast/inline display
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');

    // Session expired or unauthenticated
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return; // stop propagation — page is reloading anyway
    }

    // No response at all (server down, network offline, timeout)
    if (!err.response) {
      err.message =
        err.code === 'ECONNABORTED'
          ? 'Request timed out. Please check your connection.'
          : 'Cannot reach the server. Please check your connection.';
    }

    return Promise.reject(err);
  },
);

export default http;
