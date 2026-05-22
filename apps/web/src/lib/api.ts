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
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Do NOT auto-logout on scanner pages — the scan might have failed for other reasons.
        // Organizers should never be silently logged out mid-event.
        const isScannerPage = currentPath.startsWith('/scan/');
        if (!isScannerPage) {
          useAuthStore.getState().clearAuth();
          if (!currentPath.startsWith('/login')) {
            window.location.href = `/login?expired=true&redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

