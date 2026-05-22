import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Extend Express Request type to support our user object
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'buyer' | 'organizer' | 'admin';
  };
}

/**
 * Validates incoming Bearer token against Supabase auth service and attaches the resolved user.
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied: Missing or malformed Authorization header'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase auth service
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied: Invalid or expired token'
      });
    }

    // Fetch matching user's database role and metadata from public schema
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('role, is_banned')
      .eq('id', user.id)
      .single();

    if (dbError || !dbUser) {
      return res.status(401).json({
        success: false,
        error: 'Access denied: Local user profile not established'
      });
    }

    if (dbUser.is_banned) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Your account has been suspended'
      });
    }

    // Attach verified user profile
    req.user = {
      id: user.id,
      email: user.email || '',
      role: dbUser.role as 'buyer' | 'organizer' | 'admin'
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Access denied: Authentication failure',
      message: error.message
    });
  }
}

