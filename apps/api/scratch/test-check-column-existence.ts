import { supabase } from '../src/config/supabase';

async function checkColumns() {
  const { data, error } = await supabase
    .rpc('get_columns_test');

  if (error) {
    console.log("RPC get_columns_test failed, using direct query...");
    // Let's run a direct query on pg_attribute or information_schema via a function or rpc if available.
    // If not, we can query it using a SELECT on information_schema.columns if we have permissions.
    const { data: cols, error: colsErr } = await supabase
      .from('organizer_profiles')
      .select('*')
      .limit(0); // This should return headers in the response or error out
    
    if (colsErr) {
      console.error("Direct query failed:", colsErr);
    } else {
      console.log("Direct query succeeded (empty select).");
    }

    // Let's try to query pg_class / information_schema via standard PostgREST:
    // PostgREST doesn't expose system catalogs by default unless public views or RPCs exist.
  } else {
    console.log("Columns:", data);
  }
}

async function queryColumnsAlternative() {
  // Let's run a quick query that uses pg_catalog if we have access:
  const { data, error } = await supabase
    .from('organizer_profiles')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      business_name: 'test',
      bank_name: 'test',
      account_number: '123',
      account_name: 'test',
      paystack_subaccount_code: 'test'
    })
    .select();
  
  console.log("Insert result:", data, "Error:", error);
}

queryColumnsAlternative();
