import { supabase } from '../src/config/supabase';

async function testProfileUpdate() {
  console.log("Fetching first user...");
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return;
  }

  if (!users || users.length === 0) {
    console.log("No users found to test profile update.");
    return;
  }

  const user = users[0];
  console.log("Testing profile update for user ID:", user.id, "current name:", user.full_name);

  // Try updating the user
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({
      full_name: user.full_name + " (Test)",
      phone: user.phone || "+2348000000000"
    })
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error("Update failed with error:", updateError);
  } else {
    console.log("Update successful! Result:", updated);

    // Revert it back
    console.log("Reverting changes...");
    await supabase
      .from('users')
      .update({
        full_name: user.full_name,
        phone: user.phone
      })
      .eq('id', user.id);
    console.log("Reverted successfully!");
  }
}

testProfileUpdate();
