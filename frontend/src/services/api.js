import axios from 'axios';

/**
 * API origin.
 *
 * Empty in the current production setup because Nginx serves both
 * the frontend and API from the same domain.
 *
 * If VITE_API_URL is configured, it supports a separate API origin.
 */
export const API_ORIGIN = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/$/, '');

/**
 * Resolve media paths returned by the backend.
 */
export const resolveMediaUrl = (path) => {
  if (!path) return '';

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,

  // ML inference can take longer than a standard API request.
  timeout: 60000,

  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
