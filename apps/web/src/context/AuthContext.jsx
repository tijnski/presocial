import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle token expiration
  const handleTokenExpired = useCallback(() => {
    console.debug('[Auth] Token expired, logging out');
    setUser(null);
  }, []);

  // Handle token refresh success
  const handleTokenRefreshed = useCallback((refreshedUser) => {
    console.debug('[Auth] Token refreshed successfully');
    setUser(refreshedUser);
  }, []);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        // Verify token is still valid (this also handles refresh if needed)
        const verifiedUser = await authService.verifyToken();
        if (verifiedUser) {
          setUser(verifiedUser);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Setup automatic token refresh
    const cleanup = authService.setupTokenRefresh(
      handleTokenRefreshed,
      handleTokenExpired
    );

    // Cleanup on unmount
    return cleanup;
  }, [handleTokenExpired, handleTokenRefreshed]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async ({ email, password, name }) => {
    const data = await authService.register({ email, password, name });
    setUser(data.user);
    return data;
  };

  /**
   * Login with existing token and user data
   * Used for Web3 login and other external auth methods
   */
  const loginWithToken = async (token, user) => {
    // Store token and user in localStorage
    localStorage.setItem('presuite_token', token);
    localStorage.setItem('presuite_user', JSON.stringify(user));
    // Update context state
    setUser(user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    loginWithToken,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
