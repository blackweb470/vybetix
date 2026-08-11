'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Disc } from 'lucide-react';
import { useToast } from '../../components/ui/toast';

export default function GateLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      } else if (user?.role !== 'organizer' && user?.role !== 'admin' && user?.role !== 'gate_staff') {
        // Forbidden to normal buyer accounts
        toast({
          title: 'Access Denied',
          description: 'The Ticket Scan Portal is restricted to authorized event staff and organizers.',
          variant: 'destructive'
        });
        router.replace('/');
      }
    }
  }, [mounted, isAuthenticated, user, router, pathname, toast]);

  if (!mounted || !isAuthenticated || (user?.role !== 'organizer' && user?.role !== 'admin' && user?.role !== 'gate_staff')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D0D] py-36">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest text-zinc-550 mt-4">
          Authorizing Gate Credentials...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}


