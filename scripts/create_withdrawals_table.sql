-- ================================================================
-- VYBETIX: Organizer Withdrawal Requests Table
-- Run this in your Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- The organizer requesting the withdrawal
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Amount in KOBO (e.g., 500000 = ₦5,000)
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),

  -- Bank details provided by organizer
  bank_name       TEXT NOT NULL,
  account_number  TEXT NOT NULL,
  account_name    TEXT NOT NULL,

  -- Optional: organizer note / reference to event
  note TEXT,

  -- Status lifecycle: pending -> approved | rejected
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),

  -- Admin action metadata
  admin_id         UUID REFERENCES users(id),
  admin_note       TEXT,
  processed_at     TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by organizer and status
CREATE INDEX IF NOT EXISTS idx_withdrawals_organizer ON withdrawals(organizer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER trg_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_withdrawals_updated_at();

-- RLS: organizers can only see their own; admins (service role) bypass via backend
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own withdrawals (frontend direct if needed)
CREATE POLICY "Organizer can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = organizer_id);

-- Allow organizers to insert their own withdrawal requests
CREATE POLICY "Organizer can request withdrawal"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

