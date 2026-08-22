import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('healthsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and broadcast logout if session expired
      if (localStorage.getItem('healthsync_token')) {
        localStorage.removeItem('healthsync_token');
        localStorage.removeItem('healthsync_user');
        window.dispatchEvent(new Event('auth_state_change'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
