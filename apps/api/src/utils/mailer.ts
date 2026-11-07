import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_mock_key_12345';
export const resend = new Resend(RESEND_API_KEY);

// ─── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  dark: '#161713',
  cream: '#f4f1e9',
  orange: '#ff5a24',
  lime: '#c4db59',
  pink: '#f7a6c5',
  muted: '#a7a89e',
  surface: '#1e1f18',
  border: '#2d2e27',
  dimText: '#737568',
};

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const naira = (kobo: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);

function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleString('en-NG', { weekday: 'short', timeZone: 'Africa/Lagos' }),    // "Sat"
    date: d.toLocaleString('en-NG', { day: '2-digit', timeZone: 'Africa/Lagos' }),      // "15"
    month: d.toLocaleString('en-NG', { month: 'short', timeZone: 'Africa/Lagos' }).toUpperCase(), // "MAR"
    full: d.toLocaleString('en-NG', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos'
    }) + ' WAT',
  };
}

// ─── Main email builder ───────────────────────────────────────────────────────
export async function sendTicketConfirmationEmail(params: TicketConfirmationEmailParams) {
  const { email, holderName, eventTitle, venue, eventDate, tickets } = params;
  const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://vybetix.com' : 'http://localhost:3000');
  const ev = formatEventDate(eventDate);
  const firstName = holderName.split(' ')[0];
  const totalKobo = tickets.reduce((s, t) => s + t.price, 0);

  // ── Per-ticket pass blocks ─────────────────────────────────────────────────
  const ticketBlocks = tickets.map((t, idx) => {
    const viewUrl = `${frontendUrl}/tickets/view?id=${t.id}${t.qrToken ? `&token=${encodeURIComponent(t.qrToken)}` : ''}`;
    const qrBlock = t.qrImageBase64
      ? `<div style="background:#fff;border-radius:12px;padding:16px;display:inline-block;margin:0 auto 12px;">
           <img src="${t.qrImageBase64}" width="200" height="200" alt="Gate QR" style="display:block;border-radius:4px;" />
         </div>
         <p style="margin:0 0 6px;font-size:11px;color:${C.muted};font-family:monospace;letter-spacing:0.5px;">
           SCAN AT GATE ENTRANCE
         </p>`
      : '';

    return `
      <!-- TICKET PASS ${idx + 1} -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td style="background:${C.surface};border:2px solid ${C.border};border-radius:16px;overflow:hidden;">

            <!-- Pass top ribbon -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${C.dark};padding:10px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-family:Arial,sans-serif;font-size:11px;font-weight:900;color:${C.cream};text-transform:uppercase;letter-spacing:1px;">
                        VYBETIX <span style="color:${C.orange};">✳</span> OFFICIAL GATE PASS
                      </td>
                      <td align="right">
                        <span style="background:${C.pink};color:${C.dark};font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;padding:3px 10px;border-radius:20px;font-family:Arial,sans-serif;">
                          ${t.tierName}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Pass body: QR + meta -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:24px 20px 20px;text-align:center;">

                  <!-- Ticket number badge -->
                  <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:10px;font-weight:900;color:${C.orange};text-transform:uppercase;letter-spacing:2px;">
                    TICKET ${idx + 1} OF ${tickets.length}
                  </p>

                  <!-- QR Code -->
                  ${qrBlock}

                  <!-- CTA Button -->
                  <div style="margin:4px 0 18px;">
                    <a href="${viewUrl}" target="_blank"
                       style="display:inline-block;background:${C.orange};color:${C.dark};text-decoration:none;font-family:Arial,sans-serif;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:12px 28px;border-radius:8px;border:2px solid ${C.dark};">
                      📱 Open Live Pass on Phone
                    </a>
                  </div>

                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0;">
                    <tr>
                      <td style="border-top:1px dashed ${C.border};font-size:0;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- Ticket metadata rows -->
                  <table width="100%" cellpadding="0" cellspacing="8" style="margin-top:14px;text-align:left;">
                    <tr>
                      <td style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${C.dimText};text-transform:uppercase;letter-spacing:1px;padding-bottom:2px;">Tier</td>
                      <td align="right" style="font-family:Arial,sans-serif;font-size:11px;font-weight:900;color:${C.cream};padding-bottom:2px;">${t.tierName}</td>
                    </tr>
                    <tr>
                      <td style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${C.dimText};text-transform:uppercase;letter-spacing:1px;padding-bottom:2px;">Price</td>
                      <td align="right" style="font-family:Arial,sans-serif;font-size:11px;font-weight:900;color:${C.lime};padding-bottom:2px;">${t.price > 0 ? naira(t.price) : 'FREE'}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="border-top:1px solid ${C.border};padding-top:8px;"></td>
                    </tr>
                    <tr>
                      <td style="font-family:monospace;font-size:9px;color:${C.dimText};padding-bottom:2px;">PASS ID</td>
                      <td align="right" style="font-family:monospace;font-size:9px;color:${C.muted};padding-bottom:2px;">${t.id}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Pass footer bar (perforated-style) -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${C.dark};border-top:2px dashed ${C.border};padding:8px 20px;text-align:center;font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${C.dimText};text-transform:uppercase;letter-spacing:2px;">
                  PERMANENT PASS &nbsp;✳&nbsp; NO DEVICE BINDING &nbsp;✳&nbsp; VERIFIED BY VYBETIX
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>`;
  }).join('');

  // ── Full email HTML ────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your Vybetix Ticket</title>
</head>
<body style="margin:0;padding:0;background:${C.dark};font-family:Arial,Helvetica,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.dark};padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Email card — max 600px -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.surface};border:2px solid ${C.border};border-radius:20px;overflow:hidden;">

          <!-- ══ HEADER BANNER ══ -->
          <tr>
            <td style="background:linear-gradient(135deg,${C.dark} 0%,#1a1b14 100%);border-bottom:2px solid ${C.orange};padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Brand bar -->
                <tr>
                  <td style="padding:24px 32px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:${C.cream};text-transform:uppercase;letter-spacing:-0.5px;">
                          VYBETIX<span style="color:${C.orange};margin-left:2px;">✳</span>
                        </td>
                        <td align="right" style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:2px;vertical-align:middle;">
                          LIVE TICKETING
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Hero text -->
                <tr>
                  <td style="padding:20px 32px 28px;">
                    <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.orange};text-transform:uppercase;letter-spacing:2px;">
                      PAYMENT CONFIRMED ✦ YOUR PASS IS READY
                    </p>
                    <h1 style="margin:0;font-family:Arial,sans-serif;font-size:34px;font-weight:900;color:${C.cream};text-transform:uppercase;letter-spacing:-1px;line-height:1.05;">
                      ${eventTitle}
                    </h1>
                    <p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.5;">
                      Hey <strong style="color:${C.cream};">${firstName}</strong>, you're in. Your gate pass${tickets.length > 1 ? 'es are' : ' is'} secured and ready to scan.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ══ EVENT DETAILS CARD ══ -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.dark};border:1.5px solid ${C.border};border-radius:14px;overflow:hidden;">

                <!-- Date column + info column -->
                <tr>
                  <!-- Date stamp -->
                  <td width="90" style="background:${C.orange};padding:20px 0;text-align:center;vertical-align:top;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;font-weight:900;color:${C.dark};text-transform:uppercase;letter-spacing:1px;">${ev.month}</p>
                    <p style="margin:4px 0;font-family:Arial,sans-serif;font-size:38px;font-weight:900;color:${C.dark};line-height:1;">${ev.date}</p>
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:${C.dark};">${ev.day}</p>
                  </td>
                  <!-- Event info -->
                  <td style="padding:16px 20px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${C.dimText};text-transform:uppercase;letter-spacing:1.5px;">
                      EVENT DETAILS
                    </p>
                    <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:14px;font-weight:900;color:${C.cream};line-height:1.2;">
                      ${eventTitle}
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family:Arial,sans-serif;font-size:11px;color:${C.muted};padding-bottom:4px;">
                          📍 &nbsp;<strong style="color:${C.cream};">${venue}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family:Arial,sans-serif;font-size:11px;color:${C.muted};">
                          🗓 &nbsp;<strong style="color:${C.cream};">${ev.full}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order total row -->
                <tr>
                  <td colspan="2" style="border-top:1px solid ${C.border};padding:10px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:${C.dimText};text-transform:uppercase;letter-spacing:1px;">
                          ${tickets.length} TICKET${tickets.length > 1 ? 'S' : ''} &nbsp;·&nbsp; ORDER TOTAL
                        </td>
                        <td align="right" style="font-family:Arial,sans-serif;font-size:14px;font-weight:900;color:${C.lime};">
                          ${totalKobo > 0 ? naira(totalKobo) : 'FREE'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ══ SECTION LABEL ══ -->
          <tr>
            <td style="padding:28px 32px 10px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${C.border};font-size:0;">&nbsp;</td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:10px;font-weight:900;color:${C.orange};text-transform:uppercase;letter-spacing:2px;">
                🎟 YOUR GATE ENTRY PASS${tickets.length > 1 ? 'ES' : ''}
              </p>
            </td>
          </tr>

          <!-- ══ TICKET PASS BLOCKS ══ -->
          <tr>
            <td style="padding:0 32px;">
              ${ticketBlocks}
            </td>
          </tr>

          <!-- ══ HOW TO USE ══ -->
          <tr>
            <td style="padding:4px 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.dark};border-left:4px solid ${C.lime};border-radius:0 10px 10px 0;padding:16px 20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:10px;font-weight:900;color:${C.lime};text-transform:uppercase;letter-spacing:1.5px;">
                      HOW TO USE YOUR PASS
                    </p>
                    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:12px;color:${C.muted};line-height:1.6;">
                      <strong style="color:${C.cream};">1.</strong> Open the <strong style="color:${C.cream};">"Open Live Pass on Phone"</strong> button above — bookmark it.
                    </p>
                    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:12px;color:${C.muted};line-height:1.6;">
                      <strong style="color:${C.cream};">2.</strong> Flash the <strong style="color:${C.cream};">QR code</strong> on your screen (or print it) at the venue gate.
                    </p>
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:${C.muted};line-height:1.6;">
                      <strong style="color:${C.cream};">3.</strong> No app, no login needed. Works from <strong style="color:${C.cream};">any device</strong>, any time.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ SECURITY NOTICE ══ -->
          <tr>
            <td style="padding:0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.dark};border:1px solid ${C.border};border-radius:10px;padding:14px 18px;">
                <tr>
                  <td style="font-family:Arial,sans-serif;font-size:11px;color:${C.dimText};line-height:1.6;">
                    🔒 <strong style="color:${C.cream};">Fraud-Proof Pass:</strong> Each QR is cryptographically HMAC-signed by Vybetix servers. Screen duplicates and forged passes fail the gate scanner automatically. Keep this email private.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ FOOTER ══ -->
          <tr>
            <td style="background:${C.dark};border-top:2px solid ${C.border};padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:18px;font-weight:900;color:${C.cream};text-transform:uppercase;letter-spacing:-0.5px;">
                VYBETIX<span style="color:${C.orange};">✳</span>
              </p>
              <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;color:${C.dimText};text-transform:uppercase;letter-spacing:2px;">
                LIVE TICKETING · NIGERIA
              </p>
              <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;color:${C.dimText};">
                Questions? <a href="mailto:hello@vybetix.com" style="color:${C.orange};text-decoration:none;font-weight:700;">hello@vybetix.com</a>
              </p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;color:#3f4038;">
                © 2026 Vybetix Platforms Ltd. Lagos &amp; Abuja, Nigeria.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

  // ── Attachments (QR code PNGs) ─────────────────────────────────────────────
  const attachments = tickets
    .filter(t => t.qrImageBase64)
    .map((t, i) => {
      const base64Data = t.qrImageBase64!.replace(/^data:image\/png;base64,/, '');
      return {
        filename: `Vybetix-Pass-${i + 1}-${t.tierName.toLowerCase().replace(/\s+/g, '-')}.png`,
        content: Buffer.from(base64Data, 'base64'),
      };
    });

  // ── Send ───────────────────────────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key_12345') {
    console.log(`[Mock Mailer] Would email "${email}" for "${eventTitle}" — ${tickets.length} ticket(s).`);
    return { success: true, mock: true };
  }

  try {
    const response = await resend.emails.send({
      from: (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('@'))
        ? process.env.RESEND_FROM_EMAIL
        : 'Vybetix <tickets@vybetix.com>',
      to: [email],
      subject: `🎟 Your pass for ${eventTitle} is confirmed!`,
      html,
      ...(attachments.length > 0 ? { attachments } : {}),
    });
    return { success: true, data: response };
  } catch (err) {
    console.error('[Mailer] Resend failure:', err);
    throw err;
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
  const ev = formatEventDate(eventDate);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Event Reminder</title></head>
<body style="margin:0;padding:0;background:${C.dark};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.dark};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.surface};border:2px solid ${C.border};border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:${C.dark};border-bottom:2px solid ${C.orange};padding:24px 32px;">
            <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:${C.cream};">VYBETIX<span style="color:${C.orange};">✳</span></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.orange};text-transform:uppercase;letter-spacing:2px;">⏰ EVENT REMINDER — TOMORROW</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:${C.cream};">Hey <strong>${name.split(' ')[0]}</strong>,</p>
            <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;color:${C.muted};line-height:1.6;">
              <strong style="color:${C.cream};">${eventTitle}</strong> is happening <strong style="color:${C.orange};">tomorrow</strong>. Make sure your pass is ready!
            </p>
            <table cellpadding="0" cellspacing="0" style="background:${C.dark};border:1px solid ${C.border};border-radius:12px;padding:16px 20px;margin-bottom:20px;">
              <tr><td style="font-family:Arial,sans-serif;font-size:12px;color:${C.muted};padding-bottom:6px;">📍 <strong style="color:${C.cream};">${venue}</strong></td></tr>
              <tr><td style="font-family:Arial,sans-serif;font-size:12px;color:${C.muted};">🗓 <strong style="color:${C.cream};">${ev.full}</strong></td></tr>
            </table>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:${C.muted};line-height:1.6;">
              Check your original confirmation email for your QR pass link, or find it in <strong style="color:${C.cream};">My Tickets</strong> on Vybetix. See you there!
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:${C.dark};border-top:1px solid ${C.border};padding:16px 32px;text-align:center;font-family:Arial,sans-serif;font-size:10px;color:#3f4038;">
            © 2026 Vybetix Platforms Ltd. &nbsp;·&nbsp; <a href="mailto:hello@vybetix.com" style="color:${C.orange};text-decoration:none;">hello@vybetix.com</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key_12345') {
    console.log(`[Mock Mailer] Reminder sent to ${email} for "${eventTitle}"`);
    return { success: true, mock: true };
  }

  return resend.emails.send({
    from: (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('@'))
      ? process.env.RESEND_FROM_EMAIL
      : 'Vybetix <tickets@vybetix.com>',
    to: [email],
    subject: `⏰ Reminder: ${eventTitle} is tomorrow — have your pass ready!`,
    html,
  });
}

/**
 * Sends a device unlock OTP email (kept for legacy routes, binding is now disabled).
 */
export async function sendDeviceUnlockOTP(email: string, name: string, otp: string, eventTitle: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Ticket Unlock</title></head>
<body style="margin:0;padding:0;background:${C.dark};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.dark};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.surface};border:2px solid ${C.border};border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:${C.dark};border-bottom:2px solid ${C.orange};padding:24px 32px;">
            <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:${C.cream};">VYBETIX<span style="color:${C.orange};">✳</span></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.orange};text-transform:uppercase;letter-spacing:2px;">🔐 DEVICE UNLOCK CODE</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:15px;color:${C.cream};">Hey <strong>${name.split(' ')[0]}</strong>,</p>
            <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.6;">
              You requested to view your ticket for <strong style="color:${C.cream};">${eventTitle}</strong> on a new device.
            </p>
            <div style="display:inline-block;background:${C.dark};border:2px solid ${C.orange};border-radius:12px;padding:20px 40px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${C.dimText};text-transform:uppercase;letter-spacing:2px;">YOUR AUTHORIZATION CODE</p>
              <p style="margin:0;font-family:'Courier New',monospace;font-size:36px;font-weight:900;color:${C.orange};letter-spacing:8px;">${otp}</p>
            </div>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:${C.dimText};">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:${C.dark};border-top:1px solid ${C.border};padding:16px 32px;text-align:center;font-family:Arial,sans-serif;font-size:10px;color:#3f4038;">
            © 2026 Vybetix Platforms Ltd. &nbsp;·&nbsp; <a href="mailto:hello@vybetix.com" style="color:${C.orange};text-decoration:none;">hello@vybetix.com</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key_12345') {
    console.log(`[Mock Mailer] OTP ${otp} sent to ${email}`);
    return { success: true, mock: true };
  }

  return resend.emails.send({
    from: (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('@'))
      ? process.env.RESEND_FROM_EMAIL
      : 'Vybetix <tickets@vybetix.com>',
    to: [email],
    subject: `🔐 Your Vybetix unlock code — ${eventTitle}`,
    html,
  });
}


