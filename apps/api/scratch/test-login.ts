import axios from 'axios';

async function testLogin() {
  try {
    console.log('Testing login on Railway API...');
    const loginRes = await axios.post('https://api-production-b517.up.railway.app/api/auth/login', {
      email: 'akhatasebhudojoseph1@gmail.com', // or any test email
      password: 'wrong_password_just_to_see_error_type'
    });
    console.log(loginRes.data);
  } catch (err: any) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data || err.message);
  }
}

testLogin();
