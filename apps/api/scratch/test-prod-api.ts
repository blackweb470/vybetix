import axios from 'axios';

async function testProdApi() {
  try {
    console.log('Logging into production API...');
    // We can't actually log in without the password.
    // Instead, I'll hit an endpoint that throws a 401 just to see the exact response format
    const res = await axios.get('https://api-production-b517.up.railway.app/api/tickets/my', {
      headers: {
        Authorization: 'Bearer invalid_token'
      }
    });
    console.log(res.data);
  } catch (err: any) {
    console.log('Error status:', err.response?.status);
    console.log('Error body:', err.response?.data || err.message);
  }
}

testProdApi();
