import { supabase } from '../src/config/supabase';

async function checkColumns() {
  const { data, error } = await supabase.from('organizer_profiles').select('*').limit(1);
  if (error) {
    console.error("Error fetching organizer profiles:", error);
  } else {
    console.log("Organizer profile record keys:", data.length > 0 ? Object.keys(data[0]) : "No records found");
    console.log("Full data:", data);
  }
}

checkColumns();
