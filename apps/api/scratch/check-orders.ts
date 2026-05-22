import { supabase } from '../src/config/supabase';

async function checkOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  } else {
    console.log("All Orders:");
    console.log(JSON.stringify(orders, null, 2));
  }
}

checkOrders();
