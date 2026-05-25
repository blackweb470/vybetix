import dotenv from 'dotenv';
import path from 'path';

// Load the .env from the API directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

async function testWhatsApp() {
  console.log('Testing WhatsApp Integration...');
  console.log(`Phone ID loaded: ${WHATSAPP_PHONE_ID ? 'Yes' : 'No'}`);
  console.log(`Access Token loaded: ${WHATSAPP_ACCESS_TOKEN ? 'Yes' : 'No'}`);

  // We will send to a dummy number for testing if we just want to see the API response.
  // Actually, we need a valid number if we want to avoid early validation errors,
  // but Meta will return auth errors or template errors even with a dummy number.
  // We'll use a standard Nigerian test format for the recipient.
  // Accept phone number from command line, fallback to dummy
  let testPhone = process.argv[2];
  if (!testPhone) {
    console.log('⚠️ No phone number provided. Using dummy number 2348000000000.');
    console.log('To test with your real number, run: npx ts-node scratch/test-whatsapp.ts 234YOURNUMBER');
    testPhone = '2348000000000';
  }

  console.log(`Attempting to send 'vybetix_ticket_delivery' template to ${testPhone}...`);
  
  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: testPhone,
        type: 'template',
        template: {
          name: 'vybetix_ticket_delivery',
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: 'Joseph' // Sample name for {{1}}
                },
                {
                  type: 'text',
                  text: 'VIP Campus Rave' // Sample event for {{2}}
                }
              ]
            }
          ]
        }
      })
    });

    const data = await response.json();
    console.log('--- RESPONSE FROM META ---');
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('\n❌ Meta API rejected the request.');
    } else {
      console.log('\n✅ Meta API accepted the request! Credentials are valid.');
    }
  } catch (err) {
    console.error('\n❌ Network or execution error:', err);
  }
}

testWhatsApp();
