-- ------------------------------------------------------------------------
-- Migration: Create Tickets Table, Enum, and Performance Indexes
-- File: apps/api/supabase/migrations/20250007_create_tickets.sql
-- ------------------------------------------------------------------------

-- 1. Create Ticket status enum
CREATE TYPE public.ticket_status AS ENUM ('active', 'used', 'cancelled');

-- 2. Create the tickets table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES public.ticket_tiers(id) ON DELETE CASCADE,
    holder_name TEXT NOT NULL,
    holder_email TEXT NOT NULL,
    holder_phone TEXT NOT NULL,
    qr_token TEXT NOT NULL UNIQUE,
    status public.ticket_status NOT NULL DEFAULT 'active',
    device_fingerprint TEXT,
    device_locked BOOLEAN NOT NULL DEFAULT false,
    scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create high-performance indexes
CREATE INDEX idx_tickets_qr_token ON public.tickets(qr_token);
CREATE INDEX idx_tickets_order_id ON public.tickets(order_id);
CREATE INDEX idx_tickets_tier_id ON public.tickets(tier_id);

-- 4. Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 5. Configure RLS Policies
-- Policy A: Buyers can read their own tickets
CREATE POLICY "Buyers can read their own tickets" 
ON public.tickets 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = order_id AND buyer_id = auth.uid()
    )
);

-- Policy B: Organizers can read tickets for their events
CREATE POLICY "Organizers can read event tickets" 
ON public.tickets 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.ticket_tiers 
        JOIN public.events ON events.id = ticket_tiers.event_id 
        WHERE ticket_tiers.id = tier_id AND events.organizer_id = auth.uid()
    )
);

-- Policy C: Organizers can update tickets for their events (e.g. scan / invalidate)
CREATE POLICY "Organizers can scan event tickets" 
ON public.tickets 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.ticket_tiers 
        JOIN public.events ON events.id = ticket_tiers.event_id 
        WHERE ticket_tiers.id = tier_id AND events.organizer_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.ticket_tiers 
        JOIN public.events ON events.id = ticket_tiers.event_id 
        WHERE ticket_tiers.id = tier_id AND events.organizer_id = auth.uid()
    )
);

-- Policy D: Admins and Gate Staff can read and update all tickets
CREATE POLICY "Admins can manage all tickets" 
ON public.tickets 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
