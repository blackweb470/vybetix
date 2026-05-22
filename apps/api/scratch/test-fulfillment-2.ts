import { supabase } from '../src/config/supabase';
import { paystackClient } from '../src/config/paystack';
import { generateQRToken } from '../src/utils/qrcode';
import crypto from 'crypto';

async function fulfillOrder(orderId: string, tierId: string, quantity: number, holderName: string, holderEmail: string, holderPhone: string) {
  console.log(`Fulfilling order: ${orderId}, tierId: ${tierId}, quantity: ${quantity}`);
  
  const { data: order, error: orderFetchError } = await supabase
    .from('orders')
    .select('*, events(*)')
    .eq('id', orderId)
    .single();

  if (orderFetchError || !order) {
    throw new Error(`Order #${orderId} not found: ${orderFetchError?.message}`);
  }

  const { data: tier, error: tierFetchError } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('id', tierId)
    .single();

  if (tierFetchError || !tier) {
    throw new Error(`Ticket tier #${tierId} not found: ${tierFetchError?.message}`);
  }

  const { data: existingTickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('order_id', orderId);

  if (existingTickets && existingTickets.length > 0) {
    console.log(`Tickets already generated:`, existingTickets);
    return;
  }

  const ticketInserts = [];
  for (let i = 0; i < quantity; i++) {
    const ticketId = crypto.randomUUID();
    const qrToken = generateQRToken(ticketId);

    ticketInserts.push({
      id: ticketId,
      order_id: orderId,
      tier_id: tierId,
      holder_name: holderName,
      holder_email: holderEmail,
      holder_phone: holderPhone,
      qr_token: qrToken,
      status: 'active'
    });
  }

  console.log(`Inserting ${ticketInserts.length} tickets...`);
  const { error: insertError } = await supabase
    .from('tickets')
    .insert(ticketInserts);

  if (insertError) {
    throw new Error(`Failed to insert tickets: ${insertError.message} (${JSON.stringify(insertError)})`);
  }

  console.log("Fulfillment succeeded! Updating order status to success...");
  
  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({ paystack_status: 'success' })
    .eq('id', orderId);
    
  if (orderUpdateError) {
    console.error("Order status update failed:", orderUpdateError);
  } else {
    console.log("Order status updated successfully!");
  }
}

async function runTest() {
  const reference = 'TIX-f565e188-c148-4f7b-ad78-3975b33eb85f';
  try {
    const paystackData = await paystackClient.verifyTransaction(reference);
    console.log("Verified transaction status:", paystackData.status);

    if (paystackData.status === 'success') {
      let parsedMetadata = paystackData.metadata;
      if (typeof parsedMetadata === 'string') {
        parsedMetadata = JSON.parse(parsedMetadata);
      }

      console.log("Parsed Metadata:", parsedMetadata);
      
      await fulfillOrder(
        parsedMetadata.order_id,
        parsedMetadata.tier_id,
        Number(parsedMetadata.quantity),
        parsedMetadata.holder_name,
        parsedMetadata.holder_email,
        parsedMetadata.holder_phone
      );
    } else {
      console.log("Transaction status is not success in Paystack.");
    }
  } catch (e: any) {
    console.error("CRITICAL ERROR DURING RUNTIME:");
    console.error(e);
  }
}

runTest();
