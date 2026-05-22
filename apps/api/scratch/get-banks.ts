import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function getBanks() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("Missing PAYSTACK_SECRET_KEY in environment variables");
    return;
  }

  try {
    const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    if (result.status) {
      console.log("Supported Nigerian Banks (Top 20):");
      console.log(result.data.slice(0, 20).map((b: any) => ({ name: b.name, code: b.code })));
    } else {
      console.error("Failed to get banks:", result.message);
    }
  } catch (err) {
    console.error("Error fetching banks:", err);
  }
}

getBanks();
