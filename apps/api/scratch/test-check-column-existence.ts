import { supabase } from '../src/config/supabase';

async function testInsert() {
  const dummyId = '11111111-1111-1111-1111-111111111111'; // Just a dummy UUID
  const { data, error } = await supabase
    .from('organizer_profiles')
    .insert({
      user_id: dummyId,
      business_name: 'Test Business',
      bank_name: 'Access Bank PLC',
      account_number: '0000000000',
      account_name: 'Test Account',
      paystack_subaccount_code: 'ACCT_1234567890'
    })
    .select();

  if (error) {
    console.log("Insert failed. Error code:", error.code);
    console.log("Error message:", error.message);
  } else {
    console.log("Insert succeeded! Data:", data);
    // Delete it right away
    await supabase.from('organizer_profiles').delete().eq('user_id', dummyId);
  }
}

testInsert();
