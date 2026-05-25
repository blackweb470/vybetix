-- Add columns for device unlock via OTP
ALTER TABLE public.tickets
ADD COLUMN unlock_otp TEXT,
ADD COLUMN unlock_otp_expires_at TIMESTAMPTZ;
