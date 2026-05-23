import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore, UserProfile } from '../store/authStore';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, token, clearAuth, setAuth, updateUser } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string; fullName?: string }) => {
      // Simulate/Trigger login or credentials lookup
      const res = await api.post('/api/auth/login', credentials);
      return res.data.data as { user: UserProfile; token: string };
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
      role: 'buyer' | 'organizer';
      business_name?: string;
      bank_name?: string;
      account_number?: string;
      account_name?: string;
    }) => {
      const res = await api.post('/api/auth/register', userData);
      // API returns { user, session } — extract token from session
      const { user, session } = res.data.data as { user: UserProfile; session: { access_token: string } | null };
      return { user, token: session?.access_token ?? '' };
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: {
      fullName: string;
      phone: string;
      businessName?: string;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    }) => {
      const res = await api.patch('/api/auth/profile', updatedData);
      return res.data.data as UserProfile & { organizerProfile?: any };
    },
    onSuccess: (data) => {
      updateUser({
        full_name: data.full_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        is_banned: data.is_banned
      });
    }
  });

  const logout = () => {
    clearAuth();
    router.push('/');
    router.refresh();
  };

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
    logout
  };
}

export function useMe() {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/auth/me');
      return res.data.data as UserProfile & { organizerProfile?: any };
    },
    enabled: !!token
  });
}

