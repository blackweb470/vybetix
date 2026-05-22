import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to retrieve or lazily generate a persistent unique device fingerprint
function getOrCreateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';
  let fingerprint = localStorage.getItem('Vybetix_device_fingerprint');
  if (!fingerprint) {
    fingerprint = 'dev-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
    localStorage.setItem('Vybetix_device_fingerprint', fingerprint);
  }
  return fingerprint;
}

// Automatically inject JWT authentication tokens and device fingerprint headers
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (typeof window !== 'undefined' && config.headers) {
      config.headers['x-device-fingerprint'] = getOrCreateDeviceFingerprint();
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gracefully redirect users or clear store if the session expires or returns unauthenticated statuses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and user storage, booting expired sessions back to home
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?expired=true&redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

