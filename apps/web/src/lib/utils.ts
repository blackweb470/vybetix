import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

/**
 * Combines Tailwind CSS classes safely using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a kobo value (integer) to a beautiful Naira string.
 * Example: 1500000 kobo -> ₦15,000
 */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(naira).replace('NGN', '₦');
}

/**
 * Formats standard ISO timestamps to readable Nigerian date formats.
 * Example: "2026-05-17T20:00:00Z" -> "Sun, May 17, 2026"
 */
export function formatDate(dateString: string, pattern: string = 'EEE, MMM d, yyyy'): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), pattern);
  } catch (e) {
    return dateString;
  }
}

/**
 * Formats standard ISO timestamps to readable Nigerian time formats.
 * Example: "2026-05-17T20:00:00Z" -> "08:00 PM"
 */
export function formatTime(dateString: string, pattern: string = 'hh:mm a'): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), pattern);
  } catch (e) {
    return dateString;
  }
}

