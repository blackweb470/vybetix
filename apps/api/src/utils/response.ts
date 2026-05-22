import { Response } from 'express';

/**
 * Standardized successful API response handler.
 */
export function success(res: Response, data?: any, message?: string, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Standardized error API response handler.
 */
export function error(res: Response, errorStr: string, message?: string, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: errorStr,
    message
  });
}
