-- ------------------------------------------------------------------------
-- Migration: Add reminder_sent flag to events table
-- ------------------------------------------------------------------------

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
