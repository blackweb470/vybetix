-- ------------------------------------------------------------------------
-- Migration: Fix Tickets INSERT RLS Policy
-- File: apps/api/supabase/migrations/20250015_fix_tickets_insert_rls.sql
-- ------------------------------------------------------------------------
-- The tickets table had RLS enabled but no INSERT policy at all.
-- Any insert attempt (including from the backend fulfillOrder function)
-- was rejected. This migration adds:
--   1. An INSERT policy so the backend can generate tickets after payment
--   2. A SELECT policy so ticket holders can read their own assigned tickets
-- ------------------------------------------------------------------------

-- Clean up any duplicate holders policy if it was already created
DROP POLICY IF EXISTS "Holders can read their assigned tickets" ON public.tickets;

-- Policy 1: Backend (and any authenticated context) can insert tickets.
-- The service_role bypasses RLS by default, but this ensures any
-- authenticated context (e.g. webhook handler) can also insert.
CREATE POLICY "Backend can insert tickets"
ON public.tickets
FOR INSERT
WITH CHECK (true);

-- Policy 2: Ticket holders (friends who received tickets) can read
-- their tickets by matching their account email to the holder_email field.
CREATE POLICY "Holders can read their assigned tickets"
ON public.tickets
FOR SELECT
USING (
    holder_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

