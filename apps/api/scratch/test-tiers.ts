import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, error } = await supabase.from('ticket_tiers').insert([{
    event_id: 'a9d7bb36-d249-43c3-88c9-04a081512b9e', // some uuid
    name: 'Test',
    description: 'Test',
    price: 100,
    quantity: 10,
    sold: 0,
    max_per_order: 5
  }]);
  console.log(error);
}
main();
