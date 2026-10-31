const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: 'apps/api/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function generateQRToken(ticketId) {
  const secret = process.env.QR_SECRET || 'vybetix_default_qr_secret_key_super_secure';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(ticketId);
  return `${ticketId}.${hmac.digest('hex')}`;
}

async function fulfill(refOrId) {
  if (!refOrId) {
    console.error('Usage: node scripts/fulfill_order.js <order_id_or_paystack_reference>');
    process.exit(1);
  }

  console.log(`\nSearching for order matching "${refOrId}"...`);

  // Try finding by ID first, then reference
  let { data: order } = await supabase
    .from('orders')
    .select('*, events(*)')
    .eq('id', refOrId)
    .maybeSingle();

  if (!order) {
    const res = await supabase
      .from('orders')
      .select('*, events(*)')
      .eq('paystack_reference', refOrId)
      .maybeSingle();
    order = res.data;
  }

  if (!order) {
    console.error('Error: Order not found in database.');
    process.exit(1);
  }

  console.log(`Found Order: ${order.id}`);
  console.log(`Event: ${order.events?.title}`);
  console.log(`Current Status: ${order.paystack_status}`);
  console.log(`Amount: ${order.total_amount / 100} NGN`);

  // Check if tickets already exist
  const { data: existing } = await supabase
    .from('tickets')
    .select('id, holder_name, holder_email')
    .eq('order_id', order.id);

  if (existing && existing.length > 0) {
    console.log(`Order already has ${existing.length} ticket(s) generated:`);
    console.log(existing);
    return;
  }

  // Get buyer details
  const { data: buyer } = await supabase
    .from('users')
    .select('email, full_name, phone')
    .eq('id', order.buyer_id)
    .maybeSingle();

  // Find ticket tier for this event
  const { data: tiers } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('event_id', order.event_id)
    .order('price', { ascending: false });

  if (!tiers || tiers.length === 0) {
    console.error('Error: No ticket tiers found for this event.');
    process.exit(1);
  }

  const tier = tiers[0];
  console.log(`Assigning to Tier: ${tier.name} (ID: ${tier.id})`);

  const attendeeName = buyer?.full_name || 'Valued Guest';
  const attendeeEmail = buyer?.email || 'guest@vybetix.com';
  const attendeePhone = buyer?.phone || '+2340000000000';

  const ticketId = crypto.randomUUID();
  const qrToken = generateQRToken(ticketId);

  // Insert ticket
  const { error: tErr } = await supabase
    .from('tickets')
    .insert({
      id: ticketId,
      order_id: order.id,
      tier_id: tier.id,
      holder_name: attendeeName,
      holder_email: attendeeEmail,
      holder_phone: attendeePhone,
      qr_token: qrToken,
      status: 'active'
    });

  if (tErr) {
    console.error('Error inserting ticket:', tErr.message);
    process.exit(1);
  }

  // Update order status to success
  await supabase
    .from('orders')
    .update({ paystack_status: 'success' })
    .eq('id', order.id);

  // Increment tier sold count
  await supabase
    .from('ticket_tiers')
    .update({ sold: (tier.sold || 0) + 1 })
    .eq('id', tier.id);

  console.log(`\n SUCCESS! Ticket generated successfully:`);
  console.log(`Ticket ID: ${ticketId}`);
  console.log(`Attendee: ${attendeeName} (${attendeeEmail})`);
  console.log(`Order status updated to "success".`);
}

fulfill(process.argv[2]).catch(console.error);

