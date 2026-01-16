/**
 * PreSocial Auth Service
 * Connects to PreSuite Hub for centralized authentication
 */

const AUTH_API_URL = import.meta.env.PROD
  ? 'https://presuite.eu/api/auth'
  : 'https://presuite.eu/api/auth';

const TOKEN_KEY = 'presuite_token';
const USER_KEY = 'presuite_user';

// Refresh token when it expires in less than this many seconds
const TOKEN_REFRESH_THRESHOLD = 60 * 60; // 1 hour before expiry

/**
 * Parse JWT token without verification (for client-side expiry checking)
 */
function parseJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpiring(token) {
  if (!token) return true;

  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now < TOKEN_REFRESH_THRESHOLD;
}

/**
 * Check if token is completely expired
 */
export function isTokenExpired(token) {
  if (!token) return true;

  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Get token expiration time in seconds from now
 */
export function getTokenExpiresIn(token) {
  if (!token) return 0;

  const payload = parseJWT(token);
  if (!payload || !payload.exp) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

/**
 * Login via PreSuite Hub
 */
export async function login(email, password) {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Invalid credentials');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data;
}

/**
 * Register via PreSuite Hub
 */
export async function register({ email, password, name }) {
  const response = await fetch(`${AUTH_API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, source: 'presocial' })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Registration failed');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data;
}

/**
 * Logout
 */
export async function logout() {
  const token = getToken();

  if (token) {
    try {
      await fetch(`${AUTH_API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      // Ignore logout errors
    }
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Get stored token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user
 */
export function getStoredUser() {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Refresh the current token
 * Calls the verify endpoint which issues a fresh token if valid
 */
export async function refreshToken() {
  const token = getToken();
  if (!token) return null;

  // Don't try to refresh if completely expired
  if (isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }

  try {
    const response = await fetch(`${AUTH_API_URL}/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }

    const data = await response.json();

    // If server returns a new token, update it
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }

    // Update stored user if changed
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data.user;
  } catch {
    return null;
  }
}

/**
 * Verify token with server
 * Will attempt refresh if token is expiring soon
 */
export async function verifyToken() {
  const token = getToken();
  if (!token) return null;

  // Check if token is completely expired
  if (isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }

  // If token is about to expire, try to refresh it
  if (isTokenExpiring(token)) {
    console.debug('[Auth] Token expiring soon, attempting refresh...');
    return refreshToken();
  }

  // Token is still valid, just verify it
  try {
    const response = await fetch(`${AUTH_API_URL}/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Setup automatic token refresh
 * Call this on app initialization to keep tokens fresh
 */
export function setupTokenRefresh(onTokenRefreshed, onTokenExpired) {
  const checkAndRefresh = async () => {
    const token = getToken();
    if (!token) return;

    if (isTokenExpired(token)) {
      // Token is completely expired
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (onTokenExpired) onTokenExpired();
      return;
    }

    if (isTokenExpiring(token)) {
      // Token is expiring soon, refresh it
      const user = await refreshToken();
      if (user && onTokenRefreshed) {
        onTokenRefreshed(user);
      } else if (!user && onTokenExpired) {
        onTokenExpired();
      }
    }
  };

  // Check immediately
  checkAndRefresh();

  // Check every 5 minutes
  const intervalId = setInterval(checkAndRefresh, 5 * 60 * 1000);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

export default {
  login,
  register,
  logout,
  getToken,
  getStoredUser,
  isAuthenticated,
  verifyToken,
  refreshToken,
  isTokenExpired,
  isTokenExpiring,
  getTokenExpiresIn,
  setupTokenRefresh
};
