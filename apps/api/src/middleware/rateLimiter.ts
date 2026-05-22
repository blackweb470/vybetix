import rateLimit from 'express-rate-limit';

// Standard rate limit for ticket scanning endpoints to prevent QR brute force guessing
export const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 ticket scan checks per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Scan limit exceeded: Too many scanning requests. Please slow down.'
  }
});

// rate limiter for checkouts and payments to protect payment gateway integrations from spamming
export const checkoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // Limit each IP to 15 checkouts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Checkout limit exceeded: Too many order checkouts initiated. Please wait 5 minutes.'
  }
});
