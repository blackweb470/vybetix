import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'buyer' | 'organizer' | 'admin' | 'gate_staff';
  is_banned: boolean;
  created_at: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // Unix timestamp in seconds
  setAuth: (user: UserProfile, token: string, refreshToken?: string, expiresAt?: number) => void;
  clearAuth: () => void;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
  updateToken: (token: string, refreshToken: string, expiresAt: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      setAuth: (user, token, refreshToken, expiresAt) =>
        set({ user, token, refreshToken: refreshToken ?? null, expiresAt: expiresAt ?? null }),
      clearAuth: () => {
        set({ user: null, token: null, refreshToken: null, expiresAt: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('Vybetix-auth');
        }
      },
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null
        })),
      updateToken: (token, refreshToken, expiresAt) =>
        set({ token, refreshToken, expiresAt })
    }),
    {
      name: 'Vybetix-auth'
    }
  )
);

