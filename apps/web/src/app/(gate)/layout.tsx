'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Disc } from 'lucide-react';

export default function GateLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (user?.role !== 'organizer' && user?.role !== 'admin') {
        // Forbidden to non-staff
        router.push('/');
      }
    }
  }, [mounted, isAuthenticated, user, router, pathname]);

  if (!mounted || !isAuthenticated || (user?.role !== 'organizer' && user?.role !== 'admin')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D0D] py-36">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest text-zinc-550 mt-4">
          Authorizing Scan Session Credentials...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
