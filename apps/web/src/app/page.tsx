'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { usePurchaseTicket } from '../hooks/useTickets';
import { formatNaira, formatDate, formatTime } from '../lib/utils';
import { openPaystackCheckout } from '../lib/paystack';
import { api } from '../lib/api';
import { EventDetail, TicketTier } from '../types';

// Category filter configuration matching 1b.html & backend schema
const EVENT_CATEGORIES = [
  { name: 'All Events', value: 'all', hint: 'Browse the full lineup' },
  { name: 'Music', value: 'music', hint: 'Concerts, live sets & nightlife' },
  { name: 'Campus', value: 'campus', hint: 'Student shows & campus life' },
  { name: 'Tech', value: 'tech', hint: 'Conferences, demos & meetups' },
  { name: 'Comedy', value: 'comedy', hint: 'Stand-up & comedy nights' },
  { name: 'Church', value: 'church', hint: 'Faith & community gatherings' },
  { name: 'Sports', value: 'sports', hint: 'Matches, fitness & competition' },
  { name: 'Food', value: 'food', hint: 'Tastings, pop-ups & dining' },
  { name: 'Other', value: 'other', hint: 'Creative & other experiences' },
];

export default function LandingPage() {
  const { user, isAuthenticated, login, register, logout, isLoggingIn, isRegistering } = useAuth();
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Multi-Screen Client Routing State ('home' | 'explore' | 'event' | 'booking' | 'confirmed' | 'signin' | 'signup')
  const [currentRoute, setCurrentRoute] = useState<'home' | 'explore' | 'event' | 'booking' | 'confirmed' | 'signin' | 'signup'>('home');
  const [activeEventParam, setActiveEventParam] = useState<string>('0');
  const [isOrganizerSignup, setIsOrganizerSignup] = useState<boolean>(false);

  // Filter States
  const [exploreQuery, setExploreQuery] = useState('');
  const [exploreCity, setExploreCity] = useState('all');
  const [exploreCategory, setExploreCategory] = useState('all');
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);

  const [landingSearchInput, setLandingSearchInput] = useState('');
  const [landingActiveSearch, setLandingActiveSearch] = useState('');
  const [landingSelectedCity, setLandingSelectedCity] = useState('all');
  const [landingSelectedCategory, setLandingSelectedCategory] = useState('all');
  const [savedEvents, setSavedEvents] = useState<Record<string, boolean>>({});

  // Dialogs & Modals
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication Form State
  const [authRole, setAuthRole] = useState<'attendee' | 'organizer'>('attendee');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showForgotInfo, setShowForgotInfo] = useState(false);
  const [authSubmitted, setAuthSubmitted] = useState(false);
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');

  // 1. FETCH REAL EVENTS FROM BACKEND API
  const { data: realEvents = [], isLoading: isLoadingEvents, error: eventsError, refetch: refetchEvents } = useEvents({
    search: (currentRoute === 'explore' ? exploreQuery : landingActiveSearch) || undefined,
    city: (currentRoute === 'explore' ? exploreCity : landingSelectedCity) === 'all' ? undefined : (currentRoute === 'explore' ? exploreCity : landingSelectedCity),
    category: (currentRoute === 'explore' ? exploreCategory : landingSelectedCategory) === 'all' ? undefined : (currentRoute === 'explore' ? exploreCategory : landingSelectedCategory),
    limit: 50,
  });

  // Client-side Hash Router listener matching 1b.html lines 110-113
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (hash === '#signin' || hash === '#signup' || hash === '#signup/organizer') {
        if (isAuthenticated) {
          window.location.href = '/dashboard';
          return;
        }
      }
      if (hash === '#signin') {
        setCurrentRoute('signin');
        setIsOrganizerSignup(false);
        setAuthSubmitted(false);
      } else if (hash === '#signup') {
        setCurrentRoute('signup');
        setIsOrganizerSignup(false);
        setAuthRole('attendee');
        setAuthSubmitted(false);
      } else if (hash === '#signup/organizer') {
        setCurrentRoute('signup');
        setIsOrganizerSignup(true);
        setAuthRole('organizer');
        setAuthSubmitted(false);
      } else if (hash === '#explore') {
        setCurrentRoute('explore');
      } else {
        const m = hash.match(/^#(event|booking|confirmed)\/([^/]+)$/);
        if (m) {
          const type = m[1] as 'event' | 'booking' | 'confirmed';
          setActiveEventParam(m[2]);
          setCurrentRoute(type);
        } else {
          setCurrentRoute('home');
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  // Resolve active event from real backend events
  const activeEvent: EventDetail | null = useMemo(() => {
    if (!realEvents || realEvents.length === 0) return null;
    const byId = realEvents.find((e) => e.id === activeEventParam);
    if (byId) return byId;
    const bySlug = realEvents.find((e) => e.slug === activeEventParam);
    if (bySlug) return bySlug;
    const num = Number(activeEventParam);
    if (!isNaN(num) && realEvents[num]) return realEvents[num];
    return realEvents[0];
  }, [realEvents, activeEventParam]);

  // Real ticket tiers on the active event
  const activeEventTiers: TicketTier[] = useMemo(() => {
    if (activeEvent?.ticket_tiers && activeEvent.ticket_tiers.length > 0) {
      return activeEvent.ticket_tiers;
    }
    if (activeEvent?.tiers && activeEvent.tiers.length > 0) {
      return activeEvent.tiers;
    }
    // Default tier if event has no tiers registered
    return [
      {
        id: 'standard-tier',
        event_id: activeEvent?.id || '',
        name: 'Standard Admission',
        description: 'General entry pass to this live event',
        price: 500000, // ₦5,000
        quantity: 100,
        sold: 0,
        created_at: '',
      },
    ];
  }, [activeEvent]);

  // Booking state for pass selector
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [bookingQty, setBookingQty] = useState(1);
  const [bookingAttendees, setBookingAttendees] = useState<Array<{ name: string; email: string; phone: string }>>([
    { name: '', email: '', phone: '' },
  ]);
  const [bookingIsLoading, setBookingIsLoading] = useState(false);
  const [lastConfirmedPass, setLastConfirmedPass] = useState<{
    eventTitle: string;
    dateStr: string;
    city: string;
    tierName: string;
    qty: number;
    amountStr: string;
    guestName: string;
  } | null>(null);

  const currentSelectedTier = activeEventTiers[selectedTierIndex] || activeEventTiers[0];
  const totalAmountKobo = (currentSelectedTier?.price || 0) * bookingQty;

  // Sync attendees array length when quantity changes
  useEffect(() => {
    setBookingAttendees((prev) => {
      const next = [...prev];
      if (next.length < bookingQty) {
        while (next.length < bookingQty) {
          next.push({ name: '', email: '', phone: '' });
        }
      } else if (next.length > bookingQty) {
        return next.slice(0, bookingQty);
      }
      return next;
    });
  }, [bookingQty]);

  // Pre-fill primary attendee details if user is logged in
  useEffect(() => {
    if (user) {
      setBookingAttendees((prev) => {
        const next = [...prev];
        if (next.length === 0) {
          next.push({ name: '', email: '', phone: '' });
        }
        let cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
        if (cleanPhone.startsWith('234')) cleanPhone = cleanPhone.slice(3);
        cleanPhone = cleanPhone.replace(/^0+/, '');

        next[0] = {
          name: next[0].name || user.full_name || '',
          email: next[0].email || user.email || '',
          phone: next[0].phone || cleanPhone,
        };
        return next;
      });
    }
  }, [user]);

  // Update specific attendee field
  const updateAttendee = (idx: number, field: 'name' | 'email' | 'phone', val: string) => {
    setBookingAttendees((prev) => {
      const next = [...prev];
      if (!next[idx]) {
        next[idx] = { name: '', email: '', phone: '' };
      }
      if (field === 'phone') {
        let clean = val.replace(/\D/g, '');
        if (clean.startsWith('234')) clean = clean.slice(3);
        clean = clean.replace(/^0+/, '');
        next[idx] = { ...next[idx], phone: clean };
      } else {
        next[idx] = { ...next[idx], [field]: val };
      }
      return next;
    });
  };

  // Copy primary attendee info to another attendee slot
  const copyPrimaryToAttendee = (idx: number) => {
    setBookingAttendees((prev) => {
      const primary = prev[0];
      if (!primary) return prev;
      const next = [...prev];
      next[idx] = {
        name: `${primary.name} (Guest ${idx + 1})`,
        email: primary.email,
        phone: primary.phone,
      };
      return next;
    });
    showToast(`Copied contact details to Pass #${idx + 1}`);
  };

  // Purchase ticket mutation for real Paystack checkout
  const purchaseMutation = usePurchaseTicket();

  // Full-page checkout handler — calls backend then launches Paystack
  const handleFullPageCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !currentSelectedTier) return;

    // Validate selected tier
    if (!currentSelectedTier) {
      showToast('Please select a ticket tier to continue.');
      return;
    }

    // Validate and normalize all attendees
    const attendeesList: Array<{ name: string; email: string; phone: string }> = [];

    for (let i = 0; i < bookingQty; i++) {
      const att = bookingAttendees[i] || { name: '', email: '', phone: '' };
      const name = att.name.trim();
      const email = att.email.trim();
      let digits = att.phone.replace(/\D/g, '');
      if (digits.startsWith('234')) digits = digits.slice(3);
      digits = digits.replace(/^0+/, '');

      const passLabel = bookingQty > 1 ? `Pass #${i + 1}` : 'Pass holder';

      if (!name) {
        showToast(`Please enter the full name for ${passLabel}.`);
        return;
      }
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        showToast(`Please enter a valid email address for ${passLabel}.`);
        return;
      }
      if (!digits || !/^[789][01]\d{8}$/.test(digits)) {
        showToast(`Enter a valid 10-digit Nigerian phone number for ${passLabel} (e.g. 801 234 5678).`);
        return;
      }

      attendeesList.push({
        name,
        email,
        phone: `+234${digits}`,
      });
    }

    const primaryAttendee = attendeesList[0];

    setBookingIsLoading(true);
    try {
      const orderData = await purchaseMutation.mutateAsync({
        tierId: currentSelectedTier.id,
        eventId: activeEvent.id,
        quantity: bookingQty,
        attendees: attendeesList,
      });

      const targetDestination = isAuthenticated
        ? '/tickets'
        : `/dashboard/orders/verify?reference=${encodeURIComponent(orderData.reference)}`;

      if (!orderData.amount || orderData.amount === 0) {
        // Free ticket — skip payment
        setLastConfirmedPass({
          eventTitle: activeEvent.title,
          dateStr: formatDate(activeEvent.event_date),
          city: activeEvent.city || 'Lagos',
          tierName: currentSelectedTier.name,
          qty: bookingQty,
          amountStr: 'Free',
          guestName: primaryAttendee.name,
        });
        showToast('Ticket claimed successfully!');
        setTimeout(() => {
          window.location.href = targetDestination;
        }, 1200);
        return;
      }

      await openPaystackCheckout({
        email: primaryAttendee.email,
        amount: orderData.amount,
        reference: orderData.reference,
        accessCode: orderData.accessCode,
        authorizationUrl: orderData.authorizationUrl,
        onSuccess: async (transaction: any) => {
          try {
            await api.get(`/api/payments/verify/${orderData.reference}`);
          } catch (_) {/* best-effort verify */ }
          setLastConfirmedPass({
            eventTitle: activeEvent.title,
            dateStr: formatDate(activeEvent.event_date),
            city: activeEvent.city || 'Lagos',
            tierName: currentSelectedTier.name,
            qty: bookingQty,
            amountStr: formatNaira(totalAmountKobo),
            guestName: primaryAttendee.name,
          });
          showToast('Payment confirmed! Your ticket is ready.');
          setTimeout(() => {
            window.location.href = targetDestination;
          }, 1200);
        },
        onCancel: () => {
          showToast('Payment cancelled. Your order was not completed.');
          setBookingIsLoading(false);
        },
      });
    } catch (err: any) {
      console.error('[Checkout Error Detail]:', err?.response?.data || err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Checkout failed. Please try again.';
      showToast(msg);
      setBookingIsLoading(false);
    }
  };

  // Title update
  useEffect(() => {
    if (currentRoute === 'explore') {
      document.title = 'Discover live events — Vybetix';
    } else if (currentRoute === 'signin') {
      document.title = 'Sign in — Vybetix';
    } else if (currentRoute === 'signup') {
      document.title = 'Create an account — Vybetix';
    } else if (currentRoute === 'event' && activeEvent) {
      document.title = `${activeEvent.title} — Event details | Vybetix`;
    } else if (currentRoute === 'booking' && activeEvent) {
      document.title = `${activeEvent.title} — Book Pass | Vybetix`;
    } else if (currentRoute === 'confirmed' && activeEvent) {
      document.title = `${activeEvent.title} — Verified Pass | Vybetix`;
    } else {
      document.title = 'Vybetix — Be there.';
    }
  }, [currentRoute, activeEvent]);

  // Floating green pill toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Toggle saving an event
  const toggleSaveEvent = (id: string, name: string) => {
    setSavedEvents((prev) => {
      const next = !prev[id];
      showToast(next ? `Saved "${name}" to your shortlist.` : `Removed "${name}" from your shortlist.`);
      return { ...prev, [id]: next };
    });
  };

  // Submit booking pass
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;
    const name = bookingAttendees[0]?.name?.trim() || 'Guest';
    setLastConfirmedPass({
      eventTitle: activeEvent.title,
      dateStr: formatDate(activeEvent.event_date),
      city: activeEvent.city || 'Lagos',
      tierName: currentSelectedTier.name,
      qty: bookingQty,
      amountStr: formatNaira(totalAmountKobo),
      guestName: name,
    });
    window.location.hash = `confirmed/${activeEvent.id}`;
  };

  // Submit auth
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSignup = currentRoute === 'signup';

    if (isSignup && authPassword !== authConfirm) {
      showToast('Your passwords do not match.');
      return;
    }

    if (isSignup && authPassword.length < 8) {
      showToast('Password must be at least 8 characters long.');
      return;
    }

    setIsAuthSubmitting(true);
    try {
      if (isSignup) {
        const isOrg = authRole === 'organizer' || isOrganizerSignup;
        let normalizedPhone = '+2348000000000';
        if (authPhone?.trim()) {
          let d = authPhone.replace(/\D/g, '');
          if (d.startsWith('234')) d = d.slice(3);
          d = d.replace(/^0+/, '');
          if (d) normalizedPhone = `+234${d}`;
        }
        await register({
          email: authEmail,
          password: authPassword,
          fullName: authName || 'Guest User',
          phone: normalizedPhone,
          role: isOrg ? 'organizer' : 'buyer',
          business_name: isOrg ? (authName || 'My Organization') : undefined,
        });
        showToast('Account created! Taking you to dashboard...');
        window.location.href = '/dashboard';
        return;
      } else {
        await login({ email: authEmail, password: authPassword });
        showToast('Signed in successfully! Loading dashboard...');
        window.location.href = '/dashboard';
        return;
      }
    } catch (err: any) {
      setIsAuthSubmitting(false);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        (isSignup ? 'Registration failed. Please check your credentials.' : 'Invalid email or password.');
      showToast(errMsg);
    }
  };

  // Reset explore filters
  const handleResetExplore = () => {
    setExploreQuery('');
    setExploreCity('all');
    setExploreCategory('all');
    setIsCategoryPopupOpen(false);
  };

  // Filtered real events for explore
  const filteredExploreEvents = useMemo(() => {
    return realEvents.filter((e) => {
      const matchCity = exploreCity === 'all' || (e.city || '').toLowerCase() === exploreCity.toLowerCase();
      const matchCat =
        exploreCategory === 'all' ||
        (e.category || '').toLowerCase() === exploreCategory.toLowerCase();
      const matchQuery =
        !exploreQuery.trim() ||
        `${e.title} ${e.category} ${e.city} ${e.venue}`
          .toLowerCase()
          .includes(exploreQuery.trim().toLowerCase());
      return matchCity && matchCat && matchQuery;
    });
  }, [realEvents, exploreCity, exploreCategory, exploreQuery]);

  const trendingRealEvents = filteredExploreEvents.slice(0, 3);
  const tourRealEvents = filteredExploreEvents.slice(3);
  const selectedCategoryObj = EVENT_CATEGORIES.find((c) => c.value === exploreCategory) || EVENT_CATEGORIES[0];

  return (
    <div className="bg-[#10100f] text-[#f1ede4] font-['DM_Sans',sans-serif] selection:bg-[#ff5a24] selection:text-[#10100f] min-h-screen">

      {/* =========================================================================
          VIEW A: FLOW SCREENS (Explore, Event Details, Booking, Confirmed, Signin, Signup)
          ========================================================================= */}
      {currentRoute !== 'home' ? (
        <div id="flowpage" className="min-h-screen">

          {/* 1. DISCOVERY / EXPLORE PAGE (#explore) */}
          {currentRoute === 'explore' && (
            <div className="wrap explore-page">
              <div className="flowheader flow-context">
                <span>VYBETIX / LIVE EXPERIENCES</span>
                <a href="#home" className="flowback">← Back to Vybetix home</a>
              </div>

              {/* Discovery Intro Section with Real Feature Pick */}
              <section className="explore-intro">
                <div>
                  <div className="floweyebrow">THE DISCOVERY EDIT / VOL. 01</div>
                  <h1 tabIndex={-1}>
                    YOUR NEXT<br />
                    <span>OBSESSION.</span>
                  </h1>
                  <p>
                    The gigs, the late nights, the unexpected plans.<br />
                    Find something worth stepping outside for.
                  </p>
                </div>

                {realEvents.length > 0 ? (
                  <a
                    className="explore-feature"
                    href={`#event/${realEvents[0].id}`}
                    style={{
                      backgroundImage: `url(${realEvents[0].cover_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200'})`,
                    }}
                  >
                    <span className="feature-label">THE EDITOR’S PICK / LIVE EVENT</span>
                    <span className="feature-bottom">
                      <strong>{realEvents[0].title.toUpperCase()}</strong>
                      <span>
                        {(realEvents[0].city || 'LAGOS').toUpperCase()} / {formatDate(realEvents[0].event_date)}<br />
                        <b>VIEW THE EVENT ↗</b>
                      </span>
                    </span>
                  </a>
                ) : (
                  <div className="explore-feature flex items-center justify-center p-8 bg-[#20211a] border border-[#393a32]">
                    <span className="text-xs uppercase font-bold text-[#a7a89e]">
                      No events published yet. Be the first to host!
                    </span>
                  </div>
                )}
              </section>

              {/* Search & Filter Form */}
              <form
                id="explore-search"
                className="explore-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsCategoryPopupOpen(false);
                }}
              >
                <label>
                  <span>FIND YOUR NEXT EVENT</span>
                  <input
                    id="explore-query"
                    type="search"
                    placeholder="Search events, venues, artists…"
                    value={exploreQuery}
                    onChange={(e) => setExploreQuery(e.target.value)}
                  />
                </label>

                <label>
                  <span>CITY</span>
                  <select
                    id="explore-city"
                    value={exploreCity}
                    onChange={(e) => setExploreCity(e.target.value)}
                  >
                    <option value="all">All Cities</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                    <option value="Ibadan">Ibadan</option>
                    <option value="Enugu">Enugu</option>
                  </select>
                </label>

                {/* Category Dropdown with Interactive Popup */}
                <div className="category-field relative">
                  <span className="category-label" id="category-field-label">EVENT CATEGORY</span>
                  <button
                    type="button"
                    className="category-trigger"
                    id="category-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={isCategoryPopupOpen}
                    onClick={() => setIsCategoryPopupOpen(!isCategoryPopupOpen)}
                  >
                    <span id="category-selected">{selectedCategoryObj.name}</span>
                    <span className="category-chevron" aria-hidden="true">▾</span>
                  </button>

                  {isCategoryPopupOpen && (
                    <div className="category-popup" id="category-options" role="listbox">
                      <div className="category-popup-heading" role="presentation">
                        <span>EXPLORE BY CATEGORY</span>
                        <span>LIVE DATABASE</span>
                      </div>
                      <div className="category-options-grid" role="presentation">
                        {EVENT_CATEGORIES.map((cat) => {
                          const count =
                            cat.value === 'all'
                              ? realEvents.length
                              : realEvents.filter((e) => (e.category || '').toLowerCase() === cat.value.toLowerCase()).length;
                          const isSelected = exploreCategory === cat.value;
                          return (
                            <button
                              key={cat.value}
                              type="button"
                              role="option"
                              className="category-option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setExploreCategory(cat.value);
                                setIsCategoryPopupOpen(false);
                              }}
                            >
                              <span className="category-option-top">
                                <span>{cat.name}</span>
                                <span className="category-count">{count}</span>
                              </span>
                              <small>{cat.hint}</small>
                              {isSelected && <span className="category-check" aria-hidden="true">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button className="btn" type="submit">
                  Search events ↗
                </button>
              </form>

              {/* Status Row */}
              <div className="filter-status-row">
                <span id="category-status">
                  {(exploreCategory === 'all' ? 'ALL EVENTS' : selectedCategoryObj.name.toUpperCase()) +
                    ' / ' +
                    (exploreCity === 'all' ? 'ALL CITIES' : exploreCity.toUpperCase())}
                </span>
                <button type="button" id="clear-explore" onClick={handleResetExplore}>
                  Reset filters ↺
                </button>
              </div>

              <p className="explore-result" aria-live="polite">
                {isLoadingEvents
                  ? 'Fetching live events from database...'
                  : `${filteredExploreEvents.length} live event${filteredExploreEvents.length === 1 ? ' matches' : 's match'} your criteria.`}
              </p>

              {/* Section 01: Trending Events */}
              <section className="explore-section" id="trending-events">
                <div className="explore-sectionhead">
                  <div>
                    <div className="floweyebrow">01 / IN THE MIX</div>
                    <h2>Trending events<span>.</span></h2>
                  </div>
                  <span className="section-caption">
                    LIVE CALENDAR<br />VERIFIED ON-CHAIN &amp; GATE PASSES
                  </span>
                </div>

                {isLoadingEvents ? (
                  <div className="py-20 text-center">
                    <div className="flower mx-auto mb-4" />
                    <p className="text-xs uppercase tracking-widest text-[#a7a89e]">Loading real events...</p>
                  </div>
                ) : trendingRealEvents.length > 0 ? (
                  <div className="explore-grid">
                    {trendingRealEvents.map((e) => {
                      const startingPrice =
                        e.ticket_tiers && e.ticket_tiers.length > 0
                          ? Math.min(...e.ticket_tiers.map((t) => t.price))
                          : 0;
                      return (
                        <article key={e.id} className="explore-event">
                          <a
                            className="explore-poster"
                            href={`#event/${e.id}`}
                            aria-label={`View ${e.title}`}
                            style={{
                              backgroundImage: `url(${e.cover_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200'})`,
                            }}
                          >
                            <span className="poster-badge">{(e.category || 'MUSIC').toUpperCase()}</span>
                            <span className="explore-poster-title">{e.title}</span>
                            <span className="poster-foot">
                              VYBETIX / LIVE PASS <b>↗</b>
                            </span>
                          </a>
                          <div className="explore-event-info">
                            <span className="explore-date">{formatDate(e.event_date)}</span>
                            <h3>
                              <a href={`#event/${e.id}`}>{e.title}</a>
                            </h3>
                            <div className="explore-price">
                              <span>{e.venue || e.city || 'Lagos'}</span>
                              <strong>From {formatNaira(startingPrice)}</strong>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="explore-empty">
                    <p>No published events found matching your criteria.</p>
                    <a href="#signup/organizer" className="btn mt-4 inline-flex">
                      Host the first event ↗
                    </a>
                  </div>
                )}
              </section>

              {/* Section 02: Spotlight Tour Selections */}
              {tourRealEvents.length > 0 && (
                <section className="explore-section" id="spotlight-tours">
                  <div className="explore-sectionhead">
                    <div>
                      <div className="floweyebrow">02 / TAKE IT ON THE ROAD</div>
                      <h2>Spotlight selections<span>.</span></h2>
                    </div>
                    <span className="section-caption">
                      BIG-ROOM ENERGY.<br />ANOTHER CITY. ANOTHER STORY.
                    </span>
                  </div>

                  <div className="explore-grid tour-grid">
                    {tourRealEvents.map((e) => {
                      const startingPrice =
                        e.ticket_tiers && e.ticket_tiers.length > 0
                          ? Math.min(...e.ticket_tiers.map((t) => t.price))
                          : 0;
                      return (
                        <article key={e.id} className="explore-event tour-event">
                          <a
                            className="explore-poster"
                            href={`#event/${e.id}`}
                            aria-label={`View ${e.title}`}
                            style={{
                              backgroundImage: `url(${e.cover_image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200'})`,
                            }}
                          >
                            <span className="poster-badge">SPOTLIGHT / LIVE PASS</span>
                            <span className="explore-poster-title">{e.title}</span>
                            <span className="poster-foot">
                              VYBETIX / OFFICIAL <b>↗</b>
                            </span>
                          </a>
                          <div className="explore-event-info">
                            <span className="explore-date">{formatDate(e.event_date)}</span>
                            <h3>
                              <a href={`#event/${e.id}`}>{e.title}</a>
                            </h3>
                            <div className="explore-price">
                              <span>{e.city || 'Nigeria'}</span>
                              <strong>From {formatNaira(startingPrice)}</strong>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Section 03: Trending Vibes */}
              <section className="explore-section vibes-section">
                <div className="explore-sectionhead">
                  <div>
                    <div className="floweyebrow">03 / FOLLOW THE FEELING</div>
                    <h2>Trending vibes<span>.</span></h2>
                  </div>
                  <span className="section-caption">
                    PICK A MOOD.<br />WE’LL FIND THE LIVE PLANS.
                  </span>
                </div>

                <div className="vibes-grid">
                  <button
                    className="vibe-tile vibe-music"
                    onClick={() => {
                      setExploreCategory('music');
                      setExploreCity('all');
                      setExploreQuery('');
                    }}
                  >
                    <span>01 / MUSIC</span>
                    <strong>LOUDER.<br />CLOSER.<br />LIVE.</strong>
                    <span>Explore live music <b>↗</b></span>
                  </button>

                  <button
                    className="vibe-tile vibe-night"
                    onClick={() => {
                      setExploreCategory('campus');
                      setExploreCity('all');
                      setExploreQuery('');
                    }}
                  >
                    <span>02 / CAMPUS SCENE</span>
                    <strong>STUDENT<br />LIFE.</strong>
                    <span>Find campus raves <b>↗</b></span>
                  </button>

                  <button
                    className="vibe-tile vibe-art"
                    onClick={() => {
                      setExploreCategory('tech');
                      setExploreCity('all');
                      setExploreQuery('');
                    }}
                  >
                    <span>03 / TECH &amp; BUILD</span>
                    <strong>DEMOS.<br />FOUNDERS.<br />NETWORKS.</strong>
                    <span>Find developer meetups <b>↗</b></span>
                  </button>
                </div>
              </section>

              <div className="explore-end">
                <p>
                  Not every good night starts with a plan.<br />
                  Host your event or step into the crowd.
                </p>
                <button className="explore-reset" onClick={handleResetExplore}>
                  Show all events ↗
                </button>
              </div>

              <div className="flowfooter">
                <a href="#home">← Back to Vybetix home</a>
                <span>VYBETIX / REAL EXPERIENCES. VERIFIED DIGITAL PASSES.</span>
              </div>
            </div>
          )}

          {/* 2. EVENT DETAILS SCREEN (#event/:id) */}
          {currentRoute === 'event' && (
            <div className="wrap">
              <div className="flowheader flow-context">
                <span>VYBETIX / EVENT DETAILS</span>
                <a href="#explore" className="flowback">← Back to the lineup</a>
              </div>

              {activeEvent ? (
                <>
                  <div className="flowtop">
                    <span>THE LINEUP / {(activeEvent.category || 'MUSIC').toUpperCase()}</span>
                    <span>VERIFIED DIGITAL PASS</span>
                  </div>

                  <section className="detailhero">
                    <div
                      className="detailphoto"
                      style={{
                        backgroundImage: `url(${activeEvent.cover_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200'})`,
                      }}
                    />
                    <div className="detailtitle">
                      <span className="eventlabel">{(activeEvent.category || 'MUSIC').toUpperCase()} / LIVE PASS</span>
                      <h1 tabIndex={-1}>{activeEvent.title}</h1>
                      <div className="detailstrip">
                        {formatDate(activeEvent.event_date)} &nbsp; / &nbsp; {activeEvent.venue || activeEvent.city || 'Lagos'}, Nigeria
                      </div>
                    </div>
                  </section>

                  <div className="detailcolumns">
                    <div className="detailcontent">
                      <div className="floweyebrow">THE STORY / YOUR NIGHT</div>
                      <h2>Some nights deserve<br />more than a recap.</h2>
                      <p>{activeEvent.description}</p>

                      <div className="detailfacts">
                        <div>
                          <span>WHEN</span>
                          <strong>{formatDate(activeEvent.event_date)}</strong>
                        </div>
                        <div>
                          <span>WHERE</span>
                          <strong>{activeEvent.venue || activeEvent.city || 'Lagos'}, Nigeria</strong>
                        </div>
                        <div>
                          <span>ADMISSION</span>
                          <strong>Verified Digital Ticket / QR Gate Scan</strong>
                        </div>
                        <div>
                          <span>ORGANIZER</span>
                          <strong>Verified Creator</strong>
                        </div>
                      </div>

                      <h2>Before you show up.</h2>
                      <details>
                        <summary>How will I receive my pass?</summary>
                        <p>
                          Passes are cryptographically minted and issued directly to your device and email with HMAC fraud-protection.
                        </p>
                      </details>
                      <details>
                        <summary>Can I transfer my pass to someone else?</summary>
                        <p>
                          Yes. You can securely transfer tickets directly from your user dashboard to any email address.
                        </p>
                      </details>
                      <details>
                        <summary>What is the refund and cancellation policy?</summary>
                        <p>
                          If an event is postponed or cancelled by the organizer, automatic full reversals are issued back to your payment account.
                        </p>
                      </details>
                    </div>

                    <aside className="bookingstub">
                      <div className="floweyebrow">YOUR PASS TO THE NIGHT</div>
                      <span className="pricebig">
                        {activeEventTiers.length > 0
                          ? Math.min(...activeEventTiers.map((t) => t.price)) === 0
                            ? 'FREE'
                            : formatNaira(Math.min(...activeEventTiers.map((t) => t.price)))
                          : 'FREE'}
                      </span>
                      <p>Starting price per attendee.<br />Select tiers and secure your pass.</p>

                      <div className="flex flex-col gap-3">
                        <a className="btn !w-full justify-center" href={`#booking/${activeEvent.id}`}>
                          {activeEventTiers.length > 0 && Math.min(...activeEventTiers.map((t) => t.price)) === 0
                            ? 'Claim Free Passes'
                            : 'Book Tickets & Pay'}{' '}
                          <span className="arrow">↗</span>
                        </a>
                      </div>

                      <div className="stubnote">
                        INSTANT ISSUANCE<br />HMAC cryptographic gate security. Zero fake passes.
                      </div>
                    </aside>
                  </div>
                </>
              ) : (
                <div className="py-32 text-center">
                  <h2>Event not found</h2>
                  <p className="my-4 text-xs text-[#a7a89e]">The requested event could not be found or has ended.</p>
                  <a href="#explore" className="btn">
                    Browse all events ↗
                  </a>
                </div>
              )}

              <div className="flowfooter">
                <span>VYBETIX / OFFICIAL EVENT PLATFORM</span>
                <span>Verified issuance. Instant bank settlement.</span>
              </div>
            </div>
          )}

          {/* 3. BOOKING / CHECKOUT SCREEN (#booking/:id) */}
          {currentRoute === 'booking' && (
            <div className="wrap">
              <div className="flowheader flow-context">
                <span>VYBETIX / PASS SELECTOR</span>
                <a href="#explore" className="flowback">← Back to the lineup</a>
              </div>

              {activeEvent ? (
                <section className="checkout">
                  <div className="flowtop">
                    <a href={`#event/${activeEvent.id}`}>← EVENT DETAILS</a>
                    <span>OFFICIAL PASS PURCHASE</span>
                  </div>

                  <div className="floweyebrow">YOUR NEXT SCENE</div>
                  <h1 tabIndex={-1}>MAKE IT A PLAN.</h1>
                  <p className="checkoutintro">
                    Select your ticket tier and number of passes. Guaranteed authentic gate admission.
                  </p>

                  <div className="steps">
                    <strong>01 / CHOOSE YOUR PASS</strong>
                    <span>02 / ORDER CONFIRMATION</span>
                  </div>

                  <div className="bookinggrid">
                    <form className="ticketform" id="bookingform" onSubmit={handleFullPageCheckout}>
                      <fieldset className="formsection" style={{ margin: 0, border: 0, paddingInline: 0 }}>
                        <legend style={{ fontSize: '15px', paddingRight: '15px' }}>01 / Pick your tier</legend>
                        {activeEventTiers.map((tier, idx) => (
                          <label key={tier.id || idx} className="tier">
                            <input
                              type="radio"
                              name="tier"
                              value={idx}
                              checked={selectedTierIndex === idx}
                              onChange={() => setSelectedTierIndex(idx)}
                            />
                            <span className="tiercopy">
                              {tier.name}
                              <small>{tier.description || 'Standard entry pass'}</small>
                            </span>
                            <strong>{tier.price === 0 ? 'FREE' : formatNaira(tier.price)}</strong>
                          </label>
                        ))}

                        <div className="qtyrow">
                          <span>
                            How many passes? <br />
                            <small>1–6 tickets per checkout</small>
                          </span>
                          <div className="qtycontrol">
                            <button
                              type="button"
                              id="minus"
                              aria-label="Remove one ticket"
                              onClick={() => setBookingQty((prev) => Math.max(1, prev - 1))}
                              disabled={bookingQty <= 1}
                            >
                              −
                            </button>
                            <output id="quantity" aria-live="polite">
                              {bookingQty}
                            </output>
                            <button
                              type="button"
                              id="plus"
                              aria-label="Add one ticket"
                              onClick={() => setBookingQty((prev) => Math.min(6, prev + 1))}
                              disabled={bookingQty >= 6}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </fieldset>

                      <div className="formsection">
                        <h2>
                          02 / Pass holder information {bookingQty > 1 ? `(${bookingQty} Passes)` : ''}
                        </h2>

                        <div className="flex flex-col gap-6">
                          {bookingAttendees.map((att, idx) => (
                            <div
                              key={idx}
                              className={`p-4 border ${idx === 0 ? 'border-[#5a4933] bg-[#16140f]' : 'border-[#3f382a] bg-[#191712]'}`}
                            >
                              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#383226]">
                                <span className="text-[11px] font-bold tracking-wider text-[#ff5a24] uppercase">
                                  {idx === 0 ? '01 / Primary Attendee & Ticket Contact' : `0${idx + 1} / Guest Pass #${idx + 1}`}
                                </span>
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => copyPrimaryToAttendee(idx)}
                                    className="text-[11px] text-[#a7a89e] hover:text-[#ff5a24] transition-colors"
                                  >
                                    Copy primary info ↗
                                  </button>
                                )}
                              </div>

                              <label className="fieldlabel" htmlFor={`guestname-${idx}`}>
                                Full name / Attendee name
                              </label>
                              <input
                                className="namefield"
                                id={`guestname-${idx}`}
                                name={`guestname-${idx}`}
                                autoComplete="name"
                                maxLength={60}
                                placeholder={idx === 0 ? 'e.g. Tunde Adebayo' : `Guest ${idx + 1} Full Name`}
                                value={att.name}
                                onChange={(e) => updateAttendee(idx, 'name', e.target.value)}
                                required
                              />

                              <label className="fieldlabel" htmlFor={`guestemail-${idx}`} style={{ marginTop: '14px' }}>
                                Email address (tickets will be sent here)
                              </label>
                              <input
                                type="email"
                                className="namefield"
                                id={`guestemail-${idx}`}
                                name={`guestemail-${idx}`}
                                autoComplete="email"
                                placeholder={idx === 0 ? 'e.g. tunde@example.com' : `guest${idx + 1}@example.com`}
                                value={att.email}
                                onChange={(e) => updateAttendee(idx, 'email', e.target.value)}
                                required
                              />

                              <label className="fieldlabel" htmlFor={`guestphone-${idx}`} style={{ marginTop: '14px' }}>
                                Phone number (WhatsApp verification)
                              </label>
                              <div className="flex items-center bg-[#191711] border border-[#5a4933] focus-within:border-[#ff5a24] transition-colors">
                                <span className="px-3.5 py-3 text-xs font-bold text-[#ff5a24] bg-[#221f18] border-r border-[#5a4933] select-none tracking-wider">
                                  +234
                                </span>
                                <input
                                  type="tel"
                                  className="w-full bg-transparent text-[#f1ede4] px-4 py-3 text-[13px] outline-none placeholder-[#7a7265]"
                                  id={`guestphone-${idx}`}
                                  name={`guestphone-${idx}`}
                                  autoComplete="tel"
                                  maxLength={10}
                                  placeholder="801 234 5678"
                                  value={att.phone}
                                  onChange={(e) => updateAttendee(idx, 'phone', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="text-[10px] text-[#a7a89e] mt-1">
                                Country code (+234) is preset. Enter 10 digits without leading 0.
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <label className="consent">
                        <input type="checkbox" required />
                        <span>I confirm that the details entered above are accurate for entry verification.</span>
                      </label>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="btn !w-full justify-center text-sm font-bold"
                          disabled={bookingIsLoading}
                          style={{
                            opacity: bookingIsLoading ? 0.75 : 1,
                            cursor: bookingIsLoading ? 'not-allowed' : 'pointer',
                            padding: '18px 24px',
                          }}
                        >
                          {bookingIsLoading ? (
                            <span className="flex items-center justify-center gap-2 w-full">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>{totalAmountKobo === 0 ? 'Claiming Free Passes...' : 'Processing Checkout...'}</span>
                            </span>
                          ) : totalAmountKobo === 0 ? (
                            <>
                              Claim Free Passes <span className="arrow">↗</span>
                            </>
                          ) : (
                            <>
                              Pay {formatNaira(totalAmountKobo)} with Paystack <span className="arrow">↗</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    <aside className="ordersummary" aria-label="Order summary">
                      <div
                        className="summaryart"
                        style={{
                          backgroundImage: `url(${activeEvent.cover_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200'})`,
                        }}
                      />
                      <div className="summarybody">
                        <h2>{activeEvent.title}</h2>
                        <div className="summarymeta">
                          {formatDate(activeEvent.event_date)}<br />
                          {activeEvent.venue || activeEvent.city || 'Lagos'}
                        </div>
                        <div className="summarylines">
                          <div className="summaryline">
                            <span>{currentSelectedTier?.name}</span>
                            <span>{currentSelectedTier?.price === 0 ? 'FREE' : formatNaira(currentSelectedTier?.price || 0)}</span>
                          </div>
                          <div className="summaryline">
                            <span>Quantity</span>
                            <span>{bookingQty}</span>
                          </div>
                          <div className="summaryline">
                            <span>Platform fee</span>
                            <span>₦0 (Waived)</span>
                          </div>
                        </div>
                        <div className="summarytotal">
                          <span>Total Amount</span>
                          <strong id="summarytotal" aria-live="polite">
                            {totalAmountKobo === 0 ? 'FREE' : formatNaira(totalAmountKobo)}
                          </strong>
                        </div>
                        <div className="nopay">
                          {totalAmountKobo === 0 ? 'FREE ADMISSION PASS' : 'VERIFIED PAYSTACK GATEWAY'}
                        </div>
                      </div>
                    </aside>
                  </div>
                </section>
              ) : (
                <div className="py-32 text-center">
                  <h2>No event selected</h2>
                  <a href="#explore" className="btn mt-4 inline-flex">
                    Browse events ↗
                  </a>
                </div>
              )}

              <div className="flowfooter">
                <span>VYBETIX</span>
                <span>Instant issuance. Zero ticket fraud.</span>
              </div>
            </div>
          )}

          {/* 4. CONFIRMED PASS SCREEN (#confirmed/:id) */}
          {currentRoute === 'confirmed' && (
            <div className="wrap">
              <div className="flowheader flow-context">
                <span>VYBETIX / PASS CONFIRMATION</span>
                <a href="#explore" className="flowback">← Back to the lineup</a>
              </div>

              {!lastConfirmedPass ? (
                <section className="confirmation">
                  <div className="floweyebrow">NO PASS IN THIS SESSION</div>
                  <h1 tabIndex={-1}>
                    LET’S START<br />WITH A TICKET.
                  </h1>
                  <p>Choose an event pass to view confirmation.</p>
                  <a className="btn" href="#explore">
                    Browse events ↗
                  </a>
                </section>
              ) : (
                <section className="confirmation">
                  <div className="successmark" aria-hidden="true">✓</div>
                  <div className="floweyebrow">VERIFIED PASS READY</div>
                  <h1 tabIndex={-1}>
                    THAT’S YOUR<br />NEXT SCENE.
                  </h1>
                  <p>
                    Your pass has been generated. Present this cryptographic ticket at the entrance.
                  </p>

                  <article className="demopass">
                    <div className="passwarning">OFFICIAL ENTRY PASS / SCAN AT GATE</div>
                    <div className="logo">
                      vybetix<i>✳</i>
                    </div>
                    <h2>{lastConfirmedPass.eventTitle}</h2>
                    <div className="summarymeta">
                      {lastConfirmedPass.dateStr}<br />{lastConfirmedPass.city}
                    </div>
                    <div className="passgrid">
                      <div>
                        <small>PASS HOLDER</small>
                        {lastConfirmedPass.guestName}
                      </div>
                      <div>
                        <small>TICKET TYPE</small>
                        {lastConfirmedPass.tierName}
                      </div>
                      <div>
                        <small>QUANTITY</small>
                        {lastConfirmedPass.qty} ticket{lastConfirmedPass.qty === 1 ? '' : 's'}
                      </div>
                      <div>
                        <small>TOTAL VALUE</small>
                        {lastConfirmedPass.amountStr}
                      </div>
                    </div>
                    <div className="passend">
                      <div className="barcode" aria-hidden="true" />
                      HMAC CRYPTOGRAPHIC SCANNING PASS<br />
                      VERIFIED BY VYBETIX GATE ENGINE
                    </div>
                  </article>

                  <div className="flex gap-4 items-center justify-center flex-wrap my-6">
                    <a className="btn" href="#explore">
                      Back to the lineup ↗
                    </a>
                    {activeEvent && (
                      <a className="btn line" href={`#event/${activeEvent.id}`}>
                        View event details
                      </a>
                    )}
                  </div>
                </section>
              )}

              <div className="flowfooter">
                <span>VYBETIX / OFFICIAL EVENT EXPERIENCE</span>
                <span>Verified digital issuance.</span>
              </div>
            </div>
          )}

          {/* 5. SIGN IN / ACCOUNT CREATION SCREEN (#signin and #signup) */}
          {(currentRoute === 'signin' || currentRoute === 'signup') && (
            <div className="wrap auth-wrap">
              <div className="auth-layout">
                <aside
                  className="auth-story"
                  style={{
                    backgroundImage: `url(${realEvents.length > 0 && realEvents[0].cover_image_url ? realEvents[0].cover_image_url : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200'})`,
                  }}
                >
                  <div className="auth-story-top">VYBETIX / YOUR NEXT CHAPTER</div>
                  <div className="auth-story-copy">
                    <span className="floweyebrow">
                      {currentRoute === 'signup' ? 'THE GOOD PART STARTS HERE' : 'BACK FOR ANOTHER NIGHT'}
                    </span>
                    <h2>
                      {isOrganizerSignup ? (
                        <>YOU MAKE<br />THE NIGHT.<br />WE MAKE<br />THE WAY.</>
                      ) : currentRoute === 'signup' ? (
                        <>MORE NIGHTS.<br />MORE STORIES.<br />MORE YOU.</>
                      ) : (
                        <>GOOD TO<br />HAVE YOU<br />BACK.</>
                      )}
                    </h2>
                    <p>
                      {isOrganizerSignup
                        ? 'From the first announcement to the final encore. Give your next event a home.'
                        : 'Discover the music, the people, and the plans that make showing up worth it.'}
                    </p>
                  </div>
                  <div className="auth-story-foot">
                    <span>REAL LIFE. FULL VOLUME.</span>
                    <span>01 / THE NEXT SCENE</span>
                  </div>
                </aside>

                <section className="auth-panel">
                  <a className="auth-back" href="#explore">← Back to events</a>

                  <div className="auth-heading">
                    <div className="floweyebrow">
                      {currentRoute === 'signup' ? 'JOIN THE VYBE' : 'YOUR VYBETIX ACCOUNT'}
                    </div>
                    <h1 tabIndex={-1}>
                      {currentRoute === 'signup' ? 'Create your account.' : 'Welcome back.'}
                    </h1>
                    <p>
                      {currentRoute === 'signup' ? (
                        <>
                          Already part of the crowd? <a href="#signin">Sign in ↗</a>
                        </>
                      ) : (
                        <>
                          New around here? <a href="#signup">Create an account ↗</a>
                        </>
                      )}
                    </p>
                  </div>

                  <form id="auth-form" autoComplete="off" onSubmit={handleAuthSubmit}>
                    {!authSubmitted ? (
                      <div id="auth-fields">
                        {currentRoute === 'signup' && (
                          <>
                            <fieldset className="auth-role">
                              <legend>I’m here to</legend>
                              <label>
                                <input
                                  type="radio"
                                  name="accountrole"
                                  value="attendee"
                                  checked={authRole === 'attendee' && !isOrganizerSignup}
                                  onChange={() => {
                                    setAuthRole('attendee');
                                    setIsOrganizerSignup(false);
                                  }}
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
                                  checked={authRole === 'organizer' || isOrganizerSignup}
                                  onChange={() => {
                                    setAuthRole('organizer');
                                    setIsOrganizerSignup(true);
                                  }}
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
                              placeholder="Your full name"
                              maxLength={60}
                              value={authName}
                              onChange={(e) => setAuthName(e.target.value)}
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
                                value={authPhone}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, '');
                                  if (val.startsWith('234')) val = val.slice(3);
                                  val = val.replace(/^0+/, '');
                                  setAuthPhone(val);
                                }}
                              />
                            </div>
                          </>
                        )}

                        <label className="auth-label" htmlFor="auth-email">
                          Email address
                        </label>
                        <input
                          className="auth-input"
                          id="auth-email"
                          type="email"
                          placeholder="you@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
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
                            placeholder="At least 8 characters"
                            minLength={8}
                            maxLength={100}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
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

                        {currentRoute === 'signup' ? (
                          <>
                            <label className="auth-label" htmlFor="auth-confirm">
                              Confirm password
                            </label>
                            <div className="auth-password">
                              <input
                                className="auth-input"
                                id="auth-confirm"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                minLength={8}
                                maxLength={100}
                                value={authConfirm}
                                onChange={(e) => setAuthConfirm(e.target.value)}
                                required
                              />
                              <button
                                type="button"
                                className="password-toggle"
                                aria-controls="auth-confirm"
                                aria-label="Show confirmation password"
                                aria-pressed={showConfirm}
                                onClick={() => setShowConfirm(!showConfirm)}
                              >
                                {showConfirm ? 'Hide' : 'Show'}
                              </button>
                            </div>

                            <label className="auth-consent">
                              <input type="checkbox" required />
                              <span>I agree to the Terms of Service &amp; Community Guidelines.</span>
                            </label>
                          </>
                        ) : (
                          <>
                            <div className="auth-utilities">
                              <span>Secure Session</span>
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
                                Password reset instructions will be sent to your registered recovery email.
                              </p>
                            )}
                          </>
                        )}

                        <button
                          className="btn auth-submit"
                          type="submit"
                          disabled={isAuthSubmitting || isLoggingIn || isRegistering}
                          style={{
                            opacity: (isAuthSubmitting || isLoggingIn || isRegistering) ? 0.75 : 1,
                            cursor: (isAuthSubmitting || isLoggingIn || isRegistering) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {(isAuthSubmitting || isLoggingIn || isRegistering) ? (
                            <span className="flex items-center justify-center gap-2 w-full">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>{currentRoute === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                            </span>
                          ) : (
                            <>
                              <span>{currentRoute === 'signup' ? 'Create Account' : 'Sign In'}</span>{' '}
                              <span className="arrow">↗</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="auth-success" id="auth-success" role="status" tabIndex={-1}>
                        <div className="auth-success-icon" aria-hidden="true">✓</div>
                        <h2>
                          {currentRoute === 'signup' ? (
                            <>Your next chapter<br />looks good.</>
                          ) : (
                            <>You’re back<br />in the picture.</>
                          )}
                        </h2>
                        <p id="auth-success-copy">{authSuccessMessage}</p>
                        <a className="btn" href="#explore">
                          Discover live events ↗
                        </a>
                        <button
                          type="button"
                          className="auth-retry"
                          onClick={() => setAuthSubmitted(false)}
                        >
                          Back to form
                        </button>
                      </div>
                    )}
                  </form>

                  <div className="auth-bottom">
                    VYBETIX / STARRING YOU. DIRECTED BY THE NIGHT.
                  </div>
                </section>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* =========================================================================
            VIEW B: CANONICAL HOMEPAGE (#home)
            ========================================================================= */
        <div id="homepage">
          <div className="demo">
            Design concept · Sample events &amp; prices · No live bookings
          </div>

          {/* 1. Header Navigation - FULL WIDTH, NOT WRAPPED IN .wrap */}
          <header className="site-nav" id="site-nav">
            <div className="nav-shell">
              <a href="#home" className="logo nav-brand" aria-label="Vybetix home">
                vybetix<i aria-hidden="true"></i>
                <span className="brand-caption">YOUR NEXT GREAT NIGHT</span>
              </a>

              <nav className="desktop-nav" aria-label="Main navigation">
                <a href="#explore" data-nav="discover">
                  <span className="nav-index">01</span> Discover events
                </a>
                <a href="#about" data-nav="about">
                  <span className="nav-index">02</span> The experience
                </a>
                <a href="#host" data-nav="host">
                  <span className="nav-index">03</span> For organizers
                </a>
              </nav>

              <div className="nav-actions">
                {isAuthenticated && user ? (
                  <>
                    <a
                      className="nav-signin"
                      href="/dashboard"
                      style={{ color: '#ff5a24', fontWeight: 600 }}
                    >
                      {user.full_name?.split(' ')[0] || 'Dashboard'} ↗
                    </a>
                    <button
                      type="button"
                      className="nav-signin"
                      onClick={() => logout()}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Sign out
                    </button>
                    {user.role === 'organizer' && (
                      <a className="nav-host" href="/events/create">
                        Create event <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <a className="nav-signin" href="#signin">
                      Sign in
                    </a>
                    <a className="nav-host" href="#signup/organizer">
                      Create an event <span aria-hidden="true">↗</span>
                    </a>
                  </>
                )}
                <button
                  className="menu-toggle"
                  id="menu-toggle"
                  aria-label="Open navigation menu"
                  aria-haspopup="dialog"
                  aria-controls="mobile-nav"
                  aria-expanded={isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <span className="menu-lines" aria-hidden="true">
                    <i></i><i></i>
                  </span>
                  <span>MENU</span>
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Nav Drawer */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className="mobile-nav"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-nav-top">
                  <span id="mobile-nav-title">VYBETIX / THE NEXT SCENE</span>
                  <button
                    id="close-nav"
                    aria-label="Close navigation menu"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <p className="mobile-menu-caption">
                  GO SOMEWHERE.<br />FEEL SOMETHING.
                </p>
                <nav aria-label="Mobile navigation">
                  <a
                    href="#explore"
                    data-nav="discover"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <small>01 / FIND YOUR PEOPLE</small>
                    <span>Discover events <b>↗</b></span>
                  </a>
                  <a
                    href="#about"
                    data-nav="about"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <small>02 / THE FEELING</small>
                    <span>The experience <b>↗</b></span>
                  </a>
                  <a
                    href="#host"
                    data-nav="host"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <small>03 / MAKE IT HAPPEN</small>
                    <span>For organizers <b>↗</b></span>
                  </a>
                </nav>
                <div className="mobile-account-links">
                  {isAuthenticated && user ? (
                    <>
                      <a
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {user.full_name?.split(' ')[0] || 'Dashboard'} ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#ff5a24', textAlign: 'left', padding: 0, font: 'inherit', cursor: 'pointer' }}
                      >
                        Sign out ↗
                      </button>
                    </>
                  ) : (
                    <>
                      <a href="#signin" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign in ↗
                      </a>
                      <a href="#signup" onClick={() => setIsMobileMenuOpen(false)}>
                        Create account ↗
                      </a>
                    </>
                  )}
                </div>
                <a
                  className="btn mobile-create"
                  href={isAuthenticated && user?.role === 'organizer' ? '/events/create' : '#signup/organizer'}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create an event <span className="arrow">↗</span>
                </a>
                <div className="mobile-menu-foot">
                  <span>
                    STARRING YOU.<br />DIRECTED BY THE NIGHT.
                  </span>
                  <span className="mobile-star" aria-hidden="true"></span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Hero Section inside .wrap */}
          <div className="wrap">
            <main>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span className="dot"></span> VYBETIX PRESENTS / YOUR NEXT GREAT NIGHT
                  </div>

                  <h1 className="newheadline">
                    <span className="headline-top">DON’T JUST</span>
                    <span className="vybe-line">
                      FEEL THE <i aria-hidden="true"></i>
                    </span>
                    <span className="outline-vybe">VYBE.</span>
                    <span className="live-tag">GO LIVE IT. ↗</span>
                  </h1>

                  <p>
                    Front-row moments. Dance-floor friendships.<br />
                    Find the events you’ll still be talking about on Monday.
                  </p>

                  <div className="heroactions">
                    <a className="btn" href="#explore">
                      Find your next vybe <span className="arrow">↗</span>
                    </a>
                    <a className="textlink" href="#host">
                      Make something happen ↗
                    </a>
                  </div>

                  <div className="herotiny">
                    <span className="tinyart"></span> For the nights that never leave you.
                  </div>
                </div>

                {/* 3D Ticket Art Composition with Real Event Data */}
                <div className="heroart" aria-label="Illustrated Vybetix sample ticket">
                  <div className="orbit-label" aria-hidden="true">
                    YOUR NEXT STORY STARTS OUTSIDE ↗
                  </div>
                  <div className="halo"></div>

                  <div className="mini-pass" aria-hidden="true">
                    <span>NO FOMO / ALL ACCESS</span>
                    <strong>
                      OUTSIDE<br />IS A PLACE.
                    </strong>
                    <div className="barcode"></div>
                  </div>

                  <div className="backticket">
                    LESS SCROLLING.<br />MORE LIVING.
                  </div>

                  <div className="ticket">
                    <div className="tickethead">
                      <span>vybetix </span>
                      <span>ADMIT ONE / DEMO</span>
                    </div>

                    <div
                      className="poster"
                      style={
                        realEvents.length > 0 && realEvents[0].cover_image_url
                          ? {
                            backgroundImage: `url(${realEvents[0].cover_image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                          : undefined
                      }
                    >
                      {!(realEvents.length > 0 && realEvents[0].cover_image_url) && (
                        <div className="flower"></div>
                      )}
                      <div className="posterword">
                        {realEvents.length > 0 ? (
                          <>
                            {realEvents[0].title.toUpperCase().slice(0, 14)}
                            <small>{(realEvents[0].city || 'LAGOS').toUpperCase()} EDITION</small>
                          </>
                        ) : (
                          <>
                            THE<br />AFTER<br />HOURS<small>LEAVE THE ORDINARY OUTSIDE</small>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ticketname">
                      {realEvents.length > 0 ? realEvents[0].title.toUpperCase().slice(0, 18) : 'THE AFTER HOURS'}
                    </div>

                    <div className="ticketdata">
                      <span>
                        {realEvents.length > 0 ? formatDate(realEvents[0].event_date, 'd MMM yyyy') : 'FRI, 18 DEC 2026'}<br />
                        <strong>{realEvents.length > 0 ? (realEvents[0].city || 'LAGOS').toUpperCase() : '8 PM TILL LATE'}</strong>
                      </span>
                      <span>
                        {realEvents.length > 0 ? (realEvents[0].city || 'LAGOS').toUpperCase() + ', NIGERIA' : 'LAGOS, NIGERIA'}<br />
                        <strong>GENERAL ADMISSION</strong>
                      </span>
                    </div>

                    <div className="tear">
                      <div className="barcode"></div>
                      <span>VYB / 001 / DEMO</span>
                    </div>
                  </div>

                  <div className="sticker">
                    LESS<br />FOMO.<br />MORE GO.
                  </div>

                  <div className="wristband" aria-hidden="true">
                    <span> VYBETIX</span>
                    <b>REAL LIFE &gt; REELS</b>
                    <span>ADMIT YOU ↗</span>
                  </div>

                  <div className="sidecaption">01 / YOUR PASS TO SOMETHING GOOD</div>
                  <div className="spark"></div>
                </div>

                <div className="hero-bottom">
                  <span>STARRING YOU. / DIRECTED BY THE NIGHT.</span>
                  <a href="#explore">
                    SCROLL TO FIND YOUR PEOPLE <b>↓</b>
                  </a>
                </div>
              </section>
            </main>
          </div>

          {/* 3. Marquee Banner */}
          <div className="marquee" aria-hidden="true">
            <div className="track">
              <span>LESS FOMO</span>
              <b aria-hidden="true">/</b>
              <span>MORE FRONT ROW</span>
              <b aria-hidden="true">/</b>
              <span>FIND YOUR PEOPLE</span>
              <b aria-hidden="true">/</b>
              <span>FEEL EVERYTHING</span>
              <b aria-hidden="true">/</b>
              <span>LESS FOMO</span>
            </div>
          </div>

          {/* 4. Discover Section */}
          <section className="discover" id="discover">
            <div className="wrap">
              <div className="sectionhead">
                <div>
                  <div className="kicker">ACT 01 / THE LINEUP</div>
                  <h2>COMING SOON.<br />TO YOUR LIFE.</h2>
                </div>
                <p>
                  A big night out or a new obsession.<br />
                  There’s a vybe with your name on it.
                </p>
              </div>

              <form
                className="searchbar"
                id="searchform"
                onSubmit={(e) => {
                  e.preventDefault();
                  setLandingActiveSearch(landingSearchInput);
                }}
              >
                <input
                  id="search"
                  type="search"
                  placeholder="Search events, venues…"
                  aria-label="Search events"
                  value={landingSearchInput}
                  onChange={(e) => {
                    setLandingSearchInput(e.target.value);
                    setLandingActiveSearch(e.target.value);
                  }}
                />
                <select
                  id="home-category"
                  aria-label="Event category"
                  value={landingSelectedCategory}
                  onChange={(e) => setLandingSelectedCategory(e.target.value)}
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  id="city"
                  aria-label="Choose city"
                  value={landingSelectedCity}
                  onChange={(e) => setLandingSelectedCity(e.target.value)}
                >
                  <option value="all">All Cities</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Ibadan">Ibadan</option>
                  <option value="Enugu">Enugu</option>
                </select>
                <button className="btn" type="submit">
                  Find events ↗
                </button>
              </form>

              {/* Real Event Cards Grid */}
              {isLoadingEvents ? (
                <div className="py-20 text-center">
                  <div className="flower mx-auto mb-4" />
                  <p className="text-xs uppercase tracking-widest text-[#a7a89e]">
                    Fetching live events from database...
                  </p>
                </div>
              ) : realEvents.length > 0 ? (
                <div className="events" id="events">
                  {realEvents.slice(0, 6).map((event: EventDetail, index: number) => {
                    const cycleIndex = index % 3;
                    const visualClass = cycleIndex === 0 ? 'one' : cycleIndex === 1 ? 'two' : 'three';
                    const title = event.title;
                    const category = (event.category || 'Music').toUpperCase();
                    const city = event.city || 'Lagos';
                    const dateStr = formatDate(event.event_date);
                    const startingPrice =
                      event.ticket_tiers && event.ticket_tiers.length > 0
                        ? Math.min(...event.ticket_tiers.map((t) => t.price))
                        : 0;

                    const isSaved = savedEvents[String(event.id)];
                    const coverImage = event.cover_image_url || (event as any).image_url || (event as any).art;

                    return (
                      <article
                        key={event.id}
                        className="event"
                        data-category={event.category}
                        data-city={city}
                        data-name={title}
                      >
                        <a
                          href={`#event/${event.id}`}
                          className="block"
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div
                            className={`eventvisual ${visualClass} ${coverImage ? 'cinema-photo' : ''}`}
                            style={
                              coverImage
                                ? {
                                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%), url(${coverImage})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundRepeat: 'no-repeat',
                                }
                                : undefined
                            }
                          >
                            <span className="eventlabel">{category}</span>

                            <button
                              className="save"
                              aria-label={`Save ${title}`}
                              aria-pressed={isSaved}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSaveEvent(String(event.id), title);
                              }}
                            >
                              {isSaved ? '★' : '☆'}
                            </button>

                            {!coverImage && (
                              <>
                                {cycleIndex === 0 && (
                                  <>
                                    <div className="flower"></div>
                                    <div className="arttitle">
                                      NIGHT
                                      <small>{title.slice(0, 14)}</small>
                                    </div>
                                  </>
                                )}

                                {cycleIndex === 1 && (
                                  <>
                                    <div className="disc"></div>
                                    <div className="arttitle">
                                      VYBE
                                      <small>{title.slice(0, 14)}</small>
                                    </div>
                                  </>
                                )}

                                {cycleIndex === 2 && (
                                  <>
                                    <div className="checker"></div>
                                    <div className="arttitle">
                                      LIVE
                                      <small>{title.slice(0, 14)}</small>
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </div>

                          <div className="eventbody">
                            <div className="meta">{dateStr.toUpperCase()}</div>
                            <h3>{title}</h3>
                            <p className="location">{event.venue || city}, Nigeria</p>

                            <div className="eventfoot">
                              <strong>
                                <small>FROM</small>
                                {formatNaira(startingPrice)}
                              </strong>

                              <span className="view" aria-label={`View details for ${title}`}>
                                ↗
                              </span>
                            </div>
                          </div>
                        </a>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div id="empty" className="empty">
                  No live events match this filter. Try another category or location.
                </div>
              )}

              <p className="resultnote" id="resultnote" aria-live="polite">
                {realEvents.length} live event{realEvents.length === 1 ? '' : 's'} available on Vybetix.
              </p>

              <div className="bottomlink">
                <a id="explore-all-vybes" href="#explore">
                  Explore all vybes ↗
                </a>
              </div>
            </div>
          </section>

          {/* 5. Cinema Interlude */}
          <section className="cinema-interlude" aria-label="The Vybetix experience">
            <div className="film-edge" aria-hidden="true"></div>
            <div className="wrap scene">
              <div className="scene-meta">
                <span>VYBETIX ORIGINAL MOMENTS</span>
                <span>VOL. 01 / FULL VOLUME</span>
              </div>
              <div className="scene-title">
                <span>THIS ISN’T</span>
                <em>A WATCH-LATER</em>
                <span>KIND OF LIFE.</span>
              </div>
              <div className="scene-bottom">
                <p>
                  Some moments only happen once.<br />
                  Be in the room when they do.
                </p>
                <a href="#explore" className="round-cta" aria-label="Explore events">
                  ↗
                </a>
              </div>
            </div>
            <div className="film-edge" aria-hidden="true"></div>
          </section>

          {/* 6. Manifesto, Host, and Footer inside wrap */}
          <div className="wrap">
            <section className="manifesto" id="about">
              <div className="eyebrow">
                <span className="dot"></span> ACT 02 / THE FEELING
              </div>
              <p>
                Your camera roll deserves better than screenshots of plans.{' '}
                <span>Go to the gig. Meet your people. Stay for one more song.</span>
              </p>
            </section>

            <section className="host" id="host">
              <div className="hostcopy">
                <div className="kicker">ACT 03 / BEHIND THE SCENES</div>
                <h2>
                  YOU BRING THE VYBE.<br />WE’LL HOLD THE DOOR.
                </h2>
                <p>
                  Planning a basement set, a creative meet-up, or a night the whole city talks about? Give it a home on Vybetix.
                </p>
                <a className="btn" href="#signup/organizer">
                  <span>Let’s host something</span> <span className="arrow">↗</span>
                </a>
              </div>
              <div className="hostgraphic" aria-hidden="true">
                <div className="hoststamp">
                  <small>VYBETIX / ORGANIZERS CLUB</small>
                  YOUR EVENT.<br />
                  YOUR CROWD.<br />
                  <em>YOUR RULES.</em>
                  <div className="barcode"></div>
                </div>
              </div>
            </section>

            {/* 7. Footer */}
            <footer>
              <div className="closing-credit">
                <span>DON’T WAIT FOR THE RECAP.</span>
                <a href="#explore">BE THE STORY. ↗</a>
              </div>
              <div className="footrow">
                <a className="logo" href="#home">
                  vybetix<i></i>
                </a>
                <p>
                  Log off. Show up.<br />
                  Take the memory home.
                </p>
                <a className="textlink" href="#explore">
                  Find a vybe ↗
                </a>
              </div>
              <div className="footerbottom">
                <span>© 2026 Vybetix. Website design concept.</span>
                <span>
                  Photography: <a href="https://unsplash.com/photos/person-djing-on-stage-tAhp54-nbi0" target="_blank" rel="noopener noreferrer">A J.</a> &amp; <a href="https://unsplash.com/" target="_blank" rel="noopener noreferrer">Unsplash contributors</a> · Illustrative imagery
                </span>
              </div>
            </footer>
          </div>

          {/* Host Info Dialog Modal */}
          {isHostDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="dialog relative rounded-xl shadow-2xl max-w-lg w-full">
                <button
                  className="close"
                  aria-label="Close organizer preview"
                  onClick={() => setIsHostDialogOpen(false)}
                >
                  ×
                </button>

                <div className="kicker">VYBETIX / FOR ORGANIZERS</div>
                <h2>THE NEXT GREAT NIGHT STARTS WITH YOU.</h2>
                <p className="my-4">
                  Host your gigs, underground DJ sets, campus festivals, and community pop-ups on Vybetix. Issue fraud-proof tickets with HMAC gate verification and receive automatic split payouts straight to your bank account.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <a href="#signup/organizer" className="btn flex-1 justify-center">
                    Create Organizer Account ↗
                  </a>
                  <button
                    className="btn light flex-1 justify-center border border-[#161713]"
                    onClick={() => setIsHostDialogOpen(false)}
                  >
                    Keep exploring ↗
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Floating Green Pill Toast Notification */}
          {toastMessage && (
            <div className="toast animate-in fade-in slide-in-from-bottom-5 duration-300" role="status">
              {toastMessage}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
