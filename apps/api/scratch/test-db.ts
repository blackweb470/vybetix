import { supabase } from '../src/config/supabase';

async function checkDb() {
  console.log("Checking orders table...");
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (ordersError) {
    console.error("Error querying orders:", ordersError);
  } else {
    console.log("Orders sample row:", orders);
  }

  console.log("\nChecking tickets table...");
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('*')
    .limit(1);

  if (ticketsError) {
    console.error("Error querying tickets:", ticketsError);
  } else {
    console.log("Tickets sample row:", tickets);
  }
  
  console.log("\nChecking ticket_tiers table...");
  const { data: tiers, error: tiersError } = await supabase
    .from('ticket_tiers')
    .select('*')
    .limit(1);

  if (tiersError) {
    console.error("Error querying ticket_tiers:", tiersError);
  } else {
    console.log("Ticket Tiers sample row:", tiers);
  }
}

checkDb();
