'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import {
  MapPin, ShieldCheck, Download,
  Printer, ArrowLeft, AlertTriangle, Disc, Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface TicketPassData {
  id: string;
  holderName: string;
  holderEmail: string;
  status: string;
  scannedAt?: string;
  tierName: string;
  price: number;
  event: {
    title: string;
    venue: string;
    city: string;
    eventDate: string;
    endDate?: string;
    coverImageUrl?: string;
  };
  qrImage: string;
  passToken: string;
}

// ---------------------------------------------------------------------------
// Canvas-based full-ticket image export (zero dependencies)
// Draws the entire ticket as a styled card onto a canvas and exports PNG.
// ---------------------------------------------------------------------------
async function downloadFullTicketImage(ticket: TicketPassData) {
  const W = 480;
  const H = 760;
  const R = 24; // border-radius
  const BG = '#f4f1e9';
  const DARK = '#161713';
  const ORANGE = '#ff5a24';
  const LIME = '#c4db59';
  const MUTED = '#737568';

  const canvas = document.createElement('canvas');
  canvas.width = W * 2;   // 2× for retina sharpness
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // Helper: rounded rect
  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // — 1. Dark background canvas
  ctx.fillStyle = '#20211a';
  ctx.fillRect(0, 0, W, H);

  // — 2. White ticket card
  ctx.save();
  roundRect(20, 20, W - 40, H - 40, R);
  ctx.fillStyle = BG;
  ctx.fill();
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.clip();

  // — 3. Top ribbon (dark bar)
  ctx.fillStyle = DARK;
  ctx.fillRect(20, 20, W - 40, 48);

  // Brand name
  ctx.fillStyle = BG;
  ctx.font = 'bold 13px "DM Sans", Arial, sans-serif';
  ctx.fillText('VYBETIX ✳', 36, 20 + 30);

  // Tier badge pill
  const tierLabel = ticket.tierName.toUpperCase();
  const tierW = ctx.measureText(tierLabel).width + 20;
  ctx.fillStyle = '#f7a6c5';
  roundRect(W - 40 - tierW - 10, 20 + 12, tierW, 22, 11);
  ctx.fill();
  ctx.fillStyle = DARK;
  ctx.font = 'bold 10px "DM Sans", Arial, sans-serif';
  ctx.fillText(tierLabel, W - 40 - tierW - 10 + 10, 20 + 27);

  // — 4. Event cover image (or gradient fallback)
  const POSTER_H = 160;
  const POSTER_Y = 20 + 48;

  const drawPoster = () => {
    // Gradient fallback
    const grad = ctx.createLinearGradient(20, POSTER_Y, W - 20, POSTER_Y + POSTER_H);
    grad.addColorStop(0, ORANGE);
    grad.addColorStop(1, LIME);
    ctx.fillStyle = grad;
    ctx.fillRect(20, POSTER_Y, W - 40, POSTER_H);

    // Overlay fade
    const fade = ctx.createLinearGradient(20, POSTER_Y, 20, POSTER_Y + POSTER_H);
    fade.addColorStop(0, 'rgba(22,23,19,0)');
    fade.addColorStop(1, 'rgba(22,23,19,0.75)');
    ctx.fillStyle = fade;
    ctx.fillRect(20, POSTER_Y, W - 40, POSTER_H);
  };

  // Try loading the cover image (guarded flag prevents double-draw from race)
  if (ticket.event.coverImageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        img.onload = () => {
          ctx.drawImage(img, 20, POSTER_Y, W - 40, POSTER_H);
          // Dark fade overlay
          const fade = ctx.createLinearGradient(20, POSTER_Y, 20, POSTER_Y + POSTER_H);
          fade.addColorStop(0, 'rgba(22,23,19,0)');
          fade.addColorStop(1, 'rgba(22,23,19,0.75)');
          ctx.fillStyle = fade;
          ctx.fillRect(20, POSTER_Y, W - 40, POSTER_H);
          finish();
        };
        img.onerror = () => { drawPoster(); finish(); };
        img.src = ticket.event.coverImageUrl!;
        setTimeout(() => { if (!done) { drawPoster(); finish(); } }, 3000); // 3s timeout
      });
    } catch {
      drawPoster();
    }
  } else {
    drawPoster();
  }

  // — 5. Date badge on poster
  const eventDate = ticket.event.eventDate ? new Date(ticket.event.eventDate) : null;
  const monthStr = eventDate ? eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
  const dayStr = eventDate ? String(eventDate.getDate()) : '--';
  const timeStr = eventDate ? eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

  // Date badge box
  ctx.fillStyle = BG;
  roundRect(36, POSTER_Y + 14, 56, 60, 8);
  ctx.fill();
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = ORANGE;
  ctx.font = 'bold 9px "DM Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(monthStr, 36 + 28, POSTER_Y + 14 + 16);
  ctx.fillStyle = DARK;
  ctx.font = 'bold 26px "Barlow Condensed", Impact, sans-serif';
  ctx.fillText(dayStr, 36 + 28, POSTER_Y + 14 + 42);
  ctx.fillStyle = MUTED;
  ctx.font = '8px "DM Sans", Arial, sans-serif';
  ctx.fillText(timeStr, 36 + 28, POSTER_Y + 14 + 56);
  ctx.textAlign = 'left';

  // — 6. Status badge
  if (ticket.status === 'active') {
    ctx.fillStyle = LIME;
    roundRect(W - 40 - 100, POSTER_Y + 14, 90, 24, 6);
    ctx.fill();
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = DARK;
    ctx.font = 'bold 9px "DM Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ GATE READY', W - 40 - 100 + 45, POSTER_Y + 14 + 16);
    ctx.textAlign = 'left';
  } else if (ticket.status === 'used') {
    ctx.fillStyle = ORANGE;
    roundRect(W - 40 - 100, POSTER_Y + 14, 90, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px "DM Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCANNED / USED', W - 40 - 100 + 45, POSTER_Y + 14 + 16);
    ctx.textAlign = 'left';
  }

  // — 7. Event title + venue on poster
  ctx.fillStyle = BG;
  ctx.font = 'bold 22px "Barlow Condensed", Impact, sans-serif';
  const titleY = POSTER_Y + POSTER_H - 36;
  const maxTitleW = W - 40 - 36;
  let title = ticket.event.title.toUpperCase();
  while (ctx.measureText(title).width > maxTitleW && title.length > 10) {
    title = title.slice(0, -1);
  }
  if (title.length < ticket.event.title.length) title += '…';
  ctx.fillText(title, 36, titleY);

  ctx.fillStyle = '#a7a89e';
  ctx.font = '11px "DM Sans", Arial, sans-serif';
  ctx.fillText(`📍 ${ticket.event.venue}, ${ticket.event.city}`, 36, titleY + 18);

  ctx.restore();

  // — 8. QR code section (white box)
  const QR_Y = POSTER_Y + POSTER_H + 16;
  const QR_SIZE = 180;
  const QR_X = (W - QR_SIZE) / 2;

  // QR container
  ctx.save();
  ctx.fillStyle = BG;
  roundRect(20, QR_Y - 10, W - 40, H - 40 - (QR_Y - 20) - 48, R - 8);
  ctx.fill();
  ctx.clip();

  // White QR card
  ctx.fillStyle = '#fff';
  roundRect(QR_X - 12, QR_Y - 2, QR_SIZE + 24, QR_SIZE + 24, 14);
  ctx.fill();
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw QR image
  const qrImg = new Image();
  qrImg.src = ticket.qrImage;
  await new Promise<void>((resolve) => {
    qrImg.onload = () => { ctx.drawImage(qrImg, QR_X, QR_Y + 4, QR_SIZE, QR_SIZE); resolve(); };
    qrImg.onerror = resolve;
    setTimeout(resolve, 3000);
  });

  // "Official Gate Entry Pass" text
  ctx.fillStyle = DARK;
  ctx.font = 'bold 11px "DM Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛡  Official Gate Entry Pass', W / 2, QR_Y + QR_SIZE + 42);
  ctx.fillStyle = MUTED;
  ctx.font = '10px "DM Sans", Arial, sans-serif';
  ctx.fillText('Present on screen or printed at venue gate', W / 2, QR_Y + QR_SIZE + 58);

  // — 9. Metadata rows
  const META_Y = QR_Y + QR_SIZE + 78;
  const metaItems = [
    { label: 'Holder', value: ticket.holderName.toUpperCase() },
    { label: 'Tier / Price', value: `${ticket.tierName} • ${ticket.price > 0 ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(ticket.price / 100) : 'FREE'}` },
    { label: 'Date', value: formatDate(ticket.event.eventDate) },
  ];

  ctx.textAlign = 'left';
  let metaOffset = 0;
  for (const item of metaItems) {
    const rowY = META_Y + metaOffset;
    // Divider line
    ctx.strokeStyle = '#d5d2c6';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(36, rowY - 6);
    ctx.lineTo(W - 36, rowY - 6);
    ctx.stroke();

    ctx.fillStyle = MUTED;
    ctx.font = 'bold 9px "DM Sans", Arial, sans-serif';
    ctx.fillText(item.label.toUpperCase(), 36, rowY + 10);
    ctx.fillStyle = DARK;
    ctx.font = 'bold 11px "DM Sans", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.value, W - 36, rowY + 10);
    ctx.textAlign = 'left';
    metaOffset += 30;
  }

  // Pass ID row (monospace)
  const pidY = META_Y + metaOffset + 4;
  ctx.strokeStyle = '#d5d2c6';
  ctx.lineWidth = 0.75;
  ctx.beginPath(); ctx.moveTo(36, pidY - 6); ctx.lineTo(W - 36, pidY - 6); ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = 'bold 9px "DM Sans", Arial, sans-serif';
  ctx.fillText('PASS ID', 36, pidY + 10);
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`#${ticket.id}`, W - 36, pidY + 10);
  ctx.textAlign = 'left';

  ctx.restore();

  // — 10. Bottom ribbon (dark)
  ctx.fillStyle = DARK;
  ctx.fillRect(20, H - 40 - 48 + 20, W - 40, 44);
  ctx.fillStyle = '#a7a89e';
  ctx.font = 'bold 8.5px "DM Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Permanent Pass ✳ No Device Binding ✳ Verified by Vybetix', W / 2, H - 40 - 48 + 20 + 26);
  ctx.textAlign = 'left';

  // — Export
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `Vybetix-Pass-${ticket.event.title.replace(/\s+/g, '-').slice(0, 30)}-${ticket.tierName}-${ticket.id.slice(0, 8)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---------------------------------------------------------------------------

function PublicTicketPassContent() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('id');
  const token = searchParams.get('token');

  const [ticket, setTicket] = useState<TicketPassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      setError('No ticket ID provided. Please click the link in your confirmation email.');
      setLoading(false);
      return;
    }

    async function fetchTicketPass() {
      try {
        setLoading(true);
        const query = token ? `?token=${encodeURIComponent(token)}` : '';
        const res = await api.get(`/api/tickets/public/${ticketId}${query}`);
        setTicket(res.data.data);
      } catch (err: any) {
        console.error('Fetch public ticket error:', err);
        setError(err.response?.data?.message || 'Could not load ticket pass. Please check your link.');
      } finally {
        setLoading(false);
      }
    }

    fetchTicketPass();
  }, [ticketId, token]);

  const handlePrint = () => window.print();

  const handleDownloadTicket = useCallback(async () => {
    if (!ticket || downloading) return;
    setDownloading(true);
    try {
      await downloadFullTicketImage(ticket);
    } catch (err) {
      console.error('Ticket image export failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [ticket, downloading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#161713] text-[#f4f1e9] flex flex-col items-center justify-center p-6 font-['DM_Sans',sans-serif]">
        <Disc className="h-10 w-10 text-[#ff5a24] animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-[#a7a89e]">
          Generating your gate pass...
        </p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#161713] text-[#f4f1e9] flex flex-col items-center justify-center p-6 text-center font-['DM_Sans',sans-serif]">
        <div className="w-16 h-16 rounded-2xl bg-[#ff5a24]/10 border-2 border-[#ff5a24] flex items-center justify-center text-[#ff5a24] mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black font-['Barlow_Condensed',Impact,sans-serif] uppercase text-[#f4f1e9] mb-2 tracking-tight">
          Pass Unavailable
        </h1>
        <p className="text-xs text-[#a7a89e] max-w-md mb-6">{error || 'Ticket not found.'}</p>
        <Link href="/" className="vyb-btn rounded-xl !py-3 !px-6 !text-xs !gap-2">
          Return to Home <span className="vyb-arrow">↗</span>
        </Link>
      </div>
    );
  }

  const isUsed = ticket.status === 'used';
  const isCancelled = ticket.status === 'cancelled';
  const isActive = ticket.status === 'active';

  const eventDateObj = ticket.event.eventDate ? new Date(ticket.event.eventDate) : null;
  const monthName = eventDateObj ? eventDateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
  const dayNumber = eventDateObj ? eventDateObj.getDate() : '--';
  const timeString = eventDateObj ? eventDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '7:00 PM';

  return (
    <div className="min-h-screen bg-[#161713] text-[#f4f1e9] font-['DM_Sans',sans-serif] py-8 px-4 sm:px-6 flex flex-col items-center justify-center selection:bg-[#ff5a24] selection:text-[#161713]">

      {/* TOP CONTROLS & BRANDING BAR (Hidden during print) */}
      <div className="no-print mb-6 flex items-center justify-between w-full max-w-md">
        <Link href="/tickets" className="flex items-center gap-1.5 text-xs font-bold text-[#a7a89e] hover:text-[#f4f1e9] transition-colors uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4 text-[#ff5a24]" />
          <span>My Tickets</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#20211a] border border-[#393a32] hover:border-[#f4f1e9] text-[#f4f1e9] text-xs font-bold uppercase tracking-wider transition-all"
            title="Print Pass"
          >
            <Printer className="h-3.5 w-3.5 text-[#ff5a24]" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadTicket}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff5a24] text-[#161713] font-black text-xs uppercase tracking-wider hover:bg-[#e04a1a] transition-all shadow-[2px_2px_0px_#161713] disabled:opacity-60 disabled:cursor-wait"
            title="Download full ticket image"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{downloading ? 'Saving…' : 'Download Ticket'}</span>
          </button>
        </div>
      </div>

      {/* COLLECTIBLE PHYSICAL TICKET PASS */}
      <div className="print-only-ticket w-full max-w-md bg-[#f4f1e9] text-[#161713] rounded-3xl border-2 border-[#161713] shadow-[8px_8px_0px_#161713] overflow-hidden relative">

        {/* Pass Top Ribbon */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#161713] text-[#f4f1e9] border-b-2 border-[#161713]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider">
              VYBETIX<i>✳</i>
            </span>
            <span className="text-[10px] text-[#a7a89e] uppercase tracking-widest hidden sm:inline">
              • OFFICIAL GATE PASS
            </span>
          </div>
          <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-[#f7a6c5] text-[#161713] tracking-wider">
            {ticket.tierName}
          </span>
        </div>

        {/* Visual Poster Banner with Date Stamp */}
        <div className="relative h-44 w-full bg-[#161713] overflow-hidden">
          {ticket.event.coverImageUrl ? (
            <img
              src={ticket.event.coverImageUrl}
              alt={ticket.event.title}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#ff5a24] to-[#c4db59]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161713]/85 via-transparent to-transparent" />

          {/* Floating Date Badge */}
          <div className="absolute top-4 left-4 bg-[#f4f1e9] text-[#161713] border-2 border-[#161713] shadow-[3px_3px_0px_#161713] rounded-lg px-3 py-1.5 text-center leading-none">
            <span className="block text-[9px] font-black uppercase tracking-wider text-[#ff5a24]">{monthName}</span>
            <span className="block text-2xl font-black font-['Barlow_Condensed',Impact,sans-serif] leading-none my-0.5">{dayNumber}</span>
            <span className="block text-[8px] font-bold text-[#606257]">{timeString}</span>
          </div>

          {/* Status Stamp */}
          <div className="absolute top-4 right-4 z-10">
            {isActive && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#c4db59] text-[#161713] font-black text-[10px] uppercase tracking-wider border border-[#161713] shadow-[2px_2px_0px_#161713]">
                <Sparkles className="h-3 w-3" /> GATE READY
              </span>
            )}
            {isUsed && (
              <span className="inline-block px-3 py-1 rounded bg-[#ff5a24] text-white font-black text-[10px] uppercase tracking-wider border border-[#161713] -rotate-3 shadow-[2px_2px_0px_#161713]">
                SCANNED / USED
              </span>
            )}
            {isCancelled && (
              <span className="inline-block px-3 py-1 rounded bg-zinc-800 text-zinc-400 font-black text-[10px] uppercase tracking-wider border border-zinc-700">
                CANCELLED
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-3xl uppercase tracking-tight text-[#f4f1e9] leading-[0.95] line-clamp-2">
              {ticket.event.title}
            </h1>
            <p className="text-xs text-[#a7a89e] flex items-center gap-1 mt-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-[#ff5a24] shrink-0" />
              <span className="truncate">{ticket.event.venue}, {ticket.event.city}</span>
            </p>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="p-6 flex flex-col items-center text-center bg-[#f4f1e9]">
          <div className="bg-white p-4 rounded-2xl border-2 border-[#161713] shadow-[4px_4px_0px_#161713] my-2">
            <img
              src={ticket.qrImage}
              alt="Gate Entry QR Code"
              className="w-56 h-56 object-contain"
            />
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#161713]">
            <ShieldCheck className="h-4 w-4 text-[#ff5a24]" />
            <span>Official Gate Entry Pass</span>
          </div>
          <p className="text-[11px] text-[#606257] mt-0.5">
            Present this QR code on your screen or printed on paper at venue gate
          </p>

          {/* Ticket Metadata Table */}
          <div className="w-full mt-6 pt-5 border-t border-[#d5d2c6] space-y-2.5 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#737568] uppercase tracking-wider text-[10px] font-bold">Holder</span>
              <span className="font-black text-[#161713] uppercase truncate max-w-[200px]">{ticket.holderName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#737568] uppercase tracking-wider text-[10px] font-bold">Tier / Price</span>
              <span className="font-black text-[#161713]">
                {ticket.tierName} • {ticket.price > 0 ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(ticket.price / 100) : 'FREE'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#737568] uppercase tracking-wider text-[10px] font-bold">Date & Time</span>
              <span className="font-bold text-[#161713]">
                {formatDate(ticket.event.eventDate)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#d5d2c6] font-mono text-[10px] text-[#737568]">
              <span>Pass ID</span>
              <span className="font-bold text-[#161713]">#{ticket.id}</span>
            </div>
          </div>
        </div>

        {/* Perforated Tear Notch & Barcode */}
        <div className="vyb-tear bg-[#f4f1e9] !px-6">
          <div className="vyb-barcode" />
          <span className="text-[8px] font-mono font-bold tracking-widest text-[#737568]">VALID ENTRY</span>
        </div>

        {/* Pass Footer */}
        <div className="bg-[#161713] text-[#a7a89e] px-6 py-3 border-t-2 border-[#161713] text-center text-[10px] font-bold uppercase tracking-wider">
          Permanent Pass ✳ No Device Binding ✳ Verified by Vybetix
        </div>

      </div>

    </div>
  );
}

export default function PublicTicketPassPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#161713] text-[#f4f1e9] flex flex-col items-center justify-center p-6 font-['DM_Sans',sans-serif]">
        <Disc className="h-10 w-10 text-[#ff5a24] animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-[#a7a89e]">Loading ticket pass...</p>
      </div>
    }>
      <PublicTicketPassContent />
    </Suspense>
  );
}
