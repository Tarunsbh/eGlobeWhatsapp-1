import axios from 'axios';

// Use relative URL so it works through both Vite proxy (dev) and nginx proxy (Docker)
const BASE = import.meta.env.VITE_API_URL || '/api/v1';

const saApi = axios.create({ baseURL: BASE });

saApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('sa_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

saApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sa_token');
      localStorage.removeItem('sa_admin');
      window.location.href = '/super-admin/login';
    }
    return Promise.reject(err);
  },
);

export const saAuth = {
  login: (email, password) => saApi.post('/super-admin/auth/login', { email, password }),
  me: () => saApi.get('/super-admin/auth/me'),
};

export const saHotels = {
  list: (params = {}) => saApi.get('/super-admin/hotels', { params }),
  get: (id) => saApi.get(`/super-admin/hotels/${id}`),
  create: (data) => saApi.post('/super-admin/hotels', data),
  update: (id, data) => saApi.patch(`/super-admin/hotels/${id}`, data),
  suspend: (id, reason) => saApi.patch(`/super-admin/hotels/${id}/suspend`, { reason }),
  activate: (id) => saApi.patch(`/super-admin/hotels/${id}/activate`),
  delete: (id) => saApi.delete(`/super-admin/hotels/${id}`),
};

export const saUsers = {
  list: (hotelId) => saApi.get(`/super-admin/hotels/${hotelId}/users`),
  create: (hotelId, data) => saApi.post(`/super-admin/hotels/${hotelId}/users`, data),
  resetPassword: (hotelId, userId, password) =>
    saApi.patch(`/super-admin/hotels/${hotelId}/users/${userId}/reset-password`, { password }),
  enable: (hotelId, userId) => saApi.patch(`/super-admin/hotels/${hotelId}/users/${userId}/enable`),
  disable: (hotelId, userId) => saApi.patch(`/super-admin/hotels/${hotelId}/users/${userId}/disable`),
  delete: (hotelId, userId) => saApi.delete(`/super-admin/hotels/${hotelId}/users/${userId}`),
};

export const saSubscriptions = {
  plans: () => saApi.get('/super-admin/plans'),
  get: (hotelId) => saApi.get(`/super-admin/hotels/${hotelId}/subscription`),
  update: (hotelId, planId, billingCycle) =>
    saApi.patch(`/super-admin/hotels/${hotelId}/subscription`, { planId, billingCycle }),
};

export const saBilling = {
  list: (params = {}) => saApi.get('/super-admin/invoices', { params }),
  generate: (hotelId, data) => saApi.post(`/super-admin/hotels/${hotelId}/invoices`, data),
  updateStatus: (invoiceId, status) =>
    saApi.patch(`/super-admin/invoices/${invoiceId}/status`, { status }),
};

export const saDashboard = {
  stats: () => saApi.get('/super-admin/dashboard'),
  activity: (limit) => saApi.get('/super-admin/dashboard/activity', { params: { limit } }),
  growth: () => saApi.get('/super-admin/dashboard/growth'),
};

export const saAudit = {
  list: (params = {}) => saApi.get('/super-admin/audit-logs', { params }),
};

export const saPricing = {
  list: () => saApi.get('/super-admin/pricing'),
  update: (id, data) => saApi.patch(`/super-admin/pricing/${id}`, data),
};

export const saUsage = {
  hotel: (hotelId, month) => saApi.get(`/super-admin/hotels/${hotelId}/usage`, { params: { month } }),
  summary: (month) => saApi.get('/super-admin/usage/summary', { params: { month } }),
  generateInvoice: (hotelId, data) => saApi.post(`/super-admin/hotels/${hotelId}/invoices/from-usage`, data),
};

export default saApi;
