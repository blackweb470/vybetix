'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useEvents } from '../../../hooks/useEvents';
import { formatNaira, formatDate } from '../../../lib/utils';
import { EventDetail } from '../../../types';

const EVENT_CATEGORIES = [
  { name: 'All Events', value: 'all', hint: 'Browse the full lineup' },
  { name: 'Music', value: 'music', hint: 'Concerts, live sets & nightlife' },
  { name: 'Campus', value: 'campus', hint: 'Student events & campus life' },
  { name: 'Tech', value: 'tech', hint: 'Conferences, demos & meetups' },
  { name: 'Comedy', value: 'comedy', hint: 'Stand-up & comedy nights' },
  { name: 'Church', value: 'church', hint: 'Faith & community gatherings' },
  { name: 'Sports', value: 'sports', hint: 'Matches, fitness & competition' },
  { name: 'Food', value: 'food', hint: 'Tastings, pop-ups & dining' },
  { name: 'Other', value: 'other', hint: 'Creative & other experiences' },
];

export default function EventsExplorePage() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [category, setCategory] = useState('all');
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);

  // Fetch real events from the backend database
  const { data: realEvents = [], isLoading, error } = useEvents({
    search: query || undefined,
    city: city === 'all' ? undefined : city,
    category: category === 'all' ? undefined : category,
    limit: 50,
  });

  const selectedCategoryObj =
    EVENT_CATEGORIES.find((c) => c.value.toLowerCase() === category.toLowerCase()) || EVENT_CATEGORIES[0];

  const resetFilters = () => {
    setQuery('');
    setCity('all');
    setCategory('all');
    setIsCategoryPopupOpen(false);
  };

  // Helper to extract lowest ticket tier price in kobo
  const getMinPrice = (e: EventDetail) => {
    const tiers = e.ticket_tiers || e.tiers || [];
    if (tiers.length === 0) return 0;
    return Math.min(...tiers.map((t) => t.price));
  };

  const featuredPick = realEvents.length > 0 ? realEvents[0] : null;
  const filteredTrending = realEvents.slice(0, 3);
  const filteredTours = realEvents.slice(3);
  const matchCount = realEvents.length;

  return (
    <div className="min-h-screen bg-[#10100f] text-[#f1ede4] font-['DM_Sans',sans-serif] selection:bg-[#ff5a24] selection:text-[#10100f]">
      <div className="wrap explore-page">
        {/* Flow Header */}
        <div className="flowheader flow-context">
          <span>VYBETIX / THE NEXT SCENE</span>
          <Link href="/" className="flowback">
            ← Back to Vybetix home
          </Link>
        </div>

        {/* Discovery Intro Section with Feature Pick */}
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

          {featuredPick ? (
            <Link
              className="explore-feature"
              href={`/events/${featuredPick.id}`}
              style={{
                backgroundImage: `url(${featuredPick.cover_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200'})`,
              }}
            >
              <span className="feature-label">THE EDITOR’S PICK / FEATURED EVENT</span>
              <span className="feature-bottom">
                <strong>{featuredPick.title.toUpperCase()}</strong>
                <span>
                  {(featuredPick.city || 'LAGOS').toUpperCase()} / {formatDate(featuredPick.event_date)}
                  <br />
                  <b>VIEW THE EVENT ↗</b>
                </span>
              </span>
            </Link>
          ) : (
            <div
              className="explore-feature"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200)`,
              }}
            >
              <span className="feature-label">THE DISCOVERY EDIT</span>
              <span className="feature-bottom">
                <strong>LIVE SCENE</strong>
                <span>
                  EXPLORE NIGERIAN CAMPUSES & CITIES<br />
                  <b>DISCOVER EVENTS ↗</b>
                </span>
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
              placeholder="Search events, venues…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <label>
            <span>CITY</span>
            <select
              id="explore-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="all">All Cities</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Ibadan">Ibadan</option>
              <option value="Port Harcourt">Port Harcourt</option>
              <option value="Benin City">Benin City</option>
              <option value="Enugu">Enugu</option>
            </select>
          </label>

          {/* Category Dropdown */}
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
                  <span>ALL EXPERIENCES</span>
                </div>
                <div className="category-options-grid" role="presentation">
                  {EVENT_CATEGORIES.map((cat) => {
                    const count =
                      cat.value === 'all'
                        ? realEvents.length
                        : realEvents.filter(
                            (e) => (e.category || '').toLowerCase() === cat.value.toLowerCase()
                          ).length;
                    const isSelected = category.toLowerCase() === cat.value.toLowerCase();
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        role="option"
                        className="category-option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setCategory(cat.value);
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
            {(category === 'all' ? 'ALL EVENTS' : selectedCategoryObj.name.toUpperCase()) +
              ' / ' +
              (city === 'all' ? 'ALL CITIES' : city.toUpperCase())}
          </span>
          <button type="button" id="clear-explore" onClick={resetFilters}>
            Reset filters ↺
          </button>
        </div>

        <p className="explore-result" aria-live="polite">
          {isLoading
            ? 'Fetching live events from database…'
            : `${matchCount} live event${matchCount === 1 ? ' matches' : 's match'} your filters.`}
        </p>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="py-12 text-center text-sm tracking-wider uppercase opacity-60">
            Loading real events from the database…
          </div>
        )}

        {/* Empty State */}
        {!isLoading && realEvents.length === 0 && (
          <div className="py-16 text-center border border-[#262624] rounded-lg p-8 my-8">
            <h3 className="text-xl font-bold mb-2">No live events found</h3>
            <p className="text-sm opacity-70 mb-6">
              There are currently no published events matching your search or filters.
            </p>
            <button className="btn" onClick={resetFilters}>
              Reset all filters ↺
            </button>
          </div>
        )}

        {/* Section 01: Trending Events */}
        {filteredTrending.length > 0 && (
          <section className="explore-section" id="trending-events">
            <div className="explore-sectionhead">
              <div>
                <div className="floweyebrow">01 / IN THE MIX</div>
                <h2>Trending events<span>.</span></h2>
              </div>
              <span className="section-caption">
                A CURATED LINEUP<br />HOTTEST EVENTS IN TOWN
              </span>
            </div>

            <div className="explore-grid">
              {filteredTrending.map((e) => {
                const minPrice = getMinPrice(e);
                return (
                  <article key={e.id} className="explore-event">
                    <Link
                      className="explore-poster"
                      href={`/events/${e.id}`}
                      style={{
                        backgroundImage: `url(${e.cover_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200'})`,
                      }}
                    >
                      <span className="poster-badge">{(e.category || 'EVENT').toUpperCase()}</span>
                      <span className="explore-poster-title">{e.title}</span>
                      <span className="poster-foot">
                        VYBETIX / LIVE PASS <b>↗</b>
                      </span>
                    </Link>
                    <div className="explore-event-info">
                      <span className="explore-date">{formatDate(e.event_date)}</span>
                      <h3>
                        <Link href={`/events/${e.id}`}>{e.title}</Link>
                      </h3>
                      <div className="explore-price">
                        <span>{e.city || 'Nigeria'} · Venue confirmed</span>
                        <strong>{minPrice > 0 ? `From ${formatNaira(minPrice)}` : 'Free entry'}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 02: Spotlight Tour Selections */}
        {filteredTours.length > 0 && (
          <section className="explore-section" id="spotlight-tours">
            <div className="explore-sectionhead">
              <div>
                <div className="floweyebrow">02 / TAKE IT ON THE ROAD</div>
                <h2>Spotlight tour selections<span>.</span></h2>
              </div>
              <span className="section-caption">
                BIG-ROOM ENERGY.<br />ANOTHER CITY. ANOTHER STORY.
              </span>
            </div>

            <div className="explore-grid tour-grid">
              {filteredTours.map((e) => {
                const minPrice = getMinPrice(e);
                return (
                  <article key={e.id} className="explore-event tour-event">
                    <Link
                      className="explore-poster"
                      href={`/events/${e.id}`}
                      style={{
                        backgroundImage: `url(${e.cover_image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200'})`,
                      }}
                    >
                      <span className="poster-badge">{(e.category || 'SPOTLIGHT').toUpperCase()}</span>
                      <span className="explore-poster-title">{e.title}</span>
                      <span className="poster-foot">
                        VYBETIX / OFFICIAL EVENT <b>↗</b>
                      </span>
                    </Link>
                    <div className="explore-event-info">
                      <span className="explore-date">{formatDate(e.event_date)}</span>
                      <h3>
                        <Link href={`/events/${e.id}`}>{e.title}</Link>
                      </h3>
                      <div className="explore-price">
                        <span>{e.city || 'Nigeria'} · Stage confirmed</span>
                        <strong>{minPrice > 0 ? `From ${formatNaira(minPrice)}` : 'Free entry'}</strong>
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
              PICK A MOOD.<br />WE’LL FIND THE PLANS.
            </span>
          </div>

          <div className="vibes-grid">
            <button
              className="vibe-tile vibe-music"
              onClick={() => {
                setCategory('music');
                setCity('all');
                setQuery('');
              }}
            >
              <span>01 / MUSIC</span>
              <strong>LOUDER.<br />CLOSER.<br />LIVE.</strong>
              <span>Explore live music <b>↗</b></span>
            </button>

            <button
              className="vibe-tile vibe-night"
              onClick={() => {
                setCategory('campus');
                setCity('all');
                setQuery('');
              }}
            >
              <span>02 / CAMPUS</span>
              <strong>STUDENT<br />LIFE.</strong>
              <span>Explore campus festivals <b>↗</b></span>
            </button>

            <button
              className="vibe-tile vibe-art"
              onClick={() => {
                setCategory('tech');
                setCity('all');
                setQuery('');
              }}
            >
              <span>03 / TECH & DEMOS</span>
              <strong>BUILD.<br />NETWORK.<br />REPEAT.</strong>
              <span>Explore tech meetups <b>↗</b></span>
            </button>
          </div>
        </section>

        <div className="explore-end">
          <p>
            Not every good night starts with a plan.<br />
            But this is a pretty good place to find one.
          </p>
          <button className="explore-reset" onClick={resetFilters}>
            Show all events ↗
          </button>
        </div>

        <div className="flowfooter">
          <Link href="/">← Back to Vybetix home</Link>
          <span>VYBETIX / DISCOVER SOMETHING REAL.</span>
        </div>
      </div>
    </div>
  );
}
