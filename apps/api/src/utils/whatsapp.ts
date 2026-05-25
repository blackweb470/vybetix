import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

/**
 * Formats a phone number to standard E.164 format without the leading '+'
 * as required by Meta's WhatsApp API.
 * E.g. '+2348012345678' -> '2348012345678'
 */
function formatWhatsAppNumber(phone: string): string {
  return phone.replace(/^\+/, '');
}

/**
 * Sends a WhatsApp notification to the ticket holder using Meta's Cloud API.
 */
export async function sendTicketWhatsAppNotification(
  phone: string,
  holderName: string,
  eventTitle: string
) {
  const formattedPhone = formatWhatsAppNumber(phone);

  // If credentials are not set, gracefully fallback to mock mode
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID || WHATSAPP_ACCESS_TOKEN === 'mock_token') {
    console.log(`[Mock WhatsApp] Notification sent to ${formattedPhone} for event "${eventTitle}". Holder: ${holderName}`);
    return { success: true, mock: true };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'vybetix_ticket_delivery',
          language: {
            code: 'en_US'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: holderName
                },
                {
                  type: 'text',
                  text: eventTitle
                }
              ]
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Meta API Error: ${data.error?.message || 'Unknown error'}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('WhatsApp API execution failure:', error);
    throw error;
  }
}

/**
 * Sends a WhatsApp event reminder using Meta's Cloud API.
 */
export async function sendEventReminderWhatsApp(
  phone: string,
  holderName: string,
  eventTitle: string
) {
  const formattedPhone = formatWhatsAppNumber(phone);

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID || WHATSAPP_ACCESS_TOKEN === 'mock_token') {
    console.log(`[Mock WhatsApp] Reminder sent to ${formattedPhone} for event "${eventTitle}". Holder: ${holderName}`);
    return { success: true, mock: true };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'vybetix_event_reminder',
          language: {
            code: 'en_US'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: holderName
                },
                {
                  type: 'text',
                  text: eventTitle
                }
              ]
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Meta API Error: ${data.error?.message || 'Unknown error'}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('WhatsApp API execution failure:', error);
    throw error;
  }
}

