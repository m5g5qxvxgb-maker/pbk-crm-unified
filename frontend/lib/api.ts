import axios from 'axios';

// Всегда используем относительные пути - nginx проксирует /api/* на backend
const API_URL = '';

const api = axios.create({
  baseURL: '/api',
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status;
      
      // 401 Unauthorized - token expired or invalid
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // 403 Forbidden - insufficient permissions
      if (status === 403) {
        console.error('Access denied: Insufficient permissions');
        // You can show a toast notification here
      }
      
      // 500+ Server errors
      if (status >= 500) {
        console.error('Server error:', error.response?.data?.error || 'Internal server error');
        // You can show a toast notification here
      }
    }
    
    return Promise.reject(error);
  }
);

export const getApiUrl = (path: string) => {
  // Всегда используем относительные пути
  const cleanPath = path.startsWith('/api') ? path : `/api${path}`;
  return cleanPath;
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
  delete: (id: string) => api.delete(`/leads/${id}`),
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

