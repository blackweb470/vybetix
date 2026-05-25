import { supabase } from '../../config/supabase';

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      ALTER TABLE public.tickets
      ADD COLUMN IF NOT EXISTS unlock_otp TEXT,
      ADD COLUMN IF NOT EXISTS unlock_otp_expires_at TIMESTAMPTZ;
    `
  });
  console.log(error || 'Success');
}
run();
