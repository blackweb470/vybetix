'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Disc } from 'lucide-react';

// Only buyers (and admins who may need to preview) can access buyer pages
const BUYER_ROLES = ['buyer', 'admin'];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
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

    if (user && !BUYER_ROLES.includes(user.role)) {
      // Wrong role → send to their correct home
      if (user.role === 'organizer') {
        window.location.href = '/dashboard';
      } else if (user.role === 'gate_staff') {
        window.location.href = '/scan';
      } else {
        window.location.href = '/';
      }
    }
  }, [mounted, isAuthenticated, user, router, pathname]);

  // Show loading spinner while mounting or while role check is pending
  if (!mounted || !isAuthenticated || !user || !BUYER_ROLES.includes(user.role)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D0D] py-36">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest text-zinc-550 mt-4">
          Authorizing Session...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}

