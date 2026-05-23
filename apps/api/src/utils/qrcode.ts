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
 * Decodes a ticket's secure token, validates its cryptographical HMAC seal, and extracts elements.
 * @returns Object containing ticketId and timestamp if valid, null otherwise.
 */
export function verifyQRToken(token: string): { ticketId: string; timestamp: number } | null {
  try {
    const securePayload = Buffer.from(token, 'base64').toString('utf-8');
    const parts = securePayload.split(':');
    
    if (parts.length !== 3) {
      return null;
    }

    const [ticketId, timestampStr, hmac] = parts;
    const rawPayload = `${ticketId}:${timestampStr}`;

    // List of secrets to test for backward compatibility
    const secretsToTest = [
      QR_SECRET,
      'vibetix_super_secret_crypto_key_2026',
      'Vybetix_super_secret_crypto_key_2026',
      'VibeTix_super_secret_crypto_key_2026'
    ];

    for (const secret of secretsToTest) {
      const expectedHmac = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
      
      const hmacBuf = Buffer.from(hmac);
      const expectedBuf = Buffer.from(expectedHmac);

      if (hmacBuf.length === expectedBuf.length && crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
        return {
          ticketId,
          timestamp: parseInt(timestampStr, 10)
        };
      }
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

