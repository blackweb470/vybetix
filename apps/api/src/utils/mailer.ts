import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_mock_key_12345';
export const resend = new Resend(RESEND_API_KEY);

interface TicketEmailData {
  id: string;
  tierName: string;
  price: number; // in Kobo
  qrToken?: string;
  qrImageBase64?: string; // "data:image/png;base64,iVBOR..."
}

interface TicketConfirmationEmailParams {
  email: string;
  holderName: string;
  eventTitle: string;
  venue: string;
  eventDate: string;
  tickets: TicketEmailData[];
}

/**
 * Sends a premium ticket purchase confirmation email using Resend, complete with ticket inline details and QR attachment.
 */
export async function sendTicketConfirmationEmail(params: TicketConfirmationEmailParams) {
  const { email, holderName, eventTitle, venue, eventDate, tickets } = params;

  // Format currency from Kobo to Naira
  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
  };

  // Construct table rows for ticket details
  const ticketRowsHtml = tickets.map((t, idx) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #2d2d2d; color: #ffffff;">#${idx + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #2d2d2d; color: #ffffff; font-weight: bold;">${t.tierName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #2d2d2d; color: #a3a3a3;">${formatNaira(t.price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #2d2d2d; color: #3b82f6; font-family: monospace; font-size: 11px;">${t.id.slice(0, 8)}...</td>
    </tr>
  `).join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Vybetix Tickets</title>
    </head>
    <body style="background-color: #0b0b0f; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #12121a; border-radius: 16px; border: 1px solid #27272a; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%); padding: 30px 40px; text-align: center; border-bottom: 1px solid #27272a;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">⚡️ Vybetix</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #a5f3fc; font-weight: 500; text-transform: uppercase; letter-spacing: 2px;">Your Tickets Are Ready!</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #ffffff;">Hey ${holderName},</h2>
          <p style="line-height: 1.6; color: #a3a3a3; font-size: 15px;">Your payment has been successfully processed! We have secured your spot for the event. Below you will find your ticket breakdown. In order to protect your ticket against unauthorized access and duplication, your secure ticket is bound to your physical device. Please log into the Vybetix app on your mobile device/browser to securely view your QR code for gate entry.</p>

          <!-- Event Summary Card -->
          <div style="margin: 30px 0; background-color: #1a1a24; border-radius: 12px; border: 1px solid #2d2d3d; padding: 20px;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #3b82f6; font-weight: 600;">Event Details</p>
            <h3 style="margin: 5px 0 10px 0; font-size: 18px; font-weight: 700; color: #ffffff;">${eventTitle}</h3>
            <p style="margin: 4px 0; font-size: 14px; color: #d1d5db;">📍 <strong>Venue:</strong> ${venue}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #d1d5db;">📅 <strong>Date & Time:</strong> ${new Date(eventDate).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT</p>
          </div>

          <!-- Ticket Summary Table -->
          <h3 style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 12px;">Ticket Summary</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #2d2d2d;">
                <th style="padding: 10px; color: #a3a3a3; font-weight: 500;">No.</th>
                <th style="padding: 10px; color: #a3a3a3; font-weight: 500;">Tier</th>
                <th style="padding: 10px; color: #a3a3a3; font-weight: 500;">Price</th>
                <th style="padding: 10px; color: #a3a3a3; font-weight: 500;">Ticket ID</th>
              </tr>
            </thead>
            <tbody>
              ${ticketRowsHtml}
            </tbody>
          </table>

          <!-- Security Notice -->
          <div style="background-color: #1c1917; border-left: 4px solid #ea580c; padding: 15px; border-radius: 8px; font-size: 13px; color: #d6d3d1; line-height: 1.5;">
            ⚠️ <strong>Anti-Scalping Protection:</strong> Tickets are digitally signed and cryptographically locked to the first device that claims/views them. Keep your account private.
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #0d0d12; padding: 20px 40px; text-align: center; border-top: 1px solid #27272a; font-size: 12px; color: #52525b;">
          <p style="margin: 0;">&copy; 2026 Vybetix Platforms Ltd. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Lagos & Abuja, Nigeria • Support: <a href="mailto:hello@vybetix.com" style="color: #3b82f6; text-decoration: none;">hello@vybetix.com</a></p>
        </div>

      </div>
    </body>
    </html>
  `;

  // Construct attachments array (only if qrImageBase64 is provided)
  const attachments = tickets
    .filter(t => t.qrImageBase64)
    .map((t, index) => {
      // Strip "data:image/png;base64," prefix to obtain pure base64 binary
      const base64Data = t.qrImageBase64!.replace(/^data:image\/png;base64,/, '');
      
      return {
        filename: `Vybetix-ticket-${index + 1}-${t.tierName.toLowerCase().replace(/\s+/g, '-')}.png`,
        content: Buffer.from(base64Data, 'base64')
      };
    });

  try {
    // Check for mock sending if Resend Key is undefined or default placeholder
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key_12345') {
      console.log(`[Mock Mailer] Emailed ${email} for "${eventTitle}" with ${tickets.length} tickets (without static QR attachments).`);
      return { success: true, mock: true };
    }

    const response = await resend.emails.send({
      from: (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('@')) 
        ? process.env.RESEND_FROM_EMAIL 
        : 'Vybetix <tickets@vybetix.com>',
      to: [email],
      subject: `⚡️ Your tickets for ${eventTitle} are ready!`,
      html: emailHtml,
      ...(attachments.length > 0 ? { attachments } : {})
    });

    return { success: true, data: response };
  } catch (error) {
    console.error('Resend execution failure:', error);
    throw error;
  }
}

/**
 * Sends a 24-hour reminder email to an attendee.
 */
export async function sendEventReminderEmail(
  email: string,
  name: string,
  eventTitle: string,
  venue: string,
  eventDate: string
) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="background-color: #0b0b0f; color: #f3f4f6; font-family: sans-serif; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #12121a; border-radius: 16px; border: 1px solid #27272a; padding: 40px;">
        <h2 style="color: #ffffff;">Hey ${name},</h2>
        <p>This is a quick reminder that <strong>${eventTitle}</strong> is happening tomorrow!</p>
        <p>📍 Venue: ${venue}</p>
        <p>📅 Time: ${new Date(eventDate).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT</p>
        <p>Don't forget to have your ticket QR code ready for scanning at the gate.</p>
        <p>See you there!</p>
      </div>
    </body>
    </html>
  `;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key_12345') {
    console.log(`[Mock Mailer] Reminder sent to ${email} for "${eventTitle}"`);
    return { success: true, mock: true };
  }

  return await resend.emails.send({
    from: (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('@')) 
      ? process.env.RESEND_FROM_EMAIL 
      : 'Vybetix <tickets@vybetix.com>',
    to: [email],
    subject: `⏰ Reminder: ${eventTitle} is tomorrow!`,
    html: emailHtml
  });
}

