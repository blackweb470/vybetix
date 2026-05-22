async function testEndpoint() {
  try {
    const response = await fetch('http://127.0.0.1:4000/api/payments/banks');
    const result = await response.json();
    console.log("Endpoint success status:", result.success);
    console.log("Message:", result.message);
    if (result.success) {
      console.log("Banks returned count:", result.data.length);
      console.log("First bank:", result.data[0]);
    }
  } catch (err) {
    console.error("Failed to query local endpoint:", err);
  }
}

testEndpoint();
