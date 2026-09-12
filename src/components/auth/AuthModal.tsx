import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loginWithGoogleRedirect, loginAsGuest, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isNetlifyDomain = currentHost.includes('netlify.app') || currentHost.includes('ai-nexoraa');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setUnauthorizedDomain(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }
    } else if (mode === 'login') {
      if (!password) {
        setError('Please enter your password.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'signup') {
        await registerWithEmail(email, password, name);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg(`If an account exists for ${email}, a password reset link has been dispatched.`);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Authentication failed. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your credentials or sign up.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try signing in with this email.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please sign up below.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was dismissed.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setUnauthorizedDomain(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Google sign-in popup was closed. Click below to retry or use Instant Guest Access.');
        return;
      }

      console.error('Google Sign In Error:', err);

      if (err.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(currentHost || 'ai-nexoraa.netlify.app');
        setError(`Domain Authorization Needed: "${currentHost || 'ai-nexoraa.netlify.app'}" must be whitelisted in Firebase Console.`);
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups or use redirect login below.');
        return;
      }
      setError(err.message || 'Google sign in encountered an issue. You can also sign in with Email or Instant Guest Mode.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setError(null);
    setUnauthorizedDomain(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(currentHost || 'ai-nexoraa.netlify.app');
        setError(`Domain Authorization Needed: "${currentHost || 'ai-nexoraa.netlify.app'}" must be whitelisted in Firebase Console.`);
      } else {
        console.error('Google Redirect Sign In Error:', err);
        setError(err.message || 'Redirect sign-in failed. Please use Email or Guest mode.');
      }
      setIsSubmitting(false);
    }
  };

  const copyHostDomain = () => {
    const domain = currentHost || 'ai-nexoraa.netlify.app';
    navigator.clipboard.writeText(domain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    onClose();
  };

  const fillDemoAccount = () => {
    setEmail('demo@nexora.ai');
    setPassword('Nexora2026!');
    setName('Nexora Explorer');
    if (mode === 'signup') {
      setConfirmPassword('Nexora2026!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#101524] border border-slate-700/80 shadow-2xl overflow-hidden p-6 sm:p-8 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#090e1a] ring-1 ring-indigo-500/40 shadow-xl shadow-indigo-600/30 mx-auto mb-3 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Nexora Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' && 'Welcome to Nexora'}
            {mode === 'signup' && 'Create your Nexora Account'}
            {mode === 'forgot' && 'Reset your Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Log in to access your persistent chats, documents & workspace.'}
            {mode === 'signup' && 'Get started with intelligent AI writing, document analysis & notes.'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Instant Access Banner for Netlify Visitors */}
        <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/30 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Instant Workspace Access
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              No Password Needed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug mb-2.5">
            Want to start writing immediately? Enter as a guest with full AI document and chat powers.
          </p>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            <span>Launch Workspace as Guest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>

            {unauthorizedDomain && (
              <div className="mt-2 p-3 rounded-lg bg-slate-900/95 border border-slate-700 text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Authorize Domain in Firebase (1-Minute Fix):</span>
                </div>
                <ol className="text-[11px] list-decimal list-inside space-y-1 text-slate-400">
                  <li>Open <strong>Firebase Console</strong> for your project.</li>
                  <li>Go to <strong>Authentication &rarr; Settings &rarr; Authorized domains</strong>.</li>
                  <li>Click <strong>Add domain</strong> and paste:</li>
                </ol>
                <div className="flex items-center gap-2 pt-1">
                  <code className="px-2 py-1 rounded bg-black/70 border border-slate-700 text-indigo-300 font-mono text-[11px] select-all flex-1 truncate">
                    {unauthorizedDomain}
                  </code>
                  <button
                    type="button"
                    onClick={copyHostDomain}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedDomain ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Can't edit Firebase now?</span>
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="text-[11px] font-bold text-indigo-300 hover:text-white underline"
                  >
                    Click here to enter as Guest &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        {mode !== 'forgot' && (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-xs active:scale-[0.99] disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <div className="mt-1.5 text-center">
              <button
                type="button"
                onClick={handleGoogleRedirectLogin}
                className="text-[11px] text-slate-500 hover:text-indigo-300 underline transition-colors"
              >
                Popup blocked or on mobile? Try Redirect Login
              </button>
            </div>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Or with Email
              </span>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>
          </>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
              >
                Fill Demo Email
              </button>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all mt-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switchers */}
        <div className="mt-5 text-center text-xs text-slate-400 space-y-2">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Sign up free
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Log in
              </button>
            </p>
          ) : (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Back to Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
