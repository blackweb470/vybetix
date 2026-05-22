-- Add nullable slug column first
ALTER TABLE public.events ADD COLUMN slug text;

-- Generate slug from title for existing rows
-- Safe slugification in pure Postgres SQL
UPDATE public.events 
SET slug = lower(regexp_replace(regexp_replace(trim(title), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- Make slug UNIQUE and NOT NULL
ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.events ADD CONSTRAINT events_slug_unique UNIQUE (slug);
