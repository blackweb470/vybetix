-- ------------------------------------------------------------------------
-- Migration: Create Organizer Profiles Table
-- File: apps/api/supabase/migrations/20250003_create_organizer_profiles.sql
-- ------------------------------------------------------------------------

-- 1. Create the organizer_profiles table
CREATE TABLE public.organizer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Configure RLS Policies
-- Policy A: Organizers can read their own profile
CREATE POLICY "Organizers can read their own profile" 
ON public.organizer_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy B: Organizers can insert/create their own profile
CREATE POLICY "Organizers can create their own profile" 
ON public.organizer_profiles 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'organizer'
    )
);

-- Policy C: Organizers can update their own profile details
CREATE POLICY "Organizers can update their own profile" 
ON public.organizer_profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy D: Admins can view all organizer profiles
CREATE POLICY "Admins can read all organizer profiles" 
ON public.organizer_profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy E: Admins can update/verify organizer profiles
CREATE POLICY "Admins can manage all organizer profiles" 
ON public.organizer_profiles 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
