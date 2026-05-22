import { supabase } from '../src/config/supabase';
import { generateQRToken } from '../src/utils/qrcode';
import crypto from 'crypto';

async function testInsert() {
  const { data: order } = await supabase.from('orders').select('id').limit(1).single();
  const { data: tier } = await supabase.from('ticket_tiers').select('id').limit(1).single();

  if (!order || !tier) {
    console.error("Could not find any order or tier in database.");
    return;
  }

  console.log(`Using order_id: ${order.id}, tier_id: ${tier.id}`);

  const ticketId = crypto.randomUUID();
  const qrToken = generateQRToken(ticketId);

  const ticketObj = {
    id: ticketId,
    order_id: order.id,
    tier_id: tier.id,
    holder_name: 'Test Holder',
    holder_email: 'test@example.com',
    holder_phone: '+2348011112222',
    qr_token: qrToken,
    status: 'active'
  };

  console.log("Attempting insert with real qrToken...");
  const { data, error } = await supabase.from('tickets').insert([ticketObj]).select();

  if (error) {
    console.error("Insert failed with error:", error);
  } else {
    console.log("Insert succeeded!", data);
    await supabase.from('tickets').delete().eq('id', ticketId);
  }
}

testInsert();
