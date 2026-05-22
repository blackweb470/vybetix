import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function fetchOpenAPI() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`;
  const anonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables");
    return;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      console.error("Response body:", text);
      return;
    }
    const spec = await response.json();
    console.log("Paths available in Postgrest:");
    console.log(Object.keys(spec.paths).filter(path => path.startsWith('/rpc/')));
  } catch (err) {
    console.error("Error fetching OpenAPI:", err);
  }
}

fetchOpenAPI();
