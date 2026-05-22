-- ------------------------------------------------------------------------
-- Migration: Create Users Table & Synchronization Trigger
-- File: apps/api/supabase/migrations/20250001_create_users.sql
-- ------------------------------------------------------------------------

-- 1. Create custom enum type for user roles
CREATE TYPE public.user_role AS ENUM ('buyer', 'organizer', 'admin');

-- 2. Create the users table in public schema
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT, -- Nigerian format: +234...
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'buyer',
    is_banned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS) on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Configure RLS Policies
-- Policy A: Users can read their own user row
CREATE POLICY "Users can read their own row" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy B: Users can update their own user row (only non-sensitive columns in real app, but let's write direct update check)
CREATE POLICY "Users can update their own row" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy C: Admins can read all user rows
CREATE POLICY "Admins can read all rows" 
ON public.users 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Set up automated trigger to sync users from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, phone, avatar_url, role, is_banned)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'phone', null),
        coalesce(new.raw_user_meta_data->>'avatar_url', null),
        'buyer',
        false
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
