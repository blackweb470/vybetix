'use client'; // Client entrypoint helper for Next.js

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { DropdownMenu, DropdownMenuItem } from '../ui/dropdown-menu';
import { Ticket, LayoutDashboard, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#0D0D0D]/90 backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        
        {/* Visual Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo.png" alt="Vybetix" width={80} height={80} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="text-3xl font-extrabold tracking-tighter font-syne text-[#E8441A] transition-colors duration-300 group-hover:text-[#ff5a2f]">
            Vybetix
          </span>
        </Link>

        {/* Directory Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-outfit">
          <Link
            href="/events"
            className="text-sm font-semibold uppercase tracking-wider text-zinc-400 hover:text-[#E8441A] transition-colors duration-200"
          >
            Explore Events
          </Link>
          <Link
            href="/universities"
            className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-zinc-400 hover:text-[#E8441A] transition-colors duration-200"
          >
            Campus Hub
          </Link>
        </nav>

        {/* User Session Action Blocks */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <DropdownMenu
              trigger={(isOpen) => (
                <button 
                  className={cn(
                    "flex items-center gap-2 rounded-full border p-1 pr-3 transition-all duration-300 focus:outline-none select-none",
                    isOpen 
                      ? "border-[#E8441A] bg-zinc-900/60 shadow-[0_0_15px_rgba(232,68,26,0.15)]" 
                      : "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 hover:border-zinc-700"
                  )}
                >
                  <Avatar fallback={user.full_name} src={user.avatar_url} className="h-8 w-8" />
                  <span className="hidden sm:inline text-xs font-bold text-zinc-300 font-outfit uppercase tracking-wider">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-zinc-500 transition-transform duration-300 hidden sm:inline-block",
                    isOpen && "transform rotate-180 text-[#E8441A]"
                  )} />
                </button>
              )}
            >
              {/* Premium Dropdown User Card Header */}
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
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Network Node</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                    user.role === 'admin' && "bg-amber-500/10 text-amber-400 border border-amber-500/15",
                    user.role === 'organizer' && "bg-[#E8441A]/10 text-[#E8441A] border border-[#E8441A]/15",
                    user.role === 'buyer' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                  )}>
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Action items list */}
              <div className="p-1">
                {user.role === 'buyer' && (
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

                {user.role === 'admin' && (
                  <Link href="/dashboard">
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
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button (Only for guest users) */}
          {!isAuthenticated && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-900 hover:text-white md:hidden focus:outline-none transition-colors duration-200"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>

      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && !isAuthenticated && (
        <div className="md:hidden border-b border-zinc-800 bg-[#0D0D0D]/95 backdrop-blur-md px-6 py-5 flex flex-col gap-4 font-outfit animate-in fade-in slide-in-from-top-4 duration-200">
          <Link
            href="/events"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-semibold uppercase tracking-wider text-zinc-400 hover:text-[#E8441A] transition-colors duration-200 py-2 border-b border-zinc-900/50"
          >
            Explore Events
          </Link>
          <Link
            href="/universities"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-semibold uppercase tracking-wider text-zinc-400 hover:text-[#E8441A] transition-colors duration-200 py-2"
          >
            Campus Hub
          </Link>

          {/* Mobile Login / Sign Up Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800/80 mt-2">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-center uppercase tracking-widest text-[10px] h-11 border border-zinc-800 hover:bg-zinc-900">
                Log In
              </Button>
            </Link>
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full text-center uppercase tracking-widest text-[10px] h-11">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

