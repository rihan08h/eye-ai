import api from './api';

export const authService = {
  /**
   * Register a new user account.
   */
  register: (data) => api.post('/auth/register', data),

  /**
   * Login — sets httpOnly JWT cookie on success.
   */
  login: (credentials) => api.post('/auth/login', credentials),

  /**
   * Logout — clears the httpOnly cookie server-side.
   */
  logout: () => api.post('/auth/logout'),

  /**
   * Get currently authenticated user from cookie session.
   */
  getMe: () => api.get('/auth/me'),
};
