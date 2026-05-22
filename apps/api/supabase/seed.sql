-- ------------------------------------------------------------------------
-- Database Seed File for VibeTix Event Ticketing
-- File: apps/api/supabase/seed.sql
-- ------------------------------------------------------------------------

-- 1. Seed Universities
INSERT INTO public.universities (id, name, short_code, email_domain, city, active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'University of Lagos', 'UNILAG', 'unilag.edu.ng', 'Lagos', true),
    ('22222222-2222-2222-2222-222222222222', 'University of Ibadan', 'UI', 'ui.edu.ng', 'Ibadan', true),
    ('33333333-3333-3333-3333-333333333333', 'Obafemi Awolowo University', 'OAU', 'oauife.edu.ng', 'Ile-Ife', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Organizer Auth Row (Supabase auth.users)
-- We insert a stable UUID so we can reference it.
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, 
    raw_user_meta_data, raw_app_meta_data, aud, role
)
VALUES (
    '77777777-7777-7777-7777-777777777777', 
    'organizer@vibetix.ng', 
    '$2a$12$R9h/lIPzMRFh41TfeN3t.O1S37W4F7C77b7H9D/gYg2gQ2D98D552', -- pre-hashed 'password123'
    now(), 
    '{"full_name": "Tunde Bakare", "phone": "+2348012345678"}', 
    '{"provider": "email", "providers": ["email"]}', 
    'authenticated', 
    'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Elevate Sync User to Organizer
UPDATE public.users 
SET role = 'organizer', phone = '+2348012345678'
WHERE id = '77777777-7777-7777-7777-777777777777';

-- 4. Seed Organizer Profile
INSERT INTO public.organizer_profiles (id, user_id, business_name, bank_name, account_number, account_name, verified)
VALUES (
    '99999999-9999-9999-9999-999999999999', 
    '77777777-7777-7777-7777-777777777777', 
    'Bakare Event Ventures', 
    'Access Bank PLC', 
    '0123456789', 
    'Tunde Bakare Events', 
    true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed 5 Published Events (Mix of campus and non-campus in Lagos, Abuja, Ibadan)

-- Event 1: Campus, UNILAG, Music
INSERT INTO public.events (
    id, organizer_id, university_id, title, description, cover_image_url, 
    category, city, venue, event_date, end_date, status, is_university_only, created_at
)
VALUES (
    'e1111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    'UNILAG Cyber-Rave 2026',
    'Get ready for the ultimate campus rave featuring premier Nigerian DJs, vibrant sound systems, and laser shows. Strictly for university community members.',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
    'campus',
    'lagos',
    'UNILAG Main Auditorium',
    now() + interval '30 days',
    now() + interval '30 days 6 hours',
    'published',
    true,
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Event 2: Non-campus, Lagos, Music
INSERT INTO public.events (
    id, organizer_id, university_id, title, description, cover_image_url, 
    category, city, venue, event_date, end_date, status, is_university_only, created_at
)
VALUES (
    'e2222222-2222-2222-2222-222222222222',
    '77777777-7777-7777-7777-777777777777',
    null,
    'Lagos Afro-Glow Festival',
    'An outstanding outdoor music and cultural experience celebrating the best of Afrobeat, art, and food under the starry skies of Lagos.',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop',
    'music',
    'lagos',
    'Eko Hotel Convention Centre Grounds',
    now() + interval '45 days',
    now() + interval '46 days',
    'published',
    false,
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Event 3: Campus, UI, Tech
INSERT INTO public.events (
    id, organizer_id, university_id, title, description, cover_image_url, 
    category, city, venue, event_date, end_date, status, is_university_only, created_at
)
VALUES (
    'e3333333-3333-3333-3333-333333333333',
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    'UI Tech Innovation Summit',
    'Immerse yourself in interactive coding panels, startup pitch contests, and workshops led by elite software engineers from Silicon Valley and Lagos.',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop',
    'tech',
    'ibadan',
    'Trenchard Hall, UI',
    now() + interval '15 days',
    now() + interval '15 days 8 hours',
    'published',
    false,
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Event 4: Campus, OAU, Comedy
INSERT INTO public.events (
    id, organizer_id, university_id, title, description, cover_image_url, 
    category, city, venue, event_date, end_date, status, is_university_only, created_at
)
VALUES (
    'e4444444-4444-4444-4444-444444444444',
    '77777777-7777-7777-7777-777777777777',
    '33333333-3333-3333-3333-333333333333',
    'OAU Night of a Thousand Laughs',
    'Prepare for an unforgettable night of side-splitting comedy featuring top student comics and industry legends live at Obafemi Awolowo University.',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop',
    'comedy',
    'ibadan', -- closest city enum for Ile-Ife
    'Oduduwa Hall, OAU',
    now() + interval '20 days',
    now() + interval '20 days 4 hours',
    'published',
    false,
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Event 5: Non-campus, Abuja, Food
INSERT INTO public.events (
    id, organizer_id, university_id, title, description, cover_image_url, 
    category, city, venue, event_date, end_date, status, is_university_only, created_at
)
VALUES (
    'e5555555-5555-5555-5555-555555555555',
    '77777777-7777-7777-7777-777777777777',
    null,
    'Abuja Food and Suya Fest',
    'Indulge in premium culinary delights, locally sourced spices, and the legendary smoke of Abuja master Suya chefs. Live music, outdoor games, and good vibes.',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
    'food',
    'abuja',
    'Riverplate Park, Wuse II',
    now() + interval '60 days',
    now() + interval '60 days 12 hours',
    'published',
    false,
    now()
)
ON CONFLICT (id) DO NOTHING;


-- 6. Seed Ticket Tiers for Each Event (Prices in Kobo)

-- Event 1 Tiers: UNILAG Cyber-Rave
INSERT INTO public.ticket_tiers (id, event_id, name, description, price, quantity, sold, max_per_order)
VALUES
    ('t1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Student Regular', 'Standard student admission ticket. Valid student ID required.', 150000, 500, 0, 5), -- 1,500 Naira
    ('t1222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Student VIP', 'Front row access, premium drink tokens, and free glowsticks.', 500000, 100, 0, 3) -- 5,000 Naira
ON CONFLICT (id) DO NOTHING;

-- Event 2 Tiers: Lagos Afro-Glow Festival
INSERT INTO public.ticket_tiers (id, event_id, name, description, price, quantity, sold, max_per_order)
VALUES
    ('t2111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'Standard Admission', 'General festival access card.', 1500000, 2000, 0, 5), -- 15,000 Naira
    ('t2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'VIP Admission', 'Fast-track entry, VIP lounge, and private bars.', 4000000, 300, 0, 4), -- 40,000 Naira
    ('t2333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'VVIP Table of 6', 'Exclusive cabana, custom catering, premium spirits bottles.', 200000000, 20, 0, 1) -- 2,000,000 Naira (200,000,000 kobo)
ON CONFLICT (id) DO NOTHING;

-- Event 3 Tiers: UI Tech Summit
INSERT INTO public.ticket_tiers (id, event_id, name, description, price, quantity, sold, max_per_order)
VALUES
    ('t3111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 'Delegate Pass', 'Access to Trenchard Hall pitches and workshops.', 200000, 300, 0, 5), -- 2,000 Naira
    ('t3222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 'Professional Pass', 'Includes access to networking buffet dinner and slide handouts.', 1000000, 50, 0, 2) -- 10,000 Naira
ON CONFLICT (id) DO NOTHING;

-- Event 4 Tiers: OAU Comedy Night
INSERT INTO public.ticket_tiers (id, event_id, name, description, price, quantity, sold, max_per_order)
VALUES
    ('t4111111-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444', 'Student Regular', 'Regular auditorium seating.', 100000, 800, 0, 5), -- 1,000 Naira
    ('t4222222-2222-2222-2222-222222222222', 'e4444444-4444-4444-4444-444444444444', 'Student VIP', 'First 3 rows VIP stage seating.', 300000, 150, 0, 5) -- 3,000 Naira
ON CONFLICT (id) DO NOTHING;

-- Event 5 Tiers: Abuja Food and Suya Fest
INSERT INTO public.ticket_tiers (id, event_id, name, description, price, quantity, sold, max_per_order)
VALUES
    ('t5111111-1111-1111-1111-111111111111', 'e5555555-5555-5555-5555-555555555555', 'General Admission', 'Festival access card.', 300000, 1500, 0, 5), -- 3,000 Naira
    ('t5222222-2222-2222-2222-222222222222', 'e5555555-5555-5555-5555-555555555555', 'Foodie Pass', 'General admission plus 3 standard Suya platters and local drinks.', 850000, 400, 0, 5) -- 8,500 Naira
ON CONFLICT (id) DO NOTHING;
