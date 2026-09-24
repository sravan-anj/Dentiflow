/**
 * ResetPasswordPage.tsx — Secure Password Reset UI
 *
 * Requirements:
 * - Token is automatically extracted from URL search query (?token=TOKEN).
 * - NO "Reset Token" manual input field is shown in the UI.
 * - Token is validated against server on mount.
 * - Displays:
 *     Create New Password
 *     - New Password
 *     - Confirm New Password
 *     - [Save New Password]
 *     - Back to Sign In
 * - Displays success state and redirects to Sign In upon completion.
 */

import React, { useState, useEffect } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { AuthService } from '../../utils/authService';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

interface ResetPasswordPageProps {
  onNavigateSignIn: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateLanding: () => void;
}

type Status = 'validating' | 'ready' | 'submitting' | 'success' | 'invalid_token';

function extractTokenFromLocation(): string {
  if (typeof window === 'undefined') return '';

  const clean = (val: string): string => {
    try {
      val = decodeURIComponent(val);
    } catch {}
    return val.replace(/[.,\s\/>\)"']+$/, '').replace(/^[<"'\s]+/, '').trim();
  };

  // 1. Search Query (?token=...)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get('token') || searchParams.get('reset_token') || searchParams.get('t');
    if (fromSearch) return clean(fromSearch);
  } catch {}

  // 2. Hash Query (#/reset-password?token=... or #token=...)
  try {
    const hash = window.location.hash;
    if (hash.includes('token=')) {
      const queryPart = hash.includes('?') ? hash.split('?')[1] : hash.substring(1);
      const hashParams = new URLSearchParams(queryPart);
      const fromHash = hashParams.get('token') || hashParams.get('reset_token') || hashParams.get('t');
      if (fromHash) return clean(fromHash);
    }
  } catch {}

  // 3. Fallback regex on window.location.href
  try {
    const match = window.location.href.match(/[?&#]token=([^&#]+)/i);
    if (match && match[1]) {
      return clean(match[1]);
    }
  } catch {}

  return '';
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onNavigateSignIn,
  onNavigateForgotPassword,
  onNavigateLanding,
}) => {
  const [token, setToken] = useState<string>(extractTokenFromLocation);
  const [status, setStatus] = useState<Status>('validating');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);

  // Sync token from URL if it updates
  useEffect(() => {
    const extracted = extractTokenFromLocation();
    if (extracted && extracted !== token) {
      setToken(extracted);
    }
  }, [token]);

  // Validate token on mount and token changes
  useEffect(() => {
    const activeToken = token || extractTokenFromLocation();
    if (!activeToken || !activeToken.trim()) {
      setStatus('invalid_token');
      setErrorMsg('This password reset link is invalid or missing. Please request a new one.');
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const result = await AuthService.validateResetToken(activeToken);
        if (!isMounted) return;

        if (result.valid) {
          setStatus('ready');
          setErrorMsg('');
        } else {
          setStatus('invalid_token');
          setErrorMsg(result.error || 'This password reset link is invalid or has expired.');
        }
      } catch {
        if (!isMounted) return;
        // In case of network blip, allow form to be ready
        setStatus('ready');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Automatic redirect timer when status changes to 'success'
  useEffect(() => {
    if (status !== 'success') return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onNavigateSignIn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, onNavigateSignIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const activeToken = token || extractTokenFromLocation();
    if (!activeToken) {
      setErrorMsg('Missing password reset token. Please request a new link.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setStatus('submitting');

    try {
      const result = await AuthService.completePasswordReset(activeToken, newPassword);

      if (!result.success) {
        setErrorMsg(result.error || 'This password reset link is invalid or has expired.');
        setStatus('ready');
        return;
      }

      // Clear token from URL query string after successful reset
      if (typeof window !== 'undefined' && window.history) {
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch (_) {}
      }

      setStatus('success');
    } catch {
      setErrorMsg('Unable to reset password. Please try again.');
      setStatus('ready');
    }
  };

  const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen bg-[#F5F3EF] text-[#252525] relative flex flex-col justify-between overflow-x-hidden font-sans antialiased">
      {/* Video Background with Frost Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#F5F3EF] w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full min-w-full min-h-full max-w-none max-h-none object-cover object-center origin-center scale-[1.10] block filter brightness-[1.05] contrast-[1.02] opacity-35"
          poster="/realistic_human_molar.png"
        >
          <source src="/Denti video3.2.mp4" type="video/mp4" />
          <source src="/Denti video3.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F3EF]/70 via-[#F7F5F1]/50 to-[#F5F3EF]/80 pointer-events-none" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full px-6 py-5 max-w-7xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateLanding}
          className="group flex items-center gap-2 text-xs font-bold text-[#252525] px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md hover:border-[#C8B58D] hover:bg-white transition-all duration-200 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#C8B58D] group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Back to DentiFlow Showcase</span>
        </button>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-[#EDE8DE] border border-[#C8B58D]/30 text-[#252525] flex items-center justify-center font-black">
            <ToothIcon size={16} />
          </div>
          <span className="text-sm font-black font-display tracking-tight text-[#252525]">
            DENTIFLOW
          </span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-6 my-auto flex flex-col items-center">
        <div className="w-full bg-white/85 border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_18px_55px_rgba(60,55,45,0.08)] backdrop-blur-2xl relative overflow-hidden text-[#252525]">
          {children}
        </div>
        <div className="mt-5 text-center text-[11px] text-[#6F6D69] flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8FA88D]" />
          <span>Protected with cryptographic token validation &amp; PBKDF2 hashing</span>
        </div>
      </main>
      <div className="h-4" />
    </div>
  );

  // 1. Validating Token Loading State
  if (status === 'validating') {
    return (
      <PageWrapper>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <KeyRound className="w-6 h-6 text-[#C8B58D]" />
          </div>
          <h2 className="text-lg font-bold text-[#252525] mb-2">
            Verifying Reset Link...
          </h2>
          <p className="text-xs text-[#6F6D69] mb-4">
            Checking cryptographic token authorization and expiry.
          </p>
          <div className="w-6 h-6 border-2 border-[#C8B58D] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </PageWrapper>
    );
  }

  // 2. Invalid or Expired Token State
  if (status === 'invalid_token') {
    return (
      <PageWrapper>
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-[#B97870]/10 border border-[#B97870]/30 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <AlertCircle className="w-7 h-7 text-[#B97870]" />
          </div>
          <h2 className="text-xl font-extrabold text-[#252525] font-display tracking-tight mb-2">
            Invalid or Expired Link
          </h2>
          <p className="text-xs text-[#6F6D69] mb-6">
            {errorMsg || 'This password reset link is invalid or has expired. Password reset links are valid for 30 minutes and can only be used once.'}
          </p>

          <button
            type="button"
            onClick={onNavigateForgotPassword}
            className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs mb-3"
          >
            <KeyRound className="w-4 h-4 text-[#C8B58D]" />
            <span>Request New Reset Link</span>
            <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
          </button>

          <button
            type="button"
            onClick={onNavigateSignIn}
            className="w-full py-3 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs rounded-xl border border-stone-200/80 bg-white/80 hover:bg-white text-[#252525] font-bold transition shadow-2xs"
          >
            <span>Back to Sign In</span>
          </button>
        </div>
      </PageWrapper>
    );
  }

  // 3. Success State
  if (status === 'success') {
    return (
      <PageWrapper>
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F0E8] border border-[#8FA88D]/30 flex items-center justify-center mx-auto mb-4 shadow-xs animate-bounce">
            <CheckCircle2 className="w-7 h-7 text-[#8FA88D]" />
          </div>
          <h2 className="text-xl font-extrabold text-[#252525] font-display tracking-tight mb-2">
            Your password has been reset successfully!
          </h2>
          <p className="text-xs text-[#6F6D69] mb-4">
            Your new password is saved. You can now sign in with your updated credentials.
          </p>

          <div className="mb-6 p-3 rounded-xl bg-[#EDE8DE]/70 border border-[#C8B58D]/30 flex items-center justify-center gap-2 text-xs font-semibold text-[#594723]">
            <span className="w-3.5 h-3.5 border-2 border-[#C8B58D] border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Redirecting to Sign In in <strong className="text-[#252525] font-bold">{countdown}s</strong>...</span>
          </div>

          <button
            type="button"
            onClick={onNavigateSignIn}
            className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
          </button>
        </div>
      </PageWrapper>
    );
  }

  // 4. Create New Password Form
  return (
    <PageWrapper>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <KeyRound className="w-6 h-6 text-[#C8B58D]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#252525] font-display tracking-tight">
          Create New Password
        </h1>
        <p className="text-xs text-[#6F6D69] font-medium mt-1">
          Set a secure new password for your DentiFlow account.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-[#B97870]/10 border border-[#B97870]/30 text-[#632924] text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#B97870] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-[#252525] mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              disabled={status === 'submitting'}
              autoComplete="new-password"
              className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6D69] hover:text-[#252525] transition cursor-pointer p-1"
              aria-label="Toggle password visibility"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-[#252525] mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              disabled={status === 'submitting'}
              autoComplete="new-password"
              className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6D69] hover:text-[#252525] transition cursor-pointer p-1"
              aria-label="Toggle password visibility"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs shadow-sm"
        >
          {status === 'submitting' ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving New Password…</span>
            </>
          ) : (
            <>
              <span>Save New Password</span>
              <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-stone-200/80 flex items-center justify-between text-xs text-[#6F6D69]">
        <button
          type="button"
          onClick={onNavigateSignIn}
          className="hover:text-[#252525] transition cursor-pointer underline underline-offset-4 decoration-[#C8B58D]/60"
        >
          ← Back to Sign In
        </button>

        <button
          type="button"
          onClick={onNavigateForgotPassword}
          className="hover:text-[#252525] transition cursor-pointer underline underline-offset-4 decoration-[#C8B58D]/60"
        >
          Request new reset link
        </button>
      </div>
    </PageWrapper>
  );
};
