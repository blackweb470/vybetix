-- ------------------------------------------------------------------------
-- Migration: Create Events Table, Enums, and Performance Indexes
-- File: apps/api/supabase/migrations/20250004_create_events.sql
-- ------------------------------------------------------------------------

-- 1. Create custom enum types for events
CREATE TYPE public.event_category AS ENUM (
    'music', 'campus', 'tech', 'comedy', 'church', 'sports', 'food', 'other'
);

CREATE TYPE public.event_city AS ENUM (
    'lagos', 'abuja', 'ibadan', 'port_harcourt', 'enugu', 'kano', 'other'
);

CREATE TYPE public.event_status AS ENUM (
    'draft', 'published', 'cancelled', 'completed'
);

-- 2. Create the events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image_url TEXT NOT NULL,
    category public.event_category NOT NULL,
    city public.event_city NOT NULL,
    venue TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status public.event_status NOT NULL DEFAULT 'draft',
    is_university_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Date constraint validation
    CONSTRAINT check_end_after_start CHECK (end_date >= event_date)
);

-- 3. Create high-performance indexes for scanning and sorting
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_city ON public.events(city);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_event_date ON public.events(event_date);

-- 4. Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 5. Configure RLS Policies
-- Policy A: Anyone can read published events
CREATE POLICY "Anyone can read published events" 
ON public.events 
FOR SELECT 
USING (status = 'published');

-- Policy B: Organizers can read all of their own events (drafts, cancelled, etc.)
CREATE POLICY "Organizers can read their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = organizer_id);

-- Policy C: Organizers can insert/create their own events
CREATE POLICY "Organizers can create their own events" 
ON public.events 
FOR INSERT 
WITH CHECK (
    auth.uid() = organizer_id 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'organizer'
    )
);

-- Policy D: Organizers can update their own events
CREATE POLICY "Organizers can update their own events" 
ON public.events 
FOR UPDATE 
USING (auth.uid() = organizer_id)
WITH CHECK (auth.uid() = organizer_id);

-- Policy E: Organizers can delete their own events (typically drafts, but standard check)
CREATE POLICY "Organizers can delete their own events" 
ON public.events 
FOR DELETE 
USING (auth.uid() = organizer_id);

-- Policy F: Admins can do all actions (CRUD) on all events
CREATE POLICY "Admins can manage all events" 
ON public.events 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
