import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar token JWT almacenado localmente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stockflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores 401 (desconexión de sesión)
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
  }
  return Promise.reject(error);
});
