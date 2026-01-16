/**
 * PreSocial Auth Service
 * Connects to PreSuite Hub for centralized authentication
 */

const AUTH_API_URL = import.meta.env.PROD
  ? 'https://presuite.eu/api/auth'
  : 'https://presuite.eu/api/auth';

const TOKEN_KEY = 'presuite_token';
const USER_KEY = 'presuite_user';

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
 * Verify token with server
 */
export async function verifyToken() {
  const token = getToken();
  if (!token) return null;

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

export default {
  login,
  register,
  logout,
  getToken,
  getStoredUser,
  isAuthenticated,
  verifyToken
};
