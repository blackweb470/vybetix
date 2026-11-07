'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/avatar';
import { DropdownMenu, DropdownMenuItem } from '../ui/dropdown-menu';
import { Ticket, LayoutDashboard, User, LogOut, ChevronDown, Menu, X, QrCode, Compass, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Home page uses the user's bespoke landing page header
  if (pathname === '/') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#393a32] bg-[#161713]/90 backdrop-blur-xl font-['DM_Sans',sans-serif]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Visual Brand Logo with Sparkle */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl font-black tracking-tight text-[#f4f1e9] uppercase flex items-center">
            vybetix<i className="not-italic text-[#ff5a24] ml-0.5">✳</i>
          </span>
        </Link>

        {/* Directory Navigation Links in Tactile Pill Shape */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/events"
            className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider text-[#a7a89e] hover:text-[#f4f1e9] hover:bg-[#20211a] transition-all duration-200 flex items-center gap-1.5"
          >
            <Compass className="h-3.5 w-3.5 text-[#ff5a24]" />
            Explore Vibes
          </Link>

          <Link
            href="/tickets"
            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#a7a89e] hover:text-[#f4f1e9] hover:bg-[#20211a] transition-all duration-200 flex items-center gap-1.5"
          >
            <Ticket className="h-3.5 w-3.5 text-[#c4db59]" />
            My Passes
          </Link>
        </nav>

        {/* User Session Action Blocks */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <DropdownMenu
              trigger={(isOpen) => (
                <button
                  className={cn(
                    "flex items-center gap-2 rounded-full border p-1.5 pr-3.5 transition-all duration-300 focus:outline-none select-none",
                    isOpen
                      ? "border-[#E8441A] bg-zinc-900/90 shadow-[0_0_20px_rgba(232,68,26,0.2)]"
                      : "border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 hover:border-zinc-700"
                  )}
                >
                  <Avatar fallback={user.full_name} src={user.avatar_url} className="h-7 w-7" />
                  <span className="hidden sm:inline text-xs font-black text-zinc-200 font-outfit uppercase tracking-wider">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-zinc-400 transition-transform duration-300 hidden sm:inline-block",
                    isOpen && "transform rotate-180 text-[#E8441A]"
                  )} />
                </button>
              )}
            >
              {/* Dropdown User Card Header */}
              <div className="px-4 py-3 border-b border-zinc-900 bg-zinc-950/40 flex flex-col gap-2 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <Avatar fallback={user.full_name} src={user.avatar_url} className="h-9 w-9 ring-1 ring-zinc-800" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-extrabold text-white truncate leading-snug">{user.full_name}</span>
                    <span className="text-[10px] text-zinc-500 truncate leading-snug">{user.email}</span>
                  </div>
                </div>

                {/* Account role tag */}
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-900/40">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Role</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                    user.role === 'admin' && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                    user.role === 'organizer' && "bg-[#E8441A]/10 text-[#E8441A] border border-[#E8441A]/20",
                    user.role === 'buyer' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  )}>
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Action items list */}
              <div className="p-1">
                {(user.role === 'buyer' || user.role === 'gate_staff') && (
                  <Link href="/tickets">
                    <DropdownMenuItem>
                      <Ticket className="mr-2.5 h-4 w-4 text-[#E8441A]" />
                      My Tickets
                    </DropdownMenuItem>
                  </Link>
                )}

                {user.role === 'organizer' && (
                  <>
                    <Link href="/dashboard">
                      <DropdownMenuItem>
                        <LayoutDashboard className="mr-2.5 h-4 w-4 text-[#E8441A]" />
                        Organizer Hub
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/tickets">
                      <DropdownMenuItem>
                        <Ticket className="mr-2.5 h-4 w-4 text-emerald-400" />
                        Ticket History
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}

                {(user.role === 'gate_staff' || user.role === 'organizer' || user.role === 'admin') && (
                  <Link href="/scan">
                    <DropdownMenuItem>
                      <QrCode className="mr-2.5 h-4 w-4 text-[#E8441A]" />
                      Scan Portal
                    </DropdownMenuItem>
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link href="/admin">
                    <DropdownMenuItem>
                      <LayoutDashboard className="mr-2.5 h-4 w-4 text-[#E8441A]" />
                      Admin Console
                    </DropdownMenuItem>
                  </Link>
                )}

                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2.5 h-4 w-4 text-zinc-400" />
                    My Profile
                  </DropdownMenuItem>
                </Link>

                <div className="border-t border-zinc-900/80 my-1" />

                <DropdownMenuItem onClick={logout} className="text-red-400 hover:bg-red-950/20 hover:text-red-200">
                  <LogOut className="mr-2.5 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2.5">
              <Link href="/login">
                <button className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider text-[#a7a89e] hover:text-[#f4f1e9] hover:bg-[#20211a] transition-all duration-200">
                  Log In
                </button>
              </Link>
              <Link href="/events">
                <button className="px-5 py-2.5 rounded-full bg-[#ff5a24] hover:bg-[#e04a1a] text-[#161713] text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#161713] transition-all duration-200 active:scale-95 flex items-center gap-1.5">
                  <span>Get Tickets</span>
                  <span className="text-xs">↗</span>
                </button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button (Only for guest users) */}
          {!isAuthenticated && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#393a32] bg-[#20211a] text-[#f4f1e9] md:hidden focus:outline-none transition-colors duration-200"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>

      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && !isAuthenticated && (
        <div className="md:hidden border-b border-[#393a32] bg-[#161713] px-6 py-6 flex flex-col gap-4 font-['DM_Sans',sans-serif] animate-in fade-in slide-in-from-top-4 duration-200">
          <Link
            href="/events"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-black uppercase tracking-wider text-[#f4f1e9] hover:text-[#ff5a24] transition-colors py-2 flex items-center justify-between"
          >
            <span>Explore Events</span>
            <Compass className="h-4 w-4 text-[#ff5a24]" />
          </Link>
          <Link
            href="/tickets"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-black uppercase tracking-wider text-[#a7a89e] hover:text-[#f4f1e9] transition-colors py-2 flex items-center justify-between"
          >
            <span>My Passes</span>
            <Ticket className="h-4 w-4 text-[#c4db59]" />
          </Link>

          {/* Mobile Login / Sign Up Actions in Rounded Pills */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-zinc-900 mt-2">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full py-3 rounded-full text-center uppercase tracking-widest text-xs font-black bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white">
                Log In
              </button>
            </Link>
            <Link href="/events" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full py-3 rounded-full text-center uppercase tracking-widest text-xs font-black bg-[#E8441A] text-white shadow-lg shadow-[#E8441A]/20">
                Get Tickets
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
