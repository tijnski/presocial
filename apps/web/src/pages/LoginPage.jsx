import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Wallet, X, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { web3Login, isWeb3Available, Web3AuthError } from '../services/web3Auth';

function LoginPage() {
  const [loginMethod, setLoginMethod] = useState(null); // null, 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [web3Loading, setWeb3Loading] = useState(false);

  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWeb3Login = async () => {
    setError('');

    if (!isWeb3Available()) {
      setError('MetaMask or compatible wallet not found. Please install MetaMask to use Web3 login.');
      return;
    }

    setWeb3Loading(true);

    try {
      const result = await web3Login();
      // Use loginWithToken if available, otherwise store directly with correct keys
      if (typeof loginWithToken === 'function') {
        await loginWithToken(result.token, result.user);
      } else {
        // Use presuite_token for consistency across all PreSuite services
        localStorage.setItem('presuite_token', result.token);
        localStorage.setItem('presuite_user', JSON.stringify(result.user));
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Web3AuthError ? err.message : 'Web3 login failed. Please try again.');
    } finally {
      setWeb3Loading(false);
    }
  };

  const resetLoginMethod = () => {
    setLoginMethod(null);
    setError('');
    setEmail('');
    setPassword('');
    setWeb3Loading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#0a0f1a' }}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(2, 61, 135, 0.4) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 16, 33, 0.6) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Login Card - Always dark gradient (presearch-web style) */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 p-8 rounded-lg"
        style={{
          background: 'linear-gradient(45deg, #023d87, #001021)',
        }}
      >
        {/* Close button when in a login method */}
        {loginMethod && (
          <button
            onClick={resetLoginMethod}
            className="absolute top-4 right-4 text-white/60 hover:opacity-60 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Logo & Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          {!loginMethod && (
            <Link
              to="/"
              className="text-white/60 hover:opacity-60 transition-opacity"
            >
              <X className="w-5 h-5" />
            </Link>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-xl text-white mb-2">
            {loginMethod === 'email' ? 'Log in with Email' : 'Log In.'}
          </h1>
          <p className="text-sm text-gray-300 font-light">
            {loginMethod === 'email'
              ? 'Enter your credentials to access your account'
              : 'Sign in to access PreSocial and join the conversation.'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-3 bg-red-500/15 border border-red-500/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Login Method Selection */}
        {!loginMethod && (
          <div className="flex flex-col space-y-2">
            {/* Email Login Button */}
            <button
              onClick={() => setLoginMethod('email')}
              className="bg-gray-100 font-semibold text-sm text-black w-full justify-center p-2.5 rounded-md flex items-center hover:opacity-60 transition-opacity"
            >
              <Mail className="mr-2 w-5 h-5" />
              <span>Log in with Email</span>
            </button>

            {/* Web3 Login Button */}
            <button
              onClick={handleWeb3Login}
              disabled={web3Loading}
              className="bg-gray-100 font-semibold text-sm text-black w-full justify-center p-2.5 rounded-md flex items-center hover:opacity-60 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {web3Loading ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  <span>Connecting wallet...</span>
                </>
              ) : (
                <>
                  <Wallet className="mr-2 w-5 h-5" />
                  <span>Log in with Web3</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-xs text-gray-400">New to PreSocial?</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Get PreMail Button */}
            <a
              href="https://presuite.eu/register"
              className="bg-[#0190FF] font-semibold text-sm text-white w-full justify-center p-2.5 rounded-md flex items-center hover:opacity-60 transition-opacity"
            >
              <Mail className="mr-2 w-5 h-5" />
              <span>Get a @premail.site address</span>
            </a>
          </div>
        )}

        {/* Email Login Form */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-white mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@premail.site"
                required
                autoFocus
                className="w-full p-2.5 px-3 rounded-md outline-none bg-gray-100 text-black placeholder-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-white mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full p-2.5 px-3 pr-10 rounded-md outline-none bg-gray-100 text-black placeholder-gray-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <a
                href="https://presuite.eu/forgot-password"
                className="text-xs text-[#0190FF] hover:opacity-60 transition-opacity"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md font-semibold text-white text-sm transition-opacity hover:opacity-60 disabled:opacity-50 disabled:cursor-not-allowed bg-[#0190FF]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Log in'
              )}
            </button>

            <button
              type="button"
              onClick={resetLoginMethod}
              className="w-full py-2 text-sm text-gray-300 hover:opacity-60 transition-opacity"
            >
              ← Back to login options
            </button>
          </form>
        )}

        {/* Footer text */}
        {!loginMethod && (
          <div className="text-xs text-gray-400 mt-6 text-center">
            <p>
              By logging in you agree to our{' '}
              <a href="/terms" className="text-[#0190FF] underline hover:opacity-60 transition-opacity">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-[#0190FF] underline hover:opacity-60 transition-opacity">Privacy Policy</a>.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">
            Privacy-first social discussions
          </span>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;
