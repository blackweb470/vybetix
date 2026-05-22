-- ------------------------------------------------------------------------
-- Migration: Create Fraud Flags Table
-- File: apps/api/supabase/migrations/20250009_create_fraud_flags.sql
-- ------------------------------------------------------------------------

-- 1. Create the fraud_flags table
CREATE TABLE public.fraud_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    flagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved BOOLEAN NOT NULL DEFAULT false
);

-- 2. Enable RLS
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

-- 3. Configure RLS Policies
-- Policy A: Admins can do all actions (CRUD) on fraud flags
CREATE POLICY "Admins can manage fraud flags" 
ON public.fraud_flags 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
