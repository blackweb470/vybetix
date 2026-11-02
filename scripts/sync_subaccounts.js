const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/api/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const secret = process.env.PAYSTACK_SECRET_KEY;

if (!secret) {
  console.error('PAYSTACK_SECRET_KEY missing from environment');
  process.exit(1);
}

async function run() {
  console.log('1. Fetching subaccounts from Paystack...');
  const res = await fetch('https://api.paystack.co/subaccount?perPage=100', {
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json'
    }
  });

  const paystackData = await res.json();
  if (!paystackData.status) {
    console.error('Paystack error:', paystackData.message);
    process.exit(1);
  }

  const subaccounts = paystackData.data || [];
  console.log(`Found ${subaccounts.length} subaccount(s) on Paystack:`);
  for (const s of subaccounts) {
    console.log(` - ${s.subaccount_code} | ${s.business_name} | Bank: ${s.settlement_bank} | Acc: ${s.account_number}`);
  }

  if (subaccounts.length === 0) {
    console.log('No subaccounts found on Paystack.');
    return;
  }

  console.log('\n2. Fetching organizer profiles from Supabase...');
  const { data: organizers, error: orgErr } = await supabase
    .from('organizer_profiles')
    .select('*, user:users(id, full_name, email)');

  if (orgErr) {
    console.error('Database error:', orgErr.message);
    process.exit(1);
  }

  console.log(`Found ${organizers.length} organizer profile(s) in Supabase.`);

  // Auto-sync
  for (const org of organizers) {
    const matched = subaccounts.find(s =>
      (org.account_number && s.account_number === org.account_number) ||
      (org.business_name && s.business_name?.toLowerCase() === org.business_name?.toLowerCase())
    ) || (subaccounts.length === 1 ? subaccounts[0] : null);

    if (matched) {
      console.log(`Linking Organizer "${org.business_name || org.user?.full_name}" -> Subaccount "${matched.subaccount_code}" (${matched.business_name})`);
      const { error: updErr } = await supabase
        .from('organizer_profiles')
        .update({
          paystack_subaccount_code: matched.subaccount_code,
          verified: true
        })
        .eq('id', org.id);

      if (updErr) {
        console.error('Failed to update:', updErr.message);
      } else {
        console.log('✓ Successfully updated!');
      }
    } else {
      console.log(`No match for Organizer "${org.business_name}" (${org.account_number})`);
    }
  }

  // Also check all events
  const { data: events } = await supabase.from('events').select('organizer_id, title');
  for (const ev of (events || [])) {
    if (!ev.organizer_id) continue;
    const existing = (organizers || []).find(o => o.user_id === ev.organizer_id);
    if ((!existing || !existing.paystack_subaccount_code) && subaccounts.length >= 1) {
      const s = subaccounts[0];
      console.log(`Auto-linking event "${ev.title}" organizer (${ev.organizer_id}) to subaccount ${s.subaccount_code}`);
      await supabase
        .from('organizer_profiles')
        .upsert({
          user_id: ev.organizer_id,
          business_name: s.business_name,
          bank_name: s.settlement_bank,
          account_number: s.account_number,
          account_name: s.business_name,
          paystack_subaccount_code: s.subaccount_code,
          verified: true
        }, { onConflict: 'user_id' });
    }
  }

  console.log('\nSync finished successfully!');
}

run().catch(console.error);

