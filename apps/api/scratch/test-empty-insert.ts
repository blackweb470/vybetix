import { supabase } from '../src/config/supabase';

async function testEmptyInsert() {
  console.log("Attempting to insert an empty array...");
  const { data, error } = await supabase.from('tickets').insert([]).select();

  if (error) {
    console.error("Empty insert failed with error:", error);
  } else {
    console.log("Empty insert succeeded!", data);
  }
}

testEmptyInsert();
