-- ------------------------------------------------------------------------
-- Migration: Create Universities Table
-- File: apps/api/supabase/migrations/20250002_create_universities.sql
-- ------------------------------------------------------------------------

-- 1. Create the universities table
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    email_domain TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- 3. Configure RLS Policies
-- Policy A: Anyone can read active universities
CREATE POLICY "Anyone can read active universities" 
ON public.universities 
FOR SELECT 
USING (active = true);

-- Policy B: Admins can do all actions (CRUD)
CREATE POLICY "Admins can manage universities" 
ON public.universities 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
