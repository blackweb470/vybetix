import { supabase } from '../src/config/supabase';
import { paystackClient } from '../src/config/paystack';

async function testOrganizerProfileUpdate() {
  console.log("Checking if an organizer user exists...");
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'organizer')
    .limit(1);

  if (userError) {
    console.error("User fetch error:", userError);
    return;
  }

  let organizer = users?.[0];

  if (!organizer) {
    console.log("No organizer found. Temporarily promoting the first buyer to organizer for testing...");
    const { data: firstBuyer } = await supabase.from('users').select('*').limit(1).single();
    if (!firstBuyer) {
      console.log("No users found at all.");
      return;
    }
    const { data: updatedBuyer } = await supabase
      .from('users')
      .update({ role: 'organizer' })
      .eq('id', firstBuyer.id)
      .select()
      .single();
    organizer = updatedBuyer!;
  }

  console.log("Found organizer user ID:", organizer.id);

  // Define testing credentials
  const businessName = "Test Organizer Brand";
  const bankCode = "058"; // GTBank code
  const bankName = "Guaranty Trust Bank";
  const accountNumber = "0123456789"; // Mock account number (or GTBank test account number)
  const accountName = "TEST ACCOUNT NAME";

  console.log("Fetching existing organizer profile...");
  const { data: currentProfile } = await supabase
    .from('organizer_profiles')
    .select('*')
    .eq('user_id', organizer.id)
    .maybeSingle();

  console.log("Current profile:", currentProfile);

  let subaccountCode = currentProfile?.paystack_subaccount_code;

  console.log("Syncing with Paystack subaccount...");
  try {
    if (!subaccountCode) {
      console.log("Creating new Paystack subaccount on Paystack...");
      const subaccount = await paystackClient.createSubaccount(
        businessName,
        bankCode,
        accountNumber
      );
      subaccountCode = subaccount.subaccount_code;
      console.log("Paystack subaccount created successfully! Code:", subaccountCode);
    } else {
      console.log("Updating existing Paystack subaccount:", subaccountCode);
      await paystackClient.updateSubaccount(
        subaccountCode,
        businessName,
        bankCode,
        accountNumber
      );
      console.log("Paystack subaccount updated successfully!");
    }
  } catch (paystackError: any) {
    console.error("Paystack API call failed:", paystackError.message || paystackError);
    // If Paystack fails, let's print full error response if available
    if (paystackError.response?.data) {
      console.error("Paystack detailed error:", paystackError.response.data);
    }
  }

  console.log("Upserting organizer profile record in database...");
  const { data: profile, error: profileError } = await supabase
    .from('organizer_profiles')
    .upsert({
      user_id: organizer.id,
      business_name: businessName,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      paystack_subaccount_code: subaccountCode || null
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (profileError) {
    console.error("Organizer profile upsert failed with error:", profileError);
  } else {
    console.log("Organizer profile upserted successfully! Result:", profile);
  }

  // Restore the role if we changed it
  if (organizer.role !== 'organizer') {
    console.log("Restoring role back to buyer...");
    await supabase.from('users').update({ role: 'buyer' }).eq('id', organizer.id);
  }
}

testOrganizerProfileUpdate();
