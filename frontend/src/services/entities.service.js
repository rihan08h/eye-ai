import api from './api';

export const patientService = {
  create: (data) => api.post('/patients', data),
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

export const screeningService = {
  // onUploadProgress surfaces real bytes-sent, so the UI can show actual
  // upload progress rather than a timer pretending to be one.
  create: (formData, { onUploadProgress, signal } = {}) =>
    api.post('/screenings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      signal,
    }),
  getAll: (params) => api.get('/screenings', { params }),
  getById: (id) => api.get(`/screenings/${id}`),
  getByPatientId: (patientId) => api.get(`/screenings/patient/${patientId}`),
};

export const referralService = {
  create: (data) => api.post('/referrals', data),
  getAll: (params) => api.get('/referrals', { params }),
  getById: (id) => api.get(`/referrals/${id}`),
  updateStatus: (id, data) => api.patch(`/referrals/${id}/status`, data),
};

export const campService = {
  create: (data) => api.post('/camps', data),
  getAll: (params) => api.get('/camps', { params }),
  getById: (id) => api.get(`/camps/${id}`),
  update: (id, data) => api.put(`/camps/${id}`, data),
};

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getForScreening: (screeningId) => api.get(`/reviews/screening/${screeningId}`),
  getQueue: (params) => api.get('/reviews/queue', { params }),
  getAgreement: () => api.get('/reviews/agreement'),
};

export const chatService = {
  sendMessage: (data) => api.post('/chat', data),
};
