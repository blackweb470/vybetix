-- ------------------------------------------------------------------------
-- Migration: Create Ticket Tiers Table
-- File: apps/api/supabase/migrations/20250005_create_ticket_tiers.sql
-- ------------------------------------------------------------------------

-- 1. Create the ticket_tiers table
CREATE TABLE public.ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- in Kobo (e.g. 5000 Naira = 500000 Kobo)
    quantity INTEGER NOT NULL, -- total available
    sold INTEGER NOT NULL DEFAULT 0,
    max_per_order INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    CONSTRAINT check_price_positive CHECK (price >= 0),
    CONSTRAINT check_quantity_positive CHECK (quantity >= 0),
    CONSTRAINT check_sold_less_than_total CHECK (sold <= quantity)
);

-- 2. Enable RLS
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;

-- 3. Configure RLS Policies
-- Policy A: Anyone can read ticket tiers
CREATE POLICY "Anyone can read ticket tiers" 
ON public.ticket_tiers 
FOR SELECT 
USING (true);

-- Policy B: Organizers can manage tiers for their own events
CREATE POLICY "Organizers can manage tiers for their own events" 
ON public.ticket_tiers 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE id = event_id AND organizer_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE id = event_id AND organizer_id = auth.uid()
    )
);

-- Policy C: Admins can do all actions (CRUD) on all ticket tiers
CREATE POLICY "Admins can manage all ticket tiers" 
ON public.ticket_tiers 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
