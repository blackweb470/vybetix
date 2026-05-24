import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  console.log('Testing Resend...');
  console.log('Using API Key:', process.env.RESEND_API_KEY ? 'Set' : 'Not Set');
  
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  console.log('From Email:', fromEmail);

  const toEmail = process.argv[2];
  if (!toEmail) {
    console.error('Please provide an email address to send the test email to.');
    console.error('Usage: npx ts-node test-resend.ts <your-email@example.com>');
    process.exit(1);
  }

  console.log('Sending to:', toEmail);

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'Test Email from Tixwave Verification',
      html: '<p>This is a test email to verify your Resend configuration. If you receive this, it works!</p>'
    });
    console.log('Success!', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testResend();
