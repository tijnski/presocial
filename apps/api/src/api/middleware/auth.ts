// PreSocial JWT Authentication Middleware
// Verifies JWT tokens issued by PreSuite Hub

import { Context, Next } from 'hono';
import * as jose from 'jose';

// JWT configuration from environment
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'presuite';
const AUTH_API_URL = process.env.AUTH_API_URL || 'https://presuite.eu/api/auth';

// Check if JWT_SECRET is configured at startup
if (!JWT_SECRET) {
  console.warn('[Auth] Warning: JWT_SECRET not configured. Token verification will fall back to remote validation.');
}

export interface JWTPayload {
  sub: string;           // User ID
  org_id?: string;       // Organization ID
  email: string;         // User email
  name?: string;         // Display name
  iss: string;           // Issuer (should be 'presuite')
  iat: number;           // Issued at
  exp: number;           // Expiration time
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  org_id?: string;
}

/**
 * Verify JWT token locally using shared secret
 */
async function verifyTokenLocally(token: string): Promise<JWTPayload | null> {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
    });

    // Validate required fields
    if (!payload.sub || !payload.email) {
      console.warn('[Auth] Token missing required fields');
      return null;
    }

    return payload as unknown as JWTPayload;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      console.debug('[Auth] Token expired');
    } else if (error instanceof jose.errors.JWTInvalid) {
      console.warn('[Auth] Invalid token signature');
    } else {
      console.error('[Auth] Token verification failed:', error);
    }
    return null;
  }
}

/**
 * Verify JWT token remotely via PreSuite API
 * Fallback when JWT_SECRET is not available
 */
async function verifyTokenRemotely(token: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${AUTH_API_URL}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.valid && data.user) {
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        org_id: data.user.org_id,
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] Remote token verification failed:', error);
    return null;
  }
}

/**
 * Extract and verify JWT token from Authorization header
 * Tries local verification first, falls back to remote if JWT_SECRET not configured
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  // Try local verification first (faster, no network call)
  const localPayload = await verifyTokenLocally(token);
  if (localPayload) {
    return {
      id: localPayload.sub,
      email: localPayload.email,
      name: localPayload.name,
      org_id: localPayload.org_id,
    };
  }

  // Fall back to remote verification
  return verifyTokenRemotely(token);
}

/**
 * Extract user from context (set by authMiddleware)
 */
export function getAuthUser(c: Context): AuthUser | null {
  return c.get('user') as AuthUser | null;
}

/**
 * Extract user ID from context
 */
export function getAuthUserId(c: Context): string | null {
  const user = getAuthUser(c);
  return user?.id || null;
}

/**
 * Authentication middleware - validates JWT and sets user in context
 * Use this for routes that require authentication
 */
export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.slice(7); // Remove 'Bearer '
    const user = await verifyToken(token);

    if (!user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Set user in context for route handlers
    c.set('user', user);

    await next();
  };
}

/**
 * Optional authentication middleware - validates JWT if present but doesn't require it
 * Use this for routes that work differently for authenticated users
 */
export function optionalAuthMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const user = await verifyToken(token);
      if (user) {
        c.set('user', user);
      }
    }

    await next();
  };
}

/**
 * Check if JWT_SECRET is configured (for health checks)
 */
export function isLocalAuthEnabled(): boolean {
  return !!JWT_SECRET;
}
