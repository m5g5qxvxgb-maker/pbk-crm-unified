import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getApiUrl = (path: string) => {
  // Remove /api prefix if path already includes it
  const cleanPath = path.startsWith('/api') ? path : `/api${path}`;
  // Return full URL without double /api
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  return `${baseUrl}${cleanPath}`;
};

// Auth API - updated
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    return await api.post('/auth/login', credentials);
  },
  register: async (data: any) => {
    return await api.post('/auth/register', data);
  },
  me: async () => {
    return await api.get('/auth/me');
  },
};

// Calls API
export const callsAPI = {
  getAll: () => api.get('/calls'),
  getById: (id: string) => api.get(`/calls/${id}`),
  create: (data: any) => api.post('/calls', data),
  update: (id: string, data: any) => api.put(`/calls/${id}`, data),
};

// Clients API
export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
};

// Leads API
export const leadsAPI = {
  getAll: () => api.get('/leads'),
  getById: (id: string) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.put(`/leads/${id}`, data),
};

// Emails API
export const emailsAPI = {
  getAll: () => api.get('/emails'),
  send: (data: any) => api.post('/emails/send', data),
};

// Proposals API
export const proposalsAPI = {
  getAll: () => api.get('/proposals'),
  getById: (id: string) => api.get(`/proposals/${id}`),
  create: (data: any) => api.post('/proposals', data),
};

// Pipelines API
export const pipelinesAPI = {
  getAll: () => api.get('/pipelines'),
  getStages: (id: string) => api.get(`/pipelines/${id}/stages`),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (key: string, value: any) => api.put(`/settings/${key}`, { value }),
};

export default API_URL;

