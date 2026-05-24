import axios from 'axios';

async function testRegister() {
  try {
    const res = await axios.post('http://localhost:4000/api/auth/register', {
      email: `test${Date.now()}@test.com`,
      password: 'password123',
      fullName: 'Test User',
      phone: '+2348012345678',
      role: 'buyer'
    });
    console.log(res.data);
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testRegister();
