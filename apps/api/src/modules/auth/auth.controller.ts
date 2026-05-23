import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';
import { paystackClient } from '../../config/paystack';

// 1. Zod Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  phone: z.string().regex(/^\+234[789][01]\d{8}$/, 'Nigerian phone number must match format: +2348012345678'),
  role: z.enum(['buyer', 'organizer'] as const).default('buyer'),
  business_name: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  account_name: z.string().optional()
});

import { createClient } from '@supabase/supabase-js';

// Create a dedicated auth client so we don't pollute the global service-role client with user sessions
const authClient = createClient(
  process.env.SUPABASE_URL as string,
  (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) as string,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Controller managing Vybetix customer and organizer authentication.
 */
export const authController = {
  /**
   * Registers a new user. Registers in Supabase auth.users, triggering public.users sync,
   * then updates the user's role and phone number inside public.users.
   */
  register: async (req: Request, res: Response) => {
    try {
      const parsedBody = registerSchema.parse(req.body);
      
      // 1. Register in Supabase auth service using dedicated auth client
      const { data: authData, error: authError } = await authClient.auth.signUp({
        email: parsedBody.email,
        password: parsedBody.password,
        options: {
          data: {
            full_name: parsedBody.fullName,
            phone: parsedBody.phone
          }
        }
      });

      if (authError || !authData.user) {
        return error(res, 'Signup failed', authError?.message || 'Could not create auth session', 400);
      }

      const userId = authData.user.id;

      // 2. Wait for the Supabase trigger to sync the new auth user into public.users
      // The trigger is asynchronous — retry up to 6 times over 3 seconds
      let dbUser: any = null;
      let dbError: any = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const result = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        if (result.data) {
          dbUser = result.data;
          break;
        }
        dbError = result.error;
      }

      if (!dbUser) {
        // Trigger never ran — rollback the auth user
        await supabase.auth.admin.deleteUser(userId);
        return error(res, 'Profile sync failed', dbError?.message || 'User record was not created in time. Please try again.', 500);
      }

      // 3. Now update role, phone, and full_name on the synced row
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          role: parsedBody.role,
          phone: parsedBody.phone,
          full_name: parsedBody.fullName
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        await supabase.auth.admin.deleteUser(userId);
        return error(res, 'Profile sync failed', updateError.message, 500);
      }

      dbUser = updatedUser;

      // If user registered as an organizer, initialize the organizer profile
      if (parsedBody.role === 'organizer') {
        let parsedBankCode = '';
        let parsedBankName = parsedBody.bank_name || 'Access Bank PLC';

        if (parsedBody.bank_name && parsedBody.bank_name.includes(':')) {
          const parts = parsedBody.bank_name.split(':');
          parsedBankCode = parts[0];
          parsedBankName = parts.slice(1).join(':');
        }

        // Create paystack subaccount if possible
        let subaccountCode = null;
        if (parsedBody.business_name && parsedBankCode && parsedBody.account_number) {
          try {
            const subaccount = await paystackClient.createSubaccount(
              parsedBody.business_name,
              parsedBankCode,
              parsedBody.account_number
            );
            subaccountCode = subaccount.subaccount_code;
          } catch (paystackError) {
            console.error('Failed to create Paystack subaccount during register:', paystackError);
          }
        }

        const { error: profileError } = await supabase
          .from('organizer_profiles')
          .insert({
            user_id: userId,
            business_name: parsedBody.business_name || `${parsedBody.fullName} Events`,
            bank_name: parsedBankName,
            account_number: parsedBody.account_number || '0000000000',
            account_name: parsedBody.account_name || parsedBody.fullName,
            paystack_subaccount_code: subaccountCode,
            verified: false
          });

        if (profileError) {
          console.error('Organizer profile setup error:', profileError);
        }
      }

      return success(res, {
        user: dbUser,
        session: authData.session
      }, 'User registered successfully!', 201);

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return error(res, 'Validation failed', err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400);
      }
      console.error('Register error:', err);
      return error(res, 'Registration error', err.message, 500);
    }
  },

  /**
   * Logins a user and returns a Supabase JWT.
   */
  login: async (req: Request, res: Response) => {
    try {
      const parsedBody = loginSchema.parse(req.body);

      // 1. Authenticate with Supabase Auth using dedicated auth client
      const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email: parsedBody.email,
        password: parsedBody.password
      });

      if (authError || !authData.user || !authData.session) {
        return error(res, 'Authentication failed', authError?.message || 'Invalid credentials', 400);
      }

      // 2. Fetch full public user record
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError || !dbUser) {
        return error(res, 'Profile missing', 'Could not locate matched public user record', 400);
      }

      if (dbUser.is_banned) {
        return error(res, 'Access denied', 'Your account has been suspended', 403);
      }

      return success(res, {
        user: dbUser,
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at, // Unix timestamp (seconds)
        expiresIn: authData.session.expires_in
      }, 'Login completed successfully!');

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return error(res, 'Validation failed', err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400);
      }
      console.error('Login error:', err);
      return error(res, 'Login error', err.message, 500);
    }
  },

  /**
   * Initiates Google OAuth authentication URL callback endpoints.
   */
  googleOAuth: async (req: Request, res: Response) => {
    try {
      const { data, error: oauthError } = await authClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
        }
      });

      if (oauthError) {
        return error(res, 'Google OAuth failed', oauthError.message, 400);
      }

      return success(res, { url: data.url }, 'Google OAuth initiated successfully');
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      return error(res, 'OAuth setup error', err.message, 500);
    }
  },

  /**
   * Silently refreshes an expired access token using the stored refresh token.
   * This prevents users from being auto-logged out after the 1-hour JWT expiry.
   */
  refreshSession: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return error(res, 'Refresh failed', 'Missing refresh token', 400);
      }

      const { data, error: refreshError } = await authClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (refreshError || !data.session) {
        return error(res, 'Session expired', 'Could not refresh session — please log in again', 401);
      }

      return success(res, {
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      }, 'Session refreshed successfully');
    } catch (err: any) {
      console.error('Refresh session error:', err);
      return error(res, 'Refresh error', err.message, 500);
    }
  },

  /**
   * Logouts the active user session.
   */
  logout: async (req: Request, res: Response) => {
    try {
      const { error: logoutError } = await authClient.auth.signOut();
      if (logoutError) {
        return error(res, 'Logout failed', logoutError.message, 400);
      }
      return success(res, null, 'Logged out successfully');
    } catch (err: any) {
      console.error('Logout error:', err);
      return error(res, 'Logout error', err.message, 500);
    }
  },

  /**
   * Retrieves profile details of the current authenticated user session.
   */
  getCurrentUser: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'User context not found', 401);
      }

      // Fetch user and organize profile details if organizer
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (dbError || !dbUser) {
        return error(res, 'Profile error', 'Could not locate matching user profile', 404);
      }

      let organizerProfile = null;
      if (dbUser.role === 'organizer') {
        const { data: profile } = await supabase
          .from('organizer_profiles')
          .select('*')
          .eq('user_id', dbUser.id)
          .maybeSingle();
        organizerProfile = profile;
      }

      return success(res, {
        ...dbUser,
        organizerProfile
      }, 'Current user retrieved successfully');
    } catch (err: any) {
      console.error('Get profile error:', err);
      return error(res, 'Profile error', err.message, 500);
    }
  },

  /**
   * Updates profile details of the current authenticated user session.
   */
  updateProfile: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'User context not found', 401);
      }

      const { fullName, phone, businessName, bankName, accountNumber, accountName } = req.body;

      // Update public.users database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone: phone
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (dbError) {
        return error(res, 'Profile update failed', dbError.message, 500);
      }

      // If user is organizer, also update organizer_profiles
      let organizerProfile = null;
      if (dbUser.role === 'organizer') {
        // Fetch current profile to get existing paystack_subaccount_code safely
        const { data: currentProfile } = await supabase
          .from('organizer_profiles')
          .select('*')
          .eq('user_id', req.user.id)
          .maybeSingle();

        let parsedBankCode = '';
        let parsedBankName = bankName || '';

        if (bankName && bankName.includes(':')) {
          const parts = bankName.split(':');
          parsedBankCode = parts[0];
          parsedBankName = parts.slice(1).join(':');
        }

        let subaccountCode = currentProfile?.paystack_subaccount_code;

        if (businessName && parsedBankCode && accountNumber) {
          try {
            if (!subaccountCode) {
              const subaccount = await paystackClient.createSubaccount(
                businessName,
                parsedBankCode,
                accountNumber
              );
              subaccountCode = subaccount.subaccount_code;
            } else {
              await paystackClient.updateSubaccount(
                subaccountCode,
                businessName,
                parsedBankCode,
                accountNumber
              );
            }
          } catch (paystackError: any) {
            console.error('Failed to sync Paystack subaccount:', paystackError);
            return error(res, 'Bank verification failed', paystackError.message || 'Could not verify bank account with Paystack', 400);
          }
        }

        const profilePayload: any = {
          user_id: req.user.id,
          business_name: businessName,
          bank_name: parsedBankName,
          account_number: accountNumber,
          account_name: accountName
        };

        if (subaccountCode) {
          profilePayload.paystack_subaccount_code = subaccountCode;
        }

        let { data: profile, error: profileError } = await supabase
          .from('organizer_profiles')
          .upsert(profilePayload, { onConflict: 'user_id' })
          .select()
          .single();

        // Fallback in case the paystack_subaccount_code column is not yet migrated in database
        if (profileError && (profileError.message?.includes('paystack_subaccount_code') || profileError.code === 'PGRST204')) {
          console.warn('[Profile Update] paystack_subaccount_code column missing in database. Retrying without it...');
          delete profilePayload.paystack_subaccount_code;
          const retryResult = await supabase
            .from('organizer_profiles')
            .upsert(profilePayload, { onConflict: 'user_id' })
            .select()
            .single();
          profile = retryResult.data;
          profileError = retryResult.error;
        }

        if (profileError) {
          console.error('Organizer profile update error:', profileError);
        } else {
          organizerProfile = profile;
        }
      }

      return success(res, {
        ...dbUser,
        organizerProfile
      }, 'Profile updated successfully');
    } catch (err: any) {
      console.error('Update profile error:', err);
      return error(res, 'Update profile error', err.message, 500);
    }
  }
};

