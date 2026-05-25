'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../ui/toast';

import { useMe } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';

/**
 * Syncs the user's latest role from the backend (e.g. if they are added/removed as gate staff)
 */
function AuthSync() {
  const { data: me } = useMe();
  const { user, updateUser } = useAuthStore();
  
  React.useEffect(() => {
    if (me && user && me.role !== user.role) {
      updateUser({ role: me.role });
    }
  }, [me, user?.role, updateUser]);

  return null;
}

/**
 * Root Client Providers wrapper encapsulating transactional cache and alert states.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute stale buffer
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

