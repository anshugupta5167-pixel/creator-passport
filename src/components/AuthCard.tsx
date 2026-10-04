'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import CHQLogo from './CHQLogo';
import { cacheAuthHint } from '@/lib/clientAuth';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup' | 'forgot' | 'verify';
  onSuccess?: (user: any, creator?: any) => void;
  defaultEmail?: string;
  defaultUsername?: string;
}

export default function AuthCard({
  initialMode = 'signin',
  onSuccess,
  defaultEmail = '',
  defaultUsername = '',
}: AuthCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'verify'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState(defaultEmail);
  const [username, setUsername] = useState(defaultUsername);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [demoCodeNotice, setDemoCodeNotice] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const getPostAuthPath = () => {
    if (typeof window === 'undefined') return '/';
    const requestedPath = new URLSearchParams(window.location.search).get('next');
    return requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || 'Failed to sign in. Please verify your credentials.');
      }

      cacheAuthHint(data.user, data.creator);
      if (data.creator && typeof window !== 'undefined') {
        try {
          localStorage.setItem('creatorhq_user_card', JSON.stringify(data.creator));
        } catch (e) {}
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creatorhq_auth_updated', {
          detail: { user: data.user, creator: data.creator }
        }));
      }
      setSuccessMsg('Welcome back!');
      if (onSuccess) onSuccess(data.user, data.creator);
      else if (typeof window !== 'undefined') router.replace(getPostAuthPath());
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setErrorMsg('Valid email address is required.');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || 'Failed to register account.');
      }

      if (data.demoVerificationCode) {
        setDemoCodeNotice(data.demoVerificationCode);
      }

      cacheAuthHint(data.user, data.creator);
      if (data.creator && typeof window !== 'undefined') {
        try {
          localStorage.setItem('creatorhq_user_card', JSON.stringify(data.creator));
        } catch (e) {}
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creatorhq_auth_updated', {
          detail: { user: data.user, creator: data.creator }
        }));
      }
      setSuccessMsg('Account created successfully!');
      if (onSuccess) onSuccess(data.user, data.creator);
      else if (typeof window !== 'undefined') router.replace(getPostAuthPath());
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || 'Failed to process password reset.');
      }

      setSuccessMsg(data.message || 'Password reset instructions have been generated.');
      if (data.resetToken) {
        setDemoCodeNotice(`Reset Token: ${data.resetToken}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!verifyCode.trim()) {
      setErrorMsg('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: verifyCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || 'Invalid or expired code.');
      }

      setSuccessMsg('Email verified successfully! You are all set.');
      setTimeout(() => {
        if (onSuccess) {
          if (data.user) onSuccess(data.user);
        } else if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Container with Matte Graphite Theme */}
      <div className="relative rounded-3xl bg-[#0e1217] border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner mb-2">
            <CHQLogo size="sm" showText={false} />
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-tight font-sans">
            {mode === 'signin' && 'Sign in to CreatorHQ'}
            {mode === 'signup' && 'Create your Creator Account'}
            {mode === 'forgot' && 'Reset your Password'}
            {mode === 'verify' && 'Verify your Email'}
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-400">
            {mode === 'signin' && 'Access your verified Creator Studio & digital passport'}
            {mode === 'signup' && 'Join the private network for authentic creator talent'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
            {mode === 'verify' && 'Enter the 6-digit confirmation code sent to your email'}
          </p>
        </div>

        {/* Tab switchers for Sign In / Sign Up */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#07090c] border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                resetMessages();
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-sky-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                resetMessages();
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-sky-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {demoCodeNotice && (
          <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-500/40 text-sky-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Verification Code Generated:</span>
            </div>
            <p className="font-mono text-sm tracking-wider font-extrabold text-white bg-black/40 px-2 py-1 rounded inline-block">
              {demoCodeNotice}
            </p>
          </div>
        )}

        {/* ================= SIGN IN FORM ================= */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@creatorhq.fun or username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090c] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    resetMessages();
                  }}
                  className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090c] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-chq-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-60 transition-all cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= SIGN UP FORM ================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Display Name (Channel or Public Name)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoComplete="username"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Apex Gaming TV"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090c] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Username (Your Unique Handle)
              </label>
              <div className="relative">
                <span className="text-sky-400 font-mono font-bold text-xs absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="apexgaming"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#07090c] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Your profile URL: https://creatorhq.fun/{username || 'username'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090c] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Password (min 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090c] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-chq-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-60 transition-all cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= FORGOT PASSWORD ================= */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@creatorhq.fun"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090c] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-chq-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-60 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send Recovery Instructions</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  resetMessages();
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Stamp */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Encrypted Session • Server-Side Ownership Protected</span>
        </div>

      </div>
    </div>
  );
}
