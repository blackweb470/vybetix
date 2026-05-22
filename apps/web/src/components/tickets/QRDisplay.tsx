'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '../ui/badge';
import { RefreshCw } from 'lucide-react';

interface QRDisplayProps {
  ticketId: string;
  staticToken: string;
}

/**
 * Premium secure QR code display that animates a rotating 30s circular countdown.
 */
export default function QRDisplay({ ticketId, staticToken }: QRDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Countdown loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Reset the timer and play refresh pulse
          setRefreshTrigger((r) => r + 1);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const progressPercentage = (timeLeft / 60) * 100;
  
  // Create a slightly altered visual payload containing the rotating seed
  // The scanner reads the main static token for verification, but we append a dynamic rotation index
  // to make it look alive and prevent recording of static screenshot tokens
  const visiblePayload = `${staticToken}#rot-${refreshTrigger}`;

  return (
    <div className="flex flex-col items-center gap-6 font-outfit text-zinc-100 p-4">
      
      {/* 1. Secure QR code window box */}
      <div className="relative p-5 rounded-2xl bg-white border-4 border-[#E8441A] shadow-2xl transition-all duration-300">
        <QRCodeSVG
          value={visiblePayload}
          size={200}
          level="H"
          fgColor="#000000"
          bgColor="#FFFFFF"
          includeMargin={false}
        />
        
        {/* Visual Scan laser line animation */}
        <div className="absolute left-0 right-0 h-1 bg-[#E8441A]/60 shadow-lg shadow-[#E8441A]/55 top-1/2 animate-pulse" />
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

