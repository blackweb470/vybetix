import { supabase } from '../src/config/supabase';

async function checkOrderTickets() {
  const orderIds = [
    '40cfe5af-685c-42da-8348-07558655e2bb', // Omofoye Emmanuel's order
    '94b7c579-6e1a-4bc7-8d26-a03c8fb47208'  // Jones Stevens' order
  ];

  for (const orderId of orderIds) {
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    const { data: tickets } = await supabase.from('tickets').select('*').eq('order_id', orderId);

    console.log(`Order ID: ${orderId}`);
    console.log(`Order Status: ${order?.paystack_status}`);
    console.log(`Tickets generated count: ${tickets?.length || 0}`);
    console.log(`Tickets:`, tickets);
    console.log('----------------------------');
  }
}

checkOrderTickets();
