import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Extend Express Request type to support our user object
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'buyer' | 'organizer' | 'admin' | 'gate_staff';
  };
}

// ─── In-Memory User Profile Cache ─────────────────────────────────────────────
// Caches DB role+ban lookups so every authenticated request doesn't hit Supabase.
// TTL: 5 minutes. Evict an entry via clearUserCache() on ban/role changes.
interface CachedUserRecord {
  role: 'buyer' | 'organizer' | 'admin' | 'gate_staff';
  is_banned: boolean;
  cachedAt: number; // Unix ms
}

const USER_CACHE = new Map<string, CachedUserRecord>();
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Call this whenever a user's role or ban status changes to force a fresh DB fetch on next request. */
export function clearUserCache(userId: string) {
  USER_CACHE.delete(userId);
  console.log(`[AuthCache] Cache evicted for user ${userId}`);
}

/**
 * Validates incoming Bearer token against Supabase auth service and attaches the resolved user.
 * The DB role/ban lookup is cached in-memory for 5 minutes to reduce database round-trips.
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

    // ── Cache-first DB lookup ─────────────────────────────────────────────────
    const now = Date.now();
    const cached = USER_CACHE.get(user.id);
    let dbUser: CachedUserRecord;

    if (cached && now - cached.cachedAt < USER_CACHE_TTL_MS) {
      // Cache HIT — skip the DB round-trip
      dbUser = cached;
    } else {
      // Cache MISS — fetch from Supabase and store in cache
      const { data: freshUser, error: dbError } = await supabase
        .from('users')
        .select('role, is_banned')
        .eq('id', user.id)
        .single();

      if (dbError || !freshUser) {
        return res.status(401).json({
          success: false,
          error: 'Access denied: Local user profile not established'
        });
      }

      dbUser = { ...freshUser, cachedAt: now };
      USER_CACHE.set(user.id, dbUser);
    }
    // ──────────────────────────────────────────────────────────────────────────

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
      role: dbUser.role as 'buyer' | 'organizer' | 'admin' | 'gate_staff'
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
