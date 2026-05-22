'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Disc } from 'lucide-react';

function DashboardEditRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      router.replace(`/events/${id}/edit`);
    } else {
      router.replace('/dashboard');
    }
  }, [id, router]);

  return (
    <div className="w-full min-h-screen bg-[#08080C] flex flex-col items-center justify-center gap-4 text-zinc-100 font-outfit">
      <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Redirecting to event editor...</span>
    </div>
  );
}

export default function DashboardEditRedirectPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-[#08080C] flex flex-col items-center justify-center gap-4 text-zinc-100 font-outfit">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Loading router...</span>
      </div>
    }>
      <DashboardEditRedirectContent />
    </Suspense>
  );
}

