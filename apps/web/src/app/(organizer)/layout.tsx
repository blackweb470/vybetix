'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Disc } from 'lucide-react';

// Roles allowed to access the organizer console
const ORGANIZER_ROLES = ['organizer', 'admin'];

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      // Not logged in → send to login
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      return;
    }

    if (user && !ORGANIZER_ROLES.includes(user.role)) {
      // Logged in but wrong role → redirect to their correct home
      if (user.role === 'buyer') {
        window.location.href = '/tickets';
      } else if (user.role === 'gate_staff') {
        window.location.href = '/scan';
      } else {
        window.location.href = '/';
      }
    }
  }, [mounted, isAuthenticated, user, router, pathname]);

  // Show loading spinner while mounting or while role hasn't been confirmed yet
  if (!mounted || !isAuthenticated || !user || !ORGANIZER_ROLES.includes(user.role)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D0D] py-36">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest text-zinc-550 mt-4">
          Authorizing Console...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}

