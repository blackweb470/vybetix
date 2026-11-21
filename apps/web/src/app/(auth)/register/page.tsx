'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import { api } from '../../../lib/api';
import Link from 'next/link';

interface Bank {
  name: string;
  code: string;
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isRegistering, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const redirectUrl = searchParams.get('redirect') || '';
  const roleParam = searchParams.get('role');

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = redirectUrl && redirectUrl !== '/' ? redirectUrl : '/dashboard';
    }
  }, [isAuthenticated, redirectUrl]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<'buyer' | 'organizer'>(roleParam === 'organizer' ? 'organizer' : 'buyer');
  const [businessName, setBusinessName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    if (roleParam === 'organizer') {
      setRole('organizer');
    }
  }, [roleParam]);

  useEffect(() => {
    if (role === 'organizer') {
      const fetchBanks = async () => {
        try {
          const { data } = await api.get('/api/payments/banks');
          if (data.success) {
            setBanks(data.data);
          }
        } catch (error) {
          console.error('Error fetching banks:', error);
        }
      };
      fetchBanks();
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure your passwords match', variant: 'destructive' });
      return;
    }

    if (password.length < 8) {
      toast({ title: 'Password too weak', description: 'Password must be at least 8 characters long', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let normalizedPhone = '+2348000000000';
      if (phone?.trim()) {
        let d = phone.replace(/\D/g, '');
        if (d.startsWith('234')) d = d.slice(3);
        d = d.replace(/^0+/, '');
        if (d) normalizedPhone = `+234${d}`;
      }

      await register({
        email,
        password,
        fullName,
        phone: normalizedPhone,
        role,
        business_name: role === 'organizer' ? businessName || fullName : undefined,
        bank_name: role === 'organizer' ? bankName : undefined,
        account_number: role === 'organizer' ? accountNumber : undefined,
        account_name: role === 'organizer' ? accountName : undefined,
      });

      toast({
        title: 'Account created!',
        description: 'Welcome to Vybetix! Taking you to your dashboard.',
        variant: 'success',
      });

      const target = redirectUrl && redirectUrl !== '/' ? redirectUrl : '/dashboard';
      window.location.href = target;
    } catch (err: any) {
      setIsSubmitting(false);
      toast({
        title: 'Registration failed',
        description: err.response?.data?.message || err.message || 'Could not complete registration',
        variant: 'destructive',
      });
    }
  };

  const isOrg = role === 'organizer';

  return (
    <div className="min-h-screen bg-[#10100f] text-[#f1ede4] font-['DM_Sans',sans-serif] selection:bg-[#ff5a24] selection:text-[#10100f]">
      <div className="wrap auth-wrap py-8">
        <div className="auth-layout">
          {/* Left Story Panel */}
          <aside
            className="auth-story"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200')` }}
          >
            <div className="auth-story-top">VYBETIX / YOUR NEXT CHAPTER</div>
            <div className="auth-story-copy">
              <span className="floweyebrow">THE GOOD PART STARTS HERE</span>
              <h2>
                {isOrg ? (
                  <>
                    YOU MAKE<br />
                    THE NIGHT.<br />
                    WE MAKE<br />
                    THE WAY.
                  </>
                ) : (
                  <>
                    MORE NIGHTS.<br />
                    MORE STORIES.<br />
                    MORE YOU.
                  </>
                )}
              </h2>
              <p>
                {isOrg
                  ? 'From the first announcement to the final encore. Give your next event a home.'
                  : 'Discover the music, the people, and the plans that make showing up worth it.'}
              </p>
            </div>
            <div className="auth-story-foot">
              <span>REAL LIFE. FULL VOLUME.</span>
              <span>01 / THE NEXT SCENE</span>
            </div>
          </aside>

          {/* Right Form Panel */}
          <section className="auth-panel">
            <Link className="auth-back" href="/#explore">
              ← Back to events
            </Link>

            <div className="auth-heading">
              <div className="floweyebrow">JOIN THE VYBE</div>
              <h1 tabIndex={-1}>Create your account.</h1>
              <p>
                Already part of the crowd?{' '}
                <Link href="/login">Sign in ↗</Link>
              </p>
            </div>

            <form id="auth-form" autoComplete="off" onSubmit={handleSubmit}>
              <div id="auth-fields">
                {/* Role Switcher */}
                <fieldset className="auth-role">
                  <legend>I’m here to</legend>
                  <label>
                    <input
                      type="radio"
                      name="accountrole"
                      value="buyer"
                      checked={role === 'buyer'}
                      onChange={() => setRole('buyer')}
                    />
                    <span>
                      Discover events<small>Find your next great night</small>
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="accountrole"
                      value="organizer"
                      checked={role === 'organizer'}
                      onChange={() => setRole('organizer')}
                    />
                    <span>
                      Organize events<small>Bring your people together</small>
                    </span>
                  </label>
                </fieldset>

                <label className="auth-label" htmlFor="auth-name">
                  Full name
                </label>
                <input
                  className="auth-input"
                  id="auth-name"
                  type="text"
                  placeholder="Your Name"
                  maxLength={60}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <label className="auth-label" htmlFor="auth-email">
                  Email address
                </label>
                <input
                  className="auth-input"
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label className="auth-label" htmlFor="auth-phone">
                  Phone number
                </label>
                <div className="flex items-center bg-[#25261f] border border-[#393a32] focus-within:border-[#ff5a24] rounded-md transition-colors">
                  <span className="px-3 py-3 text-xs font-bold text-[#ff5a24] bg-[#1a1b15] border-r border-[#393a32] select-none tracking-wider rounded-l-md">
                    +234
                  </span>
                  <input
                    className="w-full bg-transparent text-[#f1ede4] px-3.5 py-3 text-sm outline-none placeholder-[#7a7265]"
                    id="auth-phone"
                    type="tel"
                    maxLength={10}
                    placeholder="801 234 5678"
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.startsWith('234')) val = val.slice(3);
                      val = val.replace(/^0+/, '');
                      setPhone(val);
                    }}
                  />
                </div>

                {isOrg && (
                  <>
                    <label className="auth-label" htmlFor="auth-business">
                      Brand or Organization Name
                    </label>
                    <input
                      className="auth-input"
                      id="auth-business"
                      type="text"
                      placeholder="e.g. Mainland BlockParty"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </>
                )}

                <label className="auth-label" htmlFor="auth-password">
                  Password
                </label>
                <div className="auth-password">
                  <input
                    className="auth-input"
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    minLength={8}
                    maxLength={100}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-controls="auth-password"
                    aria-label="Show password"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <label className="auth-label" htmlFor="auth-confirm">
                  Confirm password
                </label>
                <div className="auth-password">
                  <input
                    className="auth-input"
                    id="auth-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    minLength={8}
                    maxLength={100}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-controls="auth-confirm"
                    aria-label="Show confirmation password"
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <label className="auth-consent">
                  <input type="checkbox" required />
                  <span>I agree to the Terms of Service &amp; Community Guidelines.</span>
                </label>

                <button
                  className="btn auth-submit"
                  type="submit"
                  disabled={isRegistering || isSubmitting}
                  style={{
                    opacity: (isRegistering || isSubmitting) ? 0.75 : 1,
                    cursor: (isRegistering || isSubmitting) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {(isRegistering || isSubmitting) ? (
                    <span className="flex items-center justify-center gap-2 w-full">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating account...</span>
                    </span>
                  ) : (
                    <>
                      <span>Create account</span>{' '}
                      <span className="arrow">↗</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="auth-bottom">
              VYBETIX / STARRING YOU. DIRECTED BY THE NIGHT.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#10100f] flex items-center justify-center p-6 text-[#f1ede4]">
          <div className="flower" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
