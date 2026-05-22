import { supabase } from '../src/config/supabase';
import { paystackClient } from '../src/config/paystack';

async function findSuccessfulPayments() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('paystack_status', 'pending');

  if (error) {
    console.error("Error fetching pending orders:", error);
    return;
  }

  console.log(`Checking status on Paystack for ${orders?.length || 0} pending orders...`);

  for (const order of (orders || [])) {
    try {
      const paystackData = await paystackClient.verifyTransaction(order.paystack_reference);
      console.log(`Ref: ${order.paystack_reference} -> Paystack Status: ${paystackData.status}`);
      if (paystackData.status === 'success') {
        console.log(`Found SUCCESSFUL transaction in Paystack:`, paystackData);
      }
    } catch (e: any) {
      console.log(`Ref: ${order.paystack_reference} -> Error verifying: ${e.message}`);
    }
  }
}

findSuccessfulPayments();
