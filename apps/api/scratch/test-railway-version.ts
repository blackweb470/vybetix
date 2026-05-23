import axios from 'axios';

async function checkApi() {
  try {
    console.log('Registering a test user on Railway API...');
    const email = `test-${Date.now()}@example.com`;
    const regRes = await axios.post('https://api-production-b517.up.railway.app/api/auth/register', {
      email,
      password: 'TestPassword123!',
      fullName: 'Test User',
      phone: '+2348012345678', // added phone
      role: 'buyer'
    });
    
    const token = regRes.data.data.session.access_token;
    console.log('Registered successfully. Token acquired.');

    console.log('Calling getMyTickets on Railway API...');
    const ticketsRes = await axios.get('https://api-production-b517.up.railway.app/api/tickets/my', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Success! Railway is running the NEW code.');
    console.log(ticketsRes.data);

  } catch (err: any) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data || err.message);
  }
}

checkApi();
