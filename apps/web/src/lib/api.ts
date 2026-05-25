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
      config.headers.Authorization = `Bearer ${token}`
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

// Tracks whether a token refresh is already in-flight to prevent duplicate calls
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function drainQueue(newToken: string | null, err: any = null) {
  pendingQueue.forEach((p) => (newToken ? p.resolve(newToken) : p.reject(err)));
  pendingQueue = [];
}

/**
 * On a 401, silently attempt to refresh the access token using the stored refresh token.
 * If the refresh succeeds, the original request is retried transparently.
 * If the refresh fails (truly expired/revoked session), the user is logged out.
 * Scanner pages are always excluded from auto-logout to avoid disrupting gate staff mid-event.
 */
api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (typeof window === 'undefined') return Promise.reject(err);

      const currentPath = window.location.pathname;
      // Gate staff should never be silently logged out mid-event
      const isScannerPage = currentPath.startsWith('/scan/');

      const { refreshToken, updateToken, clearAuth } = useAuthStore.getState();

      // No refresh token stored — session is unrecoverable
      if (!refreshToken) {
        if (!isScannerPage) {
          clearAuth();
          if (!currentPath.startsWith('/login')) {
            window.location.href = `/login?expired=true&redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        return Promise.reject(err);
      }

      originalRequest._retry = true;

      // If another request already kicked off a refresh, queue this one
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshRes = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefresh, expiresAt } = refreshRes.data.data;

        // Persist renewed tokens to store
        updateToken(newToken, newRefresh, expiresAt);

        // Retry the original failed request with the fresh token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        drainQueue(newToken);
        return api(originalRequest);
      } catch (refreshErr) {
        // Refresh itself failed — the session is truly dead
        drainQueue(null, refreshErr);
        if (!isScannerPage) {
          clearAuth();
          if (!currentPath.startsWith('/login')) {
            window.location.href = `/login?expired=true&redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);
