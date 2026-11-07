'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '../ui/badge';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface QRDisplayProps {
  ticketId: string;
  staticToken: string;
  onExpire?: () => void;
}

/**
 * Clean, standard QR code display for venue gate entry.
 */
export default function QRDisplay({ ticketId, staticToken }: QRDisplayProps) {
  const visiblePayload = staticToken;

  return (
    <div 
      className="flex flex-col items-center gap-4 font-outfit text-zinc-100 p-4 select-none"
    >
      {/* 1. Official QR Code Window */}
      <div 
        className="relative bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center border border-zinc-200"
      >
        <QRCodeSVG
          value={visiblePayload || ticketId}
          size={220}
          level="H"
          fgColor="#000000"
          bgColor="#FFFFFF"
          includeMargin={false}
          className="select-none"
          style={{ 
            width: '220px',
            height: '220px',
            imageRendering: 'pixelated'
          }}
        />
      </div>

      {/* 2. Pass Information */}
      <div className="flex flex-col items-center text-center gap-1">
        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-[#E8441A]" /> Official Entry Pass
        </span>
        <span className="text-[11px] text-zinc-400">
          Present this QR code at the venue gate for instant check-in.
        </span>
      </div>

      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px] px-3 py-1 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" /> VERIFIED & READY TO SCAN
      </Badge>
    </div>
  );
}
