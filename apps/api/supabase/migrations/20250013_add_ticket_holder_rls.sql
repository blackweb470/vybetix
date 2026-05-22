-- ------------------------------------------------------------------------
-- Migration: Add RLS policy for assigned ticket holders
-- ------------------------------------------------------------------------

-- Drop the old buyer-only policy so we can replace it with a broader one
-- Actually, the old policy "Buyers can read their own tickets" is fine to keep, 
-- we just add a NEW policy for holders so both conditions work!

CREATE POLICY "Holders can read their assigned tickets"
ON public.tickets
FOR SELECT
USING (
    holder_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
