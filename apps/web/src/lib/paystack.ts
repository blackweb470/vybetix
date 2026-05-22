import PaystackPop from '@paystack/inline-js';

export interface PaystackCheckoutOptions {
  email: string;
  amount: number; // In kobo
  reference: string;
  accessCode?: string;
  onSuccess: (transaction: any) => void;
  onCancel: () => void;
}

/**
 * Triggers the standard Paystack Inline Popup inside the buyer's browser.
 */
export function openPaystackCheckout(options: PaystackCheckoutOptions) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_mock_public_key_12345';
  
  try {
    const paystack = new PaystackPop();
    const config: any = {
      key: publicKey,
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
    } else {
      config.email = options.email;
      config.amount = options.amount;
      config.ref = options.reference;
      config.currency = 'NGN';
    }

    paystack.newTransaction(config);
  } catch (err) {
    console.error('Failed to boot Paystack Popup checkout:', err);
    alert('Failed to boot payment gateway. Please ensure your network connection is stable.');
  }
}
