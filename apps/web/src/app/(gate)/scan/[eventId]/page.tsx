'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '../../../../components/ui/toast';
import { api } from '../../../../lib/api';
import { QrCode, ShieldCheck, ShieldAlert, ArrowLeft, Disc, Activity, RefreshCw, Camera, Keyboard } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useAuthStore } from '../../../../store/authStore';

interface ScanStats {
  eventTitle: string; totalSold: number; totalScanned: number;
  totalActive: number; totalCancelled: number; scanRate: number;
}
interface ScanResponse {
  status: 'VALID' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID';
  holder_name?: string; tier_name?: string; event_title?: string; message?: string;
}

export default function GateScannerPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.eventId as string;

  const [stats, setStats] = useState<ScanStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [qrInput, setQrInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');

  const { user, token } = useAuthStore();

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get(`/api/scanner/stats/${eventId}`);
      if (res.data?.success) setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally { setStatsLoading(false); }
  };

  useEffect(() => {
    if (!token || !user) {
      toast({ title: 'Authentication required', description: 'Please log in to access the ticket scanning console.', variant: 'destructive' });
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (user.role !== 'organizer' && user.role !== 'admin') {
      toast({ title: 'Access Denied', description: 'Only organizers and admins can access the scanner console', variant: 'destructive' });
      router.push('/dashboard');
      return;
    }

    fetchStats();
  }, [eventId, token, user]);

  const validateToken = async (token: string) => {
    if (!token) { toast({ title: 'Token required', variant: 'destructive' }); return; }
    setValidating(true); setScanResult(null);
    try {
      let parsedToken = token.trim();
      if (parsedToken.includes('#')) parsedToken = parsedToken.split('#')[0];
      const res = await api.post(`/api/scanner/scan/${encodeURIComponent(parsedToken)}`);
      if (res.data?.success) {
        const payload: ScanResponse = res.data.data;
        setScanResult(payload);
        if (payload.status === 'VALID') toast({ title: '✅ Access Granted!', description: `${payload.holder_name} — ${payload.tier_name}`, variant: 'success' });
        else if (payload.status === 'ALREADY_USED') toast({ title: '⚠️ Already Scanned', description: 'Duplicate entry attempt detected', variant: 'destructive' });
        else toast({ title: '❌ Fake / Invalid QR', description: payload.message || 'Cryptographic signature mismatch — deny entry', variant: 'destructive' });
        fetchStats();
      }
    } catch (err: any) {
      const status = err.response?.status;
      // Handle session expiry without logging the organizer out mid-event
      if (status === 401) {
        toast({
          title: '🔒 Session Expired',
          description: 'Your login session expired. Tap here to re-login without losing your place.',
          variant: 'destructive'
        });
        setScanResult({ status: 'INVALID', message: 'Session expired — please re-login. Your scanning position is saved.' });
      } else if (status === 403) {
        toast({
          title: '⛔ Not Authorised',
          description: 'You are not the organiser for this event.',
          variant: 'destructive'
        });
        setScanResult({ status: 'INVALID', message: 'Access forbidden — you do not own this event.' });
      } else {
        toast({ title: 'Scan error', description: err.response?.data?.message || err.message, variant: 'destructive' });
        setScanResult({ status: 'INVALID', message: 'Network error or unreadable token' });
      }
    } finally { setValidating(false); setQrInput(''); }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    validateToken(qrInput);
  };

  const scanRate = stats?.scanRate ?? 0;
  const circumference = 2 * Math.PI * 40;

  return (
    <div className="w-full min-h-screen bg-[#08080C] font-outfit text-zinc-100">

      {/* Sticky header */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-5 sticky top-0 z-30">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-widest">Gate Scanner — Live</span>
          </div>
          <button onClick={fetchStats} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT — Scanner */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Scanner card */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 rounded-full bg-[#E8441A]/5 blur-[80px]" />
              </div>

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-[#E8441A]" />
                    <span className="text-[10px] font-black text-[#E8441A] uppercase tracking-widest">Gate Check-In Console</span>
                  </div>
                  <div className="flex bg-zinc-900 rounded-lg p-1">
                    <button
                      onClick={() => setScanMode('camera')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${scanMode === 'camera' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Camera className="h-3.5 w-3.5" /> Camera
                    </button>
                    <button
                      onClick={() => setScanMode('manual')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${scanMode === 'manual' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Keyboard className="h-3.5 w-3.5" /> Manual
                    </button>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white font-syne uppercase tracking-tight">Secure Ticket Scanner</h2>
                  <p className="text-xs text-zinc-500 mt-1">{scanMode === 'camera' ? 'Point your camera at the ticket QR code to scan instantly.' : 'Paste or type the HMAC base64 token from an attendee\'s QR code.'}</p>
                </div>

                {scanMode === 'camera' ? (
                  <div className="w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden border-2 border-zinc-800 bg-black relative">
                    <Scanner
                      onScan={(result) => {
                        if (result && result.length > 0 && !validating) {
                          validateToken(result[0].rawValue);
                        }
                      }}
                      onError={(err) => {
                        console.error('QR Scanner error:', err);
                      }}
                      constraints={{
                        facingMode: 'environment'
                      }}
                      paused={validating}
                    />
                    {validating && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                        <Disc className="h-8 w-8 text-[#E8441A] animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleScanSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">QR Token Payload</label>
                      <textarea
                        rows={3}
                        placeholder="Paste full base64 HMAC token from scanned QR code..."
                        value={qrInput}
                        onChange={e => setQrInput(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all font-mono resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={validating}
                      className="h-12 w-full rounded-xl bg-[#E8441A] hover:brightness-110 active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#E8441A]/20 transition-all disabled:opacity-60"
                    >
                      {validating ? <Disc className="h-4 w-4 animate-spin" /> : <><QrCode className="h-4 w-4" />Validate Entry</>}
                    </button>
                  </form>
                )}



                {/* Scan result */}
                {scanResult && (
                  <div className="border-t border-zinc-900 pt-5">
                    {scanResult.status === 'VALID' && (
                      <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-600/30 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-6 w-6 text-emerald-400" />
                          <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">Access Granted</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[['Holder', scanResult.holder_name], ['Tier', scanResult.tier_name], ['Event', scanResult.event_title]].map(([lbl, val]) => val && (
                            <div key={lbl} className="flex flex-col">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{lbl}</span>
                              <span className="text-sm font-bold text-white">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {scanResult.status === 'ALREADY_USED' && (
                      <div className="p-5 rounded-2xl bg-amber-950/25 border border-amber-600/30 flex items-start gap-3">
                        <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-black text-amber-400 uppercase tracking-widest">Duplicate — Already Scanned</p>
                          <p className="text-xs text-amber-300/70 mt-1">This ticket was already used to enter. Deny re-entry.</p>
                        </div>
                      </div>
                    )}
                    {(scanResult.status === 'CANCELLED' || scanResult.status === 'INVALID') && (
                      <div className="p-5 rounded-2xl bg-red-950/25 border border-red-700/30 flex items-start gap-3">
                        <ShieldAlert className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-black text-red-400 uppercase tracking-widest">
                            {scanResult.status === 'CANCELLED' ? 'Ticket Cancelled' : 'Access Denied — Invalid QR'}
                          </p>
                          <p className="text-xs text-red-300/70 mt-1">{scanResult.message || 'This ticket is invalid or tampered. Deny entrance.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Stats panel */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl p-6 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#E8441A]" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Live Stats</span>
              </div>
              <button onClick={fetchStats} className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white transition-all">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {statsLoading ? (
              <div className="flex justify-center py-12"><Disc className="h-8 w-8 text-[#E8441A] animate-spin" /></div>
            ) : stats ? (
              <div className="flex flex-col gap-4">
                <div className="pb-3 border-b border-zinc-900">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Event</p>
                  <p className="text-sm font-black text-white font-syne uppercase truncate mt-0.5">{stats.eventTitle}</p>
                </div>

                {[
                  { label: 'Tickets Sold', value: stats.totalSold, color: 'text-white' },
                  { label: 'Scanned In', value: stats.totalScanned, color: 'text-emerald-400' },
                  { label: 'Active Passes', value: stats.totalActive, color: 'text-zinc-300' },
                  { label: 'Cancelled', value: stats.totalCancelled, color: 'text-red-400' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center py-2 border-b border-zinc-900/60 last:border-0">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</span>
                    <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                  </div>
                ))}

                {/* Check-in ring */}
                <div className="flex flex-col items-center gap-2 pt-3">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Gate Check-In Rate</span>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="40" fill="transparent" stroke="#18181b" strokeWidth="7" />
                      <circle cx="48" cy="48" r="40" fill="transparent" stroke="#10b981" strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={((100 - scanRate) / 100) * circumference}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute text-sm font-black text-white">{Math.round(scanRate)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600 uppercase font-bold text-center py-8">Stats unavailable</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
