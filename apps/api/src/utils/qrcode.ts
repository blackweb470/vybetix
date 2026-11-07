import crypto from 'crypto';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

const QR_SECRET = process.env.QR_SECRET || 'Vybetix_super_secret_crypto_key_2026';

/**
 * Encodes a ticket's UUID with a timestamp and seals it using HMAC-SHA256.
 * Format: base64(ticketId + ':' + timestamp + ':' + HMAC-SHA256(ticketId + ':' + timestamp, QR_SECRET))
 */
export function generateQRToken(ticketId: string): string {
  const timestamp = Date.now().toString();
  const rawPayload = `${ticketId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', QR_SECRET).update(rawPayload).digest('hex');
  const securePayload = `${rawPayload}:${hmac}`;

  return Buffer.from(securePayload).toString('base64');
}

/**
 * Generates a permanent cryptographically sealed ticket token for email delivery and public pass viewing.
 * Format: base64(ticketId + ':pass:' + HMAC-SHA256(ticketId + ':pass', QR_SECRET))
 */
export function generatePermanentQRToken(ticketId: string): string {
  const rawPayload = `${ticketId}:pass`;
  const hmac = crypto.createHmac('sha256', QR_SECRET).update(rawPayload).digest('hex');
  const securePayload = `${rawPayload}:${hmac}`;

  return Buffer.from(securePayload).toString('base64');
}

/**
 * Decodes a ticket's secure token, validates its cryptographical HMAC seal, and extracts elements.
 * Supports both dynamic rotating tokens and permanent email/PDF ticket passes.
 * @returns Object containing ticketId and timestamp if valid, null otherwise.
 */
export function verifyQRToken(token: string): { ticketId: string; timestamp: number } | null {
  try {
    if (!token) return null;
    const cleanToken = token.trim().replace(/ /g, '+');

    // 1. Direct UUID match (e.g. if scanned by ticket ID or manual lookup)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(cleanToken)) {
      return {
        ticketId: cleanToken,
        timestamp: 0
      };
    }

    // 2. Cryptographic HMAC token
    const securePayload = Buffer.from(cleanToken, 'base64').toString('utf-8');
    const parts = securePayload.split(':');

    if (parts.length !== 3) {
      return null;
    }

    const [ticketId, tokenTypeOrTime, hmac] = parts;
    const rawPayload = `${ticketId}:${tokenTypeOrTime}`;

    const expectedHmac = crypto.createHmac('sha256', QR_SECRET).update(rawPayload).digest('hex');

    const hmacBuf = Buffer.from(hmac);
    const expectedBuf = Buffer.from(expectedHmac);

    if (hmacBuf.length === expectedBuf.length && crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
      // Permanent pass (email or web view link) — valid as long as ticket status is active in database
      if (tokenTypeOrTime === 'pass' || tokenTypeOrTime === 'permanent') {
        return {
          ticketId,
          timestamp: 0
        };
      }

      const tokenTime = parseInt(tokenTypeOrTime, 10);
      return {
        ticketId,
        timestamp: isNaN(tokenTime) ? 0 : tokenTime
      };
    }

    return null;
  } catch (error) {
    console.error('QR Verification error:', error);
    return null;
  }
}

/**
 * Takes a token string and returns a base64 PNG data URL of the QR code.
 */
export async function generateQRImage(token: string): Promise<string> {
  try {
    // Generates a base64 encoded PNG data URL
    return await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 800
    });
  } catch (error) {
    console.error('Failed to generate QR Image:', error);
    throw error;
  }
}

