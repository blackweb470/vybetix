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

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Controller managing VibeTix customer and organizer authentication.
 */
export const authController = {
  /**
   * Registers a new user. Registers in Supabase auth.users, triggering public.users sync,
   * then updates the user's role and phone number inside public.users.
   */
  register: async (req: Request, res: Response) => {
    try {
      const parsedBody = registerSchema.parse(req.body);
      
      // 1. Register in Supabase auth service
      const { data: authData, error: authError } = await supabase.auth.signUp({
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

      // 2. Update role and phone in public.users database (synced by trigger, but this updates customized values)
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .update({
          role: parsedBody.role,
          phone: parsedBody.phone,
          full_name: parsedBody.fullName
        })
        .eq('id', userId)
        .select()
        .single();

      if (dbError) {
        // Rollback auth registration if profile sync failed
        await supabase.auth.admin.deleteUser(userId);
        return error(res, 'Profile sync failed', dbError.message, 500);
      }

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

      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
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
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
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
   * Logouts the active user session.
   */
  logout: async (req: Request, res: Response) => {
    try {
      const { error: logoutError } = await supabase.auth.signOut();
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
          .single();
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
        // Fetch current profile to get existing paystack_subaccount_code
        const { data: currentProfile } = await supabase
          .from('organizer_profiles')
          .select('*')
          .eq('user_id', req.user.id)
          .single();

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

        const { data: profile, error: profileError } = await supabase
          .from('organizer_profiles')
          .update({
            business_name: businessName,
            bank_name: parsedBankName,
            account_number: accountNumber,
            account_name: accountName,
            paystack_subaccount_code: subaccountCode
          })
          .eq('user_id', req.user.id)
          .select()
          .single();

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
