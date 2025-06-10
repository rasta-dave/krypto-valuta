import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/update-profile', data),
};

export const walletAPI = {
  getInfo: () => api.get('/wallet/info'),
  createTransaction: (data) => api.post('/transactions/transact', data),
  getTransactions: (params) => api.get('/wallet/my-transactions', { params }),
  mine: () => api.post('/transactions/mine'),
};

export const blockchainAPI = {
  getBlocks: (params) => api.get('/blocks', { params }),
  getBlock: (id) => api.get(`/blocks/${id}`),
  getStats: () => api.get('/blocks/stats'),
  getAllTransactions: (params) =>
    api.get('/transactions/transactions', { params }),
  search: (query) => api.get(`/blocks/search?q=${encodeURIComponent(query)}`),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
