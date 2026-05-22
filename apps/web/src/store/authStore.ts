import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'buyer' | 'organizer' | 'admin';
  is_banned: boolean;
  created_at: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  clearAuth: () => void;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vibetix-auth');
        }
      },
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null
        }))
    }),
    {
      name: 'vibetix-auth'
    }
  )
);
