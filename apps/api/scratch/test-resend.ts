import { sendTicketConfirmationEmail } from '../src/utils/mailer';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runTest() {
  console.log('Starting Resend test...');
  console.log('Using RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Not Found');

  try {
    const testEmail = 'akhatasebhudojoseph1@gmail.com'; // Replace with your test recipient email
    const result = await sendTicketConfirmationEmail({
      email: testEmail,
      holderName: 'VibeTix Tester',
      eventTitle: 'Lagos Summer Festival 2026',
      venue: 'Eko Atlantic City, Lagos',
      eventDate: new Date().toISOString(),
      tickets: [
        {
          id: 'test-ticket-id-12345',
          tierName: 'VIP Access Pass',
          price: 2500000 // 25,000 Naira in kobo
        }
      ]
    });

    console.log('Resend send success!', result);
  } catch (error) {
    console.error('Resend test failed:', error);
  }
}

runTest();
