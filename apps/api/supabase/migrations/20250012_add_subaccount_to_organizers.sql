-- ------------------------------------------------------------------------
-- Migration: Add Paystack Subaccount Code to Organizer Profiles
-- File: apps/api/supabase/migrations/20250012_add_subaccount_to_organizers.sql
-- ------------------------------------------------------------------------

ALTER TABLE public.organizer_profiles 
ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT;
