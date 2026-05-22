import React from 'react';
import Image from 'next/image';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0D0D]">
      <div className="flex flex-col items-center gap-4">
        <Image src="/logo.png" alt="Vybetix" width={128} height={128} className="animate-pulse" />
        <span className="text-sm font-bold uppercase tracking-widest font-syne text-zinc-400 animate-pulse">
          Loading Vybetix...
        </span>
      </div>
    </div>
  );
}

