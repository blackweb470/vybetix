export interface PaystackCheckoutOptions {
  email: string;
  amount: number; // In kobo
  reference: string;
  accessCode?: string;
  authorizationUrl?: string;
  onSuccess: (transaction: any) => void;
  onCancel: () => void;
}

/**
 * Triggers the standard Paystack Inline Popup inside the buyer's browser.
 * Loads @paystack/inline-js dynamically to avoid SSR "window is not defined" build crashes.
 */
export async function openPaystackCheckout(options: PaystackCheckoutOptions) {
  if (typeof window === 'undefined') return;

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_mock_public_key_12345';

  try {
    const mod = await import('@paystack/inline-js');
    const PaystackPop = (mod as any).default || mod;
    const paystack = new (PaystackPop as any)();
    const config: any = {
      key: publicKey,
      email: options.email,
      amount: options.amount,
      ref: options.reference,
      currency: 'NGN',
      onSuccess: (transaction: any) => {
        console.log('Paystack transaction successful:', transaction);
        options.onSuccess(transaction);
      },
      onCancel: () => {
        console.log('Paystack transaction was cancelled by the buyer.');
        options.onCancel();
      }
    };

    if (options.accessCode) {
      config.accessCode = options.accessCode;
    }

    paystack.newTransaction(config);
  } catch (err) {
    console.error('Failed to boot Paystack Popup checkout:', err);
    if (options.authorizationUrl) {
      window.location.href = options.authorizationUrl;
      return;
    }
    if (typeof alert !== 'undefined') {
      alert('Failed to boot payment gateway. Please ensure your network connection is stable.');
    }
  }
}
