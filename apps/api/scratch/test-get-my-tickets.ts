import { supabase } from '../src/config/supabase';

const TEST_USER_ID = '591816c5-d1c8-4d98-be54-64b683834de0';
const TEST_USER_EMAIL = 'akhatasebhudojoseph1@gmail.com';

async function testGetMyTickets() {
  console.log('=== Testing getMyTickets flow ===\n');
  
  // Step 1: Fetch the user's successful order IDs
  console.log('Step 1: Fetching successful orders for user', TEST_USER_ID);
  const { data: myOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .eq('buyer_id', TEST_USER_ID)
    .eq('paystack_status', 'success');

  if (ordersError) {
    console.error('❌ ORDERS ERROR:', ordersError);
    return;
  }
  console.log('✅ Orders found:', myOrders?.length || 0, myOrders);

  const myOrderIds = (myOrders || []).map((o: any) => o.id);

  // Step 2a: Fetch tickets from user's own orders
  let buyerTickets: any[] = [];
  if (myOrderIds.length > 0) {
    console.log('\nStep 2a: Fetching buyer tickets for order IDs:', myOrderIds);
    const { data, error: err } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_tiers(name, price, events(title, cover_image_url, venue, event_date)),
        orders(id, buyer_id, paystack_status)
      `)
      .in('order_id', myOrderIds)
      .eq('status', 'active');

    if (err) {
      console.error('❌ BUYER TICKETS ERROR:', err);
      return;
    }
    buyerTickets = data || [];
    console.log('✅ Buyer tickets found:', buyerTickets.length);
  } else {
    console.log('\nStep 2a: Skipped (no successful orders)');
  }

  // Step 2b: Fetch tickets assigned to the user's email
  console.log('\nStep 2b: Fetching assigned tickets for email:', TEST_USER_EMAIL);
  const { data: assignedTicketsRaw, error: assignedError } = await supabase
    .from('tickets')
    .select(`
      *,
      ticket_tiers(name, price, events(title, cover_image_url, venue, event_date)),
      orders(id, buyer_id, paystack_status)
    `)
    .eq('holder_email', TEST_USER_EMAIL)
    .eq('status', 'active');

  if (assignedError) {
    console.error('❌ ASSIGNED TICKETS ERROR:', assignedError);
    return;
  }
  console.log('✅ Assigned tickets raw:', assignedTicketsRaw?.length || 0);

  // Filter for paid orders
  const assignedTickets = (assignedTicketsRaw || []).filter(
    (t: any) => t.orders?.paystack_status === 'success'
  );
  console.log('✅ Assigned tickets (paid only):', assignedTickets.length);

  // Merge and deduplicate
  const allTicketsMap = new Map();
  [...buyerTickets, ...assignedTickets].forEach((t: any) => {
    allTicketsMap.set(t.id, t);
  });
  const tickets = Array.from(allTicketsMap.values());

  console.log('\n=== FINAL RESULT ===');
  console.log('Total tickets:', tickets.length);
  tickets.forEach((t: any) => {
    console.log(`  - ${t.id}: ${t.holder_name} | ${t.ticket_tiers?.name} | ${t.ticket_tiers?.events?.title} | order: ${t.orders?.paystack_status}`);
  });
}

testGetMyTickets();
