import { supabase } from '../src/config/supabase';

async function checkDb() {
  const { data, error } = await supabase.from('users').select('*').limit(5);
  console.log('users data:', data);
  console.log('users error:', error);
  
  const res = await supabase.rpc('get_pg_settings'); // test if we can run something
}
checkDb();
