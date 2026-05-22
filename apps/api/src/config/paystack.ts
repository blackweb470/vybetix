import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_secret_key_12345';

export const paystackConfig = {
  secretKey: PAYSTACK_SECRET,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json'
  }
};

/**
 * High-fidelity, type-safe wrapper for the Paystack payment gateway APIs.
 */
export const paystackClient = {
  /**
   * Initializes a transaction.
   * @param email Customer's email
   * @param amount Amount in kobo (e.g. 5000 Naira = 500000 Kobo)
   * @param reference Unique order reference
   * @param callbackUrl Redirect URL after payment completion
   */
  initializeTransaction: async (email: string, amount: number, reference: string, callbackUrl: string) => {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: paystackConfig.headers,
        body: JSON.stringify({
          email,
          amount,
          reference,
          callback_url: callbackUrl
        })
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Failed to initialize Paystack transaction');
      }

      return {
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference
      };
    } catch (error: any) {
      console.error('Paystack Initialize Transaction Error:', error);
      throw error;
    }
  },

  /**
   * Verifies a transaction status by reference.
   * @param reference Transaction reference string
   */
  verifyTransaction: async (reference: string) => {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: paystackConfig.headers
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Failed to verify Paystack transaction');
      }

      return {
        status: data.data.status, // 'success', 'failed', 'abandoned', etc.
        amount: data.data.amount,
        reference: data.data.reference,
        email: data.data.customer.email,
        metadata: data.data.metadata
      };
    } catch (error: any) {
      console.error('Paystack Verify Transaction Error:', error);
      throw error;
    }
  },

  /**
   * Creates a subaccount on Paystack.
   * @param businessName Name of the business/organizer
   * @param settlementBank Bank code (e.g. '058' for GTB)
   * @param accountNumber 10-digit account number
   */
  createSubaccount: async (businessName: string, settlementBank: string, accountNumber: string) => {
    try {
      const response = await fetch('https://api.paystack.co/subaccount', {
        method: 'POST',
        headers: paystackConfig.headers,
        body: JSON.stringify({
          business_name: businessName,
          settlement_bank: settlementBank,
          account_number: accountNumber,
          percentage_charge: 10 // Platform takes 10% commission
        })
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Failed to create Paystack subaccount');
      }

      return data.data as {
        subaccount_code: string;
        business_name: string;
        settlement_bank: string;
        account_number: string;
      };
    } catch (error: any) {
      console.error('Paystack Create Subaccount Error:', error);
      throw error;
    }
  },

  /**
   * Updates an existing subaccount on Paystack.
   * @param subaccountCode Paystack subaccount identifier (e.g. ACCT_xxxx)
   * @param businessName Name of the business/organizer
   * @param settlementBank Bank code (e.g. '058' for GTB)
   * @param accountNumber 10-digit account number
   */
  updateSubaccount: async (subaccountCode: string, businessName: string, settlementBank: string, accountNumber: string) => {
    try {
      const response = await fetch(`https://api.paystack.co/subaccount/${subaccountCode}`, {
        method: 'PUT',
        headers: paystackConfig.headers,
        body: JSON.stringify({
          business_name: businessName,
          settlement_bank: settlementBank,
          account_number: accountNumber
        })
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Failed to update Paystack subaccount');
      }

      return data.data;
    } catch (error: any) {
      console.error('Paystack Update Subaccount Error:', error);
      throw error;
    }
  }
};
