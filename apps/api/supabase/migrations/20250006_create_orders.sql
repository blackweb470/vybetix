-- ------------------------------------------------------------------------
-- Migration: Create Orders Table, Enum, and Performance Indexes
-- File: apps/api/supabase/migrations/20250006_create_orders.sql
-- ------------------------------------------------------------------------

-- 1. Create Paystack status enum
CREATE TYPE public.paystack_status AS ENUM ('pending', 'success', 'failed');

-- 2. Create the orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    total_amount INTEGER NOT NULL, -- in Kobo
    paystack_reference TEXT NOT NULL UNIQUE,
    paystack_status public.paystack_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0)
);

-- 3. Create high-performance indexes
CREATE INDEX idx_orders_paystack_ref ON public.orders(paystack_reference);
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);

-- 4. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Configure RLS Policies
-- Policy A: Buyers can read their own orders only
CREATE POLICY "Buyers can read their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = buyer_id);

-- Policy B: Buyers can create their own orders
CREATE POLICY "Buyers can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- Policy C: Organizers can read orders for their events
CREATE POLICY "Organizers can read event orders" 
ON public.orders 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE id = event_id AND organizer_id = auth.uid()
    )
);

-- Policy D: Admins can do all actions (CRUD) on all orders
CREATE POLICY "Admins can manage all orders" 
ON public.orders 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
