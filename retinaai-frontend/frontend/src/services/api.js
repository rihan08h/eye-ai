import axios from 'axios';

/**
 * Central Axios instance.
 * - Sends cookies with every request (withCredentials: true)
 * - Base URL points to backend via Vite proxy in dev
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Required for httpOnly cookie auth
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any local auth state by navigating to login
      // The AuthContext handles this via the useAuth hook
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
