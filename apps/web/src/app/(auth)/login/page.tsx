'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import Link from 'next/link';

/** Returns the correct home route based on the user's role */
function getRoleHome(role?: string): string {
  if (role === 'organizer' || role === 'admin') return '/dashboard';
  if (role === 'gate_staff') return '/scan';
  return '/tickets'; // buyer default
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotInfo, setShowForgotInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectUrl = searchParams.get('redirect') || '';

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const dest = redirectUrl && redirectUrl !== '/' ? redirectUrl : getRoleHome(user.role);
      window.location.href = dest;
    }
  }, [isAuthenticated, user, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Credentials required', description: 'Please enter your email and password', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const session = await login({ email, password });
      toast({ title: 'Welcome Back!', description: `Signed in as ${session.user.full_name}`, variant: 'success' });

      const targetUrl = redirectUrl && redirectUrl !== '/' ? redirectUrl : getRoleHome(session.user.role);
      window.location.href = targetUrl;
    } catch (err: any) {
      setIsSubmitting(false);
      toast({ title: 'Login failed', description: err.response?.data?.message || err.message || 'No account found for this email', variant: 'destructive' });
    }
  };

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
              <span className="floweyebrow">BACK FOR ANOTHER NIGHT</span>
              <h2>
                GOOD TO<br />
                HAVE YOU<br />
                BACK.
              </h2>
              <p>Discover the music, the people, and the plans that make showing up worth it.</p>
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
              <div className="floweyebrow">YOUR VYBETIX ACCOUNT</div>
              <h1 tabIndex={-1}>Welcome back.</h1>
              <p>
                New around here?{' '}
                <Link href="/register">Create an account ↗</Link>
              </p>
            </div>

            <form id="auth-form" autoComplete="off" onSubmit={handleSubmit}>
              <div id="auth-fields">
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

                <label className="auth-label" htmlFor="auth-password">
                  Password
                </label>
                <div className="auth-password">
                  <input
                    className="auth-input"
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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

                <div className="auth-utilities">
                  <span>Secure session</span>
                  <button
                    type="button"
                    id="forgot-demo"
                    onClick={() => setShowForgotInfo(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                {showForgotInfo && (
                  <p id="reset-info" className="auth-hint" role="status">
                    To reset your password, contact support or use your registered recovery email.
                  </p>
                )}

                <button
                  className="btn auth-submit"
                  type="submit"
                  disabled={isLoggingIn || isSubmitting}
                  style={{
                    opacity: (isLoggingIn || isSubmitting) ? 0.75 : 1,
                    cursor: (isLoggingIn || isSubmitting) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {(isLoggingIn || isSubmitting) ? (
                    <span className="flex items-center justify-center gap-2 w-full">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <>
                      <span>Sign in</span>{' '}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#10100f] flex items-center justify-center p-6 text-[#f1ede4]">
          <div className="flower" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
