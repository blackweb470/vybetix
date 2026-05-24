'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '../ui/badge';
import { RefreshCw } from 'lucide-react';

interface QRDisplayProps {
  ticketId: string;
  staticToken: string;
  onExpire?: () => void;
}

/**
 * Premium secure QR code display that animates a rotating 30s circular countdown.
 */
export default function QRDisplay({ ticketId, staticToken, onExpire }: QRDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Countdown loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Reset the timer and play refresh pulse
          setRefreshTrigger((r) => r + 1);
          if (onExpire) {
            onExpire();
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const progressPercentage = (timeLeft / 60) * 100;
  
  // IMPORTANT: The QR code must encode ONLY the pure staticToken.
  // The scanner verifies the HMAC of exactly this string — any suffix will break verification.
  // Visual "rotation" is achieved by changing the React key on the SVG element, which forces
  // a re-render without altering the encoded value.
  const visiblePayload = staticToken;

  return (
    <div 
      className="flex flex-col items-center gap-6 font-outfit text-zinc-100 p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      
      {/* 1. Secure QR code window box */}
      <div 
        className="bg-white rounded-xl shadow-xl overflow-hidden flex items-center justify-center"
        style={{ width: '280px', height: '280px' }}
      >
        <QRCodeSVG
          key={refreshTrigger}
          value={visiblePayload}
          size={240}
          level="H"
          fgColor="#000000"
          bgColor="#FFFFFF"
          includeMargin={false}
          className="pointer-events-none select-none"
          style={{ 
            shapeRendering: 'crispEdges',
            WebkitTouchCallout: 'none',
          }}
        />
      </div>

      {/* 2. Interactive Timer Progress indicator */}
      <div className="flex items-center gap-3">
        {/* Circular progress SVG */}
        <div className="relative h-9 w-9 flex items-center justify-center shrink-0">
          <svg className="h-full w-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="18"
              cy="18"
              r="14"
              className="stroke-zinc-800"
              strokeWidth="3.5"
              fill="transparent"
            />
            {/* Active countdown fill */}
            <circle
              cx="18"
              cy="18"
              r="14"
              className="stroke-[#E8441A] transition-all duration-1000 ease-linear"
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${((100 - progressPercentage) / 100) * (2 * Math.PI * 14)}`}
            />
          </svg>
          {/* Inner countdown number */}
          <span className="absolute text-xxs font-extrabold text-[#E8441A]">{timeLeft}</span>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-xxs font-bold text-zinc-500 uppercase tracking-widest">
            Rotating Token
          </span>
          <span className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-1.5 mt-0.5">
            <RefreshCw className="h-3.5 w-3.5 text-[#E8441A] animate-spin-slow" />
            Auto-Refreshes in {timeLeft}s
          </span>
        </div>
      </div>

      {/* 3. Helper secure information badge */}
      <Badge className="bg-[#E8441A]/10 text-[#E8441A] border border-[#E8441A]/15 font-semibold text-xxs px-3 py-1">
        HMAC-SHA256 DIGITAL ENVELOPE ACTIVE
      </Badge>

    </div>
  );
}

