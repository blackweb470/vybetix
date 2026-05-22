-- ------------------------------------------------------------------------
-- Migration: Create Payouts Table, Enum, and RLS
-- File: apps/api/supabase/migrations/20250008_create_payouts.sql
-- ------------------------------------------------------------------------

-- 1. Create Payout status enum
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid');

-- 2. Create the payouts table
CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- in Kobo
    status public.payout_status NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ,
    -- Constraints
    CONSTRAINT check_amount_positive CHECK (amount >= 0),
    CONSTRAINT check_paid_date CHECK (paid_at IS NULL OR paid_at >= requested_at)
);

-- 3. Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- 4. Configure RLS Policies
-- Policy A: Organizers can read their own payouts
CREATE POLICY "Organizers can read their own payouts" 
ON public.payouts 
FOR SELECT 
USING (auth.uid() = organizer_id);

-- Policy B: Organizers can request payouts
CREATE POLICY "Organizers can request payouts" 
ON public.payouts 
FOR INSERT 
WITH CHECK (
    auth.uid() = organizer_id 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'organizer'
    )
);

-- Policy C: Admins can do all actions (CRUD) on payouts
CREATE POLICY "Admins can manage payouts" 
ON public.payouts 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
