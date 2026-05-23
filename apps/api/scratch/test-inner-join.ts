import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: ticketsOuter, error: errOuter } = await supabase
    .from('tickets')
    .select('id, status, ticket_tiers(price)')
    .in('ticket_tiers.event_id', ['some-fake-id']);
  console.log('Fake ID outer join error:', errOuter);

  const { data: ticketsInner, error: errInner } = await supabase
    .from('tickets')
    .select('id, status, ticket_tiers!inner(price, event_id)')
    .in('ticket_tiers.event_id', ['some-fake-id']);
  console.log('Fake ID inner join error:', errInner);
}

test().catch(console.error);
