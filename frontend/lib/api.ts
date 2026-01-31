import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
  register: (data: any) => api.post('/auth/register/', data),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
};

// Customer API
export const customerAPI = {
  list: (params?: any) => api.get('/customers/', { params }),
  get: (id: number) => api.get(`/customers/${id}/`),
  create: (data: any) => api.post('/customers/', data),
  update: (id: number, data: any) => api.put(`/customers/${id}/`, data),
  delete: (id: number) => api.delete(`/customers/${id}/`),
  getTransactions: (id: number) => api.get(`/customers/${id}/transactions/`),
};

// Service API
export const serviceAPI = {
  list: (params?: any) => api.get('/services/', { params }),
  get: (id: number) => api.get(`/services/${id}/`),
  create: (data: any) => api.post('/services/', data),
  update: (id: number, data: any) => api.put(`/services/${id}/`, data),
  delete: (id: number) => api.delete(`/services/${id}/`),
};

// Transaction API
export const transactionAPI = {
  list: (params?: any) => api.get('/transactions/', { params }),
  get: (id: number) => api.get(`/transactions/${id}/`),
  create: (data: any) => api.post('/transactions/', data),
  update: (id: number, data: any) => api.put(`/transactions/${id}/`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/transactions/${id}/update_status/`, { status }),
  downloadInvoice: (id: number) =>
    api.get(`/transactions/${id}/download_invoice/`, { responseType: 'blob' }),
  getReports: (params?: any) => api.get('/transactions/reports/', { params }),
};
