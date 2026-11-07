'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { formatNaira, formatDate, formatTime } from '../lib/utils';
import { EventDetail } from '../types';

const CheckoutModal = nextDynamic(() => import('../components/tickets/CheckoutModal'), {
  ssr: false,
});

const CATEGORIES = [
  { name: 'All Events', value: 'all' },
  { name: 'Music', value: 'music' },
  { name: 'Campus', value: 'campus' },
  { name: 'Tech', value: 'tech' },
  { name: 'Comedy', value: 'comedy' },
  { name: 'Sports', value: 'sports' },
  { name: 'Food', value: 'food' },
  { name: 'Arts', value: 'arts' },
  { name: 'Nightlife', value: 'nightlife' },
];

const CITIES = [
  { label: 'All Cities', value: 'all' },
  { label: 'Lagos', value: 'Lagos' },
  { label: 'Abuja', value: 'Abuja' },
  { label: 'Port Harcourt', value: 'Port Harcourt' },
  { label: 'Ibadan', value: 'Ibadan' },
  { label: 'Benin City', value: 'Benin City' },
  { label: 'Enugu', value: 'Enugu' },
];

export default function Page() {
  const { user, isAuthenticated } = useAuth();

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [checkoutEvent, setCheckoutEvent] = useState<EventDetail | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [savedEvents, setSavedEvents] = useState<Record<string, boolean>>({});

  // Home filter state
  const [homeQuery, setHomeQuery] = useState('');
  const [homeCategory, setHomeCategory] = useState('all');
  const [homeCity, setHomeCity] = useState('all');

  // Real events from Supabase via API
  const { data: dbEvents, isLoading } = useEvents({ limit: 60 });

  const events: EventDetail[] = useMemo(() => {
    return Array.isArray(dbEvents) ? dbEvents : [];
  }, [dbEvents]);

  // Featured hero event (first real event from DB)
  const featuredEvent: EventDetail | null = events.length > 0 ? events[0] : null;

  // Home filtered events
  const homeFilteredEvents = useMemo(() => {
    return events.filter(ev => {
      const query = homeQuery.trim().toLowerCase();
      const matchCat = homeCategory === 'all' || (ev.category && ev.category.toLowerCase() === homeCategory.toLowerCase());
      const matchCity = homeCity === 'all' || (ev.city && ev.city.toLowerCase() === homeCity.toLowerCase());
      const matchQuery = !query ||
        ev.title.toLowerCase().includes(query) ||
        (ev.description && ev.description.toLowerCase().includes(query)) ||
        (ev.venue && ev.venue.toLowerCase().includes(query)) ||
        (ev.city && ev.city.toLowerCase().includes(query));
      return matchCat && matchCity && matchQuery;
    });
  }, [events, homeQuery, homeCategory, homeCity]);

  useEffect(() => {
    document.title = 'Vybetix — Be there.';

    const onScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });

    try {
      const stored = localStorage.getItem('vybetix_saved_events');
      if (stored) setSavedEvents(JSON.parse(stored));
    } catch (_) {}

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 3200);
  };

  const toggleSave = (id: string) => {
    const next = !savedEvents[id];
    const updated = { ...savedEvents, [id]: next };
    setSavedEvents(updated);
    try {
      localStorage.setItem('vybetix_saved_events', JSON.stringify(updated));
    } catch (_) {}
    showToast(next ? 'Saved to your vybes ♥' : 'Removed from your saved vybes.');
  };

  const getMinPrice = (ev: EventDetail): number => {
    const tiers = ev.ticket_tiers || ev.tiers || [];
    if (!tiers || tiers.length === 0) return 0;
    return Math.min(...tiers.map(t => Number(t.price) || 0));
  };

  const getEventBackground = (ev: EventDetail, index: number): string => {
    if (ev.cover_image_url) {
      return `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%), url(${ev.cover_image_url})`;
    }
    const cycle = index % 3;
    if (cycle === 0) return 'linear-gradient(135deg, #ff5a24 0%, #b8340a 100%)';
    if (cycle === 1) return 'linear-gradient(135deg, #f7a6c5 0%, #9e4e6f 100%)';
    return 'linear-gradient(135deg, #d7e5a3 0%, #687046 100%)';
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* 0. Live Announcement Bar */}
      <div className="demo">
        Verified live ticketing · Scannable passes sent to your email · Instant entry
      </div>

      {/* 1. Header Navigation */}
      <header className={`site-nav ${isScrolled ? 'nav-scrolled' : ''}`} id="site-nav">
        <div className="nav-shell">
          <Link href="/" className="logo nav-brand" aria-label="Vybetix home">
            vybetix<i aria-hidden="true"></i>
            <span className="brand-caption">YOUR NEXT GREAT NIGHT</span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            <a
              href="#discover"
              onClick={(e) => { e.preventDefault(); scrollTo('discover'); }}
              data-nav="discover"
            >
              <span className="nav-index">01</span> Discover events
            </a>
            <a
              href="#about"
              onClick={(e) => { e.preventDefault(); scrollTo('about'); }}
              data-nav="about"
            >
              <span className="nav-index">02</span> The experience
            </a>
            <Link
              href={isAuthenticated && user?.role === 'organizer' ? '/dashboard' : '/register?role=organizer'}
              data-nav="host"
            >
              <span className="nav-index">03</span> For organizers
            </Link>
          </nav>

          <div className="nav-actions">
            {isAuthenticated ? (
              <Link
                className="nav-signin"
                href={user?.role === 'organizer' ? '/dashboard' : '/tickets'}
              >
                {user?.role === 'organizer' ? 'Dashboard' : 'My Passes'}
              </Link>
            ) : (
              <Link className="nav-signin" href="/login">
                Sign in
              </Link>
            )}
            <Link
              className="nav-host"
              href={isAuthenticated && user?.role === 'organizer' ? '/events/create' : '/register?role=organizer'}
            >
              Create an event <span aria-hidden="true">↗</span>
            </Link>
            <button
              className="menu-toggle"
              id="menu-toggle"
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              aria-controls="mobile-nav"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="menu-lines" aria-hidden="true">
                <i></i><i></i>
              </span>
              <span>MENU</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <dialog id="mobile-nav" className="mobile-nav" open aria-labelledby="mobile-nav-title">
          <div className="mobile-nav-top">
            <span id="mobile-nav-title">VYBETIX / LIVE TICKETING</span>
            <button id="close-nav" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)}>×</button>
          </div>
          <p className="mobile-menu-caption">
            GO SOMEWHERE.<br />FEEL SOMETHING.
          </p>
          <nav aria-label="Mobile navigation">
            <a
              href="#discover"
              onClick={(e) => { e.preventDefault(); setMobileNavOpen(false); scrollTo('discover'); }}
              data-nav="discover"
            >
              <small>01 / FIND YOUR PEOPLE</small>
              <span>Discover events <b>↗</b></span>
            </a>
            <a
              href="#about"
              onClick={(e) => { e.preventDefault(); setMobileNavOpen(false); scrollTo('about'); }}
              data-nav="about"
            >
              <small>02 / THE FEELING</small>
              <span>The experience <b>↗</b></span>
            </a>
            <Link
              href={isAuthenticated && user?.role === 'organizer' ? '/dashboard' : '/register?role=organizer'}
              data-nav="host"
              onClick={() => setMobileNavOpen(false)}
            >
              <small>03 / MAKE IT HAPPEN</small>
              <span>For organizers <b>↗</b></span>
            </Link>
          </nav>
          <div className="mobile-account-links">
            {isAuthenticated ? (
              <Link href={user?.role === 'organizer' ? '/dashboard' : '/tickets'} onClick={() => setMobileNavOpen(false)}>
                {user?.role === 'organizer' ? 'Dashboard ↗' : 'My Passes ↗'}
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileNavOpen(false)}>Sign in ↗</Link>
                <Link href="/register" onClick={() => setMobileNavOpen(false)}>Create account ↗</Link>
              </>
            )}
          </div>
          <Link
            className="btn mobile-create"
            href={isAuthenticated && user?.role === 'organizer' ? '/events/create' : '/register?role=organizer'}
            onClick={() => setMobileNavOpen(false)}
          >
            Create an event <span className="arrow">↗</span>
          </Link>
          <div className="mobile-menu-foot">
            <span>STARRING YOU.<br />DIRECTED BY THE NIGHT.</span>
            <span className="mobile-star" aria-hidden="true"></span>
          </div>
        </dialog>
      )}

      {/* =========================================================================
          HOMEPAGE
          ========================================================================= */}
      <div id="homepage">
        <div className="wrap">
          <main>
            {/* 1. Hero Section */}
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="dot"></span> VYBETIX PRESENTS / YOUR NEXT GREAT NIGHT
                </div>
                <h1 className="newheadline">
                  <span className="headline-top">DON'T JUST</span>
                  <span className="vybe-line">FEEL THE <i aria-hidden="true"></i></span>
                  <span className="outline-vybe">VYBE.</span>
                  <span className="live-tag">GO LIVE IT. ↗</span>
                </h1>
                <p>
                  Front-row moments. Dance-floor friendships.<br />
                  Find the events you'll still be talking about on Monday.
                </p>
                <div className="heroactions">
                  <a
                    className="btn"
                    href="#discover"
                    onClick={(e) => { e.preventDefault(); scrollTo('discover'); }}
                  >
                    Find your next vybe <span className="arrow">↗</span>
                  </a>
                  <Link
                    className="textlink"
                    href={isAuthenticated && user?.role === 'organizer' ? '/events/create' : '/register?role=organizer'}
                  >
                    Make something happen ↗
                  </Link>
                </div>
                <div className="herotiny">
                  <span className="tinyart"></span> For the nights that never leave you.
                </div>
              </div>

              {/* 3D Real Ticket Stack */}
              <div className="heroart" aria-label="Official live pass preview">
                <div className="orbit-label" aria-hidden="true">YOUR NEXT STORY STARTS OUTSIDE ↗</div>
                <div className="halo"></div>
                <div className="mini-pass" aria-hidden="true">
                  <span>ALL ACCESS / VERIFIED</span>
                  <strong>OUTSIDE<br />IS A PLACE.</strong>
                  <div className="barcode"></div>
                </div>
                <div className="backticket">
                  LESS SCROLLING.<br />MORE LIVING.
                </div>
                <div className="ticket">
                  <div className="tickethead">
                    <span>vybetix </span><span>ADMIT ONE / VERIFIED PASS</span>
                  </div>
                  <div
                    className="poster"
                    style={{
                      backgroundImage: featuredEvent?.cover_image_url
                        ? `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%), url(${featuredEvent.cover_image_url})`
                        : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="flower"></div>
                    <div className="posterword">
                      {featuredEvent ? (
                        <>
                          {featuredEvent.title.toUpperCase().slice(0, 24)}
                          <small>{featuredEvent.city.toUpperCase()} · VERIFIED PASS</small>
                        </>
                      ) : (
                        <>
                          VYBETIX<br />LIVE PASS
                          <small>OFFICIAL GATE PASSES</small>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ticketname">
                    {featuredEvent ? featuredEvent.title : 'LIVE EVENTS IN NIGERIA'}
                  </div>
                  <div className="ticketdata">
                    <span>
                      {featuredEvent ? (
                        <>
                          {formatDate(featuredEvent.event_date, 'EEE, d MMM yyyy').toUpperCase()}<br />
                          <strong>{formatTime(featuredEvent.event_date)}</strong>
                        </>
                      ) : (
                        <>
                          OFFICIAL PASS<br />
                          <strong>SCANNABLE GATE ACCESS</strong>
                        </>
                      )}
                    </span>
                    <span>
                      {featuredEvent ? (
                        <>
                          {featuredEvent.city.toUpperCase()}, NIGERIA<br />
                          <strong>{featuredEvent.venue.toUpperCase()}</strong>
                        </>
                      ) : (
                        <>
                          VYBETIX VERIFIED<br />
                          <strong>INSTANT DELIVERY</strong>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="tear">
                    <div className="barcode"></div>
                    <span>
                      VYB / {featuredEvent ? featuredEvent.id.slice(0, 6).toUpperCase() : 'LIVE'} / PASS
                    </span>
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
                <a
                  href="#discover"
                  onClick={(e) => { e.preventDefault(); scrollTo('discover'); }}
                >
                  SCROLL TO FIND YOUR PEOPLE <b>↓</b>
                </a>
              </div>
            </section>
          </main>
        </div>

        {/* Marquee Ticker */}
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

        {/* 2. Discover / Real Events Section */}
        <section className="discover" id="discover">
          <div className="wrap">
            <div className="sectionhead">
              <div>
                <div className="kicker">ACT 01 / THE LINEUP</div>
                <h2>COMING SOON.<br />TO YOUR LIFE.</h2>
              </div>
              <p>A big night out or a new obsession.<br />There's a vybe with your name on it.</p>
            </div>

            <form
              className="searchbar"
              id="searchform"
              onSubmit={(e) => {
                e.preventDefault();
                scrollTo('events');
              }}
            >
              <input
                id="search"
                type="search"
                placeholder="Search events, venues, artists…"
                aria-label="Search events"
                value={homeQuery}
                onChange={(e) => setHomeQuery(e.target.value)}
              />
              <select
                id="home-category"
                aria-label="Event category"
                value={homeCategory}
                onChange={(e) => setHomeCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.name}</option>
                ))}
              </select>
              <select
                id="city"
                aria-label="Choose city"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
              >
                {CITIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button className="btn" type="submit">Find events ↗</button>
            </form>

            {isLoading ? (
              <div className="empty" style={{ padding: '60px 0' }}>
                <p style={{ fontSize: 13, color: '#a7a89e', letterSpacing: 1 }}>LOADING VERIFIED EVENTS FROM DATABASE...</p>
              </div>
            ) : homeFilteredEvents.length > 0 ? (
              <div className="events" id="events">
                {homeFilteredEvents.map((ev, i) => {
                  const visualClass = i % 3 === 0 ? 'one' : i % 3 === 1 ? 'two' : 'three';
                  const minPrice = getMinPrice(ev);
                  const isSaved = savedEvents[ev.id];

                  return (
                    <article
                      key={ev.id}
                      className="event"
                      data-category={ev.category}
                      data-city={ev.city}
                      data-name={ev.title}
                      data-price={minPrice > 0 ? formatNaira(minPrice) : 'Free'}
                      data-date={formatDate(ev.event_date)}
                    >
                      <div
                        className={`eventvisual ${visualClass} ${ev.cover_image_url ? 'cinema-photo' : ''}`}
                        style={{
                          backgroundImage: ev.cover_image_url
                            ? `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%), url(${ev.cover_image_url})`
                            : getEventBackground(ev, i)
                        }}
                      >
                        <span className="eventlabel">
                          {(ev.category || 'LIVE').toUpperCase()} / VERIFIED
                        </span>
                        <button
                          type="button"
                          className="save"
                          aria-label={`Save ${ev.title}`}
                          aria-pressed={isSaved ? 'true' : 'false'}
                          onClick={() => toggleSave(ev.id)}
                        >
                          {isSaved ? '♥' : '♡'}
                        </button>

                        <div className="arttitle">
                          {ev.title.toUpperCase().slice(0, 20)}
                          <small>{ev.city.toUpperCase()} · LIVE EVENT</small>
                        </div>
                      </div>

                      <div className="eventbody">
                        <div className="meta">
                          {formatDate(ev.event_date, 'EEE, d MMM').toUpperCase()} · {formatTime(ev.event_date)}
                        </div>
                        <h3>{ev.title}</h3>
                        <p className="location">{ev.city} · {ev.venue}</p>
                        <div className="eventfoot">
                          <strong>
                            <small>FROM</small>
                            {minPrice > 0 ? formatNaira(minPrice) : 'Free'}
                          </strong>
                          <button
                            type="button"
                            className="view"
                            aria-label={`Get tickets for ${ev.title}`}
                            onClick={() => setCheckoutEvent(ev)}
                          >
                            ↗
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div id="empty" className="empty">
                <h3>No published events match your search criteria.</h3>
                <p style={{ fontSize: 13, color: '#88745c', marginTop: 8 }}>
                  Try adjusting your city or category, or create your own event!
                </p>
                <Link
                  href="/register?role=organizer"
                  className="btn"
                  style={{ marginTop: 20, display: 'inline-flex' }}
                >
                  Host an event now ↗
                </Link>
              </div>
            )}

            <p className="resultnote" id="resultnote" aria-live="polite">
              {homeFilteredEvents.length} live event{homeFilteredEvents.length === 1 ? '' : 's'} available in lineup.
            </p>
          </div>
        </section>

        {/* 3. Cinema Interlude */}
        <section className="cinema-interlude" aria-label="The Vybetix experience">
          <div className="film-edge" aria-hidden="true"></div>
          <div className="wrap scene">
            <div className="scene-meta">
              <span>VYBETIX ORIGINAL MOMENTS</span>
              <span>VOL. 01 / FULL VOLUME</span>
            </div>
            <div className="scene-title">
              <span>THIS ISN'T</span>
              <em>A WATCH-LATER</em>
              <span>KIND OF LIFE.</span>
            </div>
            <div className="scene-bottom">
              <p>Some moments only happen once.<br />Be in the room when they do.</p>
              <a
                href="#discover"
                onClick={(e) => { e.preventDefault(); scrollTo('discover'); }}
                className="round-cta"
                aria-label="Explore events"
              >
                ↗
              </a>
            </div>
          </div>
          <div className="film-edge" aria-hidden="true"></div>
        </section>

        {/* 4. Manifesto & Host Sections */}
        <div className="wrap">
          <section className="manifesto" id="about">
            <div className="eyebrow"><span className="dot"></span> ACT 02 / THE FEELING</div>
            <p>
              Your camera roll deserves better than screenshots of plans. <span>Go to the gig. Meet your people. Stay for one more song.</span>
            </p>
          </section>

          <section className="host" id="host">
            <div className="hostcopy">
              <div className="kicker">ACT 03 / BEHIND THE SCENES</div>
              <h2>YOU BRING THE VYBE.<br />WE'LL HOLD THE DOOR.</h2>
              <p>
                Planning a concert, campus rave, or club night? Issue tamper-proof HMAC gate passes with automatic Paystack payouts on Vybetix.
              </p>
              <Link
                className="btn"
                href={isAuthenticated && user?.role === 'organizer' ? '/events/create' : '/register?role=organizer'}
              >
                Let's host something <span className="arrow">↗</span>
              </Link>
            </div>
            <div className="hostgraphic" aria-hidden="true">
              <div className="hoststamp">
                <small>VYBETIX / ORGANIZERS CLUB</small>
                YOUR EVENT.<br />YOUR CROWD.<br /><em>YOUR RULES.</em>
                <div className="barcode"></div>
              </div>
            </div>
          </section>

          <footer>
            <div className="closing-credit">
              <span>DON'T WAIT FOR THE RECAP.</span>
              <a href="#discover" onClick={(e) => { e.preventDefault(); scrollTo('discover'); }}>BE THE STORY. ↗</a>
            </div>
            <div className="footrow">
              <Link className="logo" href="/">
                vybetix<i></i>
              </Link>
              <p>Log off. Show up.<br />Take the memory home.</p>
              <a className="textlink" href="#discover" onClick={(e) => { e.preventDefault(); scrollTo('discover'); }}>
                Find a vybe ↗
              </a>
            </div>
            <div className="footerbottom">
              <span>© 2026 Vybetix. Live Ticketing Platform in Nigeria.</span>
              <span>HMAC-Sealed Fraud-Proof Gate Passes · Instant Email &amp; WhatsApp Delivery</span>
            </div>
          </footer>
        </div>
      </div>

      {/* =========================================================================
          PAYSTACK CHECKOUT MODAL
          ========================================================================= */}
      {checkoutEvent && (
        <CheckoutModal
          isOpen={Boolean(checkoutEvent)}
          onClose={() => setCheckoutEvent(null)}
          event={checkoutEvent}
        />
      )}

      {toastText && (
        <div className="toast" id="toast" role="status">
          {toastText}
        </div>
      )}
    </>
  );
}
