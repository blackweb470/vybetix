import axios from 'axios';

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'akhatasebhudojoseph1@gmail.com',
      password: 'password123' // Try a default password or we can fetch a token directly from supabase
    });
    console.log('Login success');
    const token = loginRes.data.data.session.access_token;

    console.log('Fetching tickets...');
    const res = await axios.get('http://localhost:4000/api/tickets/my', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Tickets response:', res.data);
  } catch (err: any) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

run();
