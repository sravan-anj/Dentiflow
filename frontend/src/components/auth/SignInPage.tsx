import React, { useState, useEffect } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { User, UserRole } from '../../types';
import { SecurityService } from '../../utils/security';
import { AuthService } from '../../utils/authService';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface SignInPageProps {
  onLogin: (user: User) => void;
  onNavigateLanding: () => void;
  onNavigateSignUp: () => void;
  onNavigateForgotPassword?: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onLogin,
  onNavigateLanding,
  onNavigateSignUp,
  onNavigateForgotPassword,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Monitor workstation security lockout
  useEffect(() => {
    const checkLockout = () => {
      const status = SecurityService.getLockoutStatus();
      if (status.isLockedOut) {
        setLockoutRemaining(status.remainingSeconds);
        setError(`Terminal Suspended: Too many failed security attempts. Wait ${status.remainingSeconds}s.`);
      } else {
        setLockoutRemaining(0);
        setError(prev => (prev.startsWith('Terminal Suspended') || prev.startsWith('Security Lockout') ? '' : prev));
      }
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetLockout = () => {
    SecurityService.clearFailedAttempts();
    setLockoutRemaining(0);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;
    setError('');

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setError('Please enter your email, phone number, or account ID.');
      return;
    }

    if (!cleanPass) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate via server-side API — role is determined exclusively by server database
      const result = await AuthService.login(cleanId, cleanPass);

      if (!result.success || !result.user) {
        setIsLoading(false);
        const lockStatus = SecurityService.getLockoutStatus();
        if (lockStatus.isLockedOut) {
          setError(`Security Lockout: 3 failed attempts. Operatory terminal secured for ${lockStatus.remainingSeconds}s.`);
          setLockoutRemaining(lockStatus.remainingSeconds);
        } else {
          setError(result.error || 'Invalid credentials. Please check your details and try again.');
        }
        return;
      }

      setIsLoading(false);
      onLogin(result.user);
    } catch {
      setIsLoading(false);
      setError('Unable to authenticate. Please check your network connection.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#252525] relative flex flex-col justify-between overflow-x-hidden font-sans antialiased">
      {/* SINGLE FIXED FULL-SCREEN LOOPING DENTAL VIDEO BACKGROUND WITH WARM IVORY FROST */}
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

      {/* Top Header Navbar */}
      <header className="relative z-10 w-full px-6 py-5 max-w-7xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateLanding}
          className="group flex items-center gap-2 text-xs font-bold text-[#252525] px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md hover:border-[#C8B58D] hover:bg-white transition-all duration-200 cursor-pointer shadow-xs"
        >
          <ToothIcon size={14} className="text-[#C8B58D]" />
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

      {/* Main Form Center Box */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-6 my-auto flex flex-col items-center">
        <div className="w-full bg-white/85 border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_18px_55px_rgba(60,55,45,0.08)] backdrop-blur-2xl relative overflow-hidden text-[#252525]">

          <div className="text-center mb-6 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 text-[#252525] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <KeyRound className="w-6 h-6 text-[#C8B58D]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#252525] font-display tracking-tight">
              Sign In to DentiFlow
            </h1>
            <p className="text-xs text-[#6F6D69] font-medium mt-1">
              Enter your credentials to access your clinical or patient account
            </p>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#B97870]/10 border border-[#B97870]/30 text-[#632924] text-xs flex items-start justify-between gap-2 backdrop-blur-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#B97870] shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {lockoutRemaining > 0 && (
                <button
                  type="button"
                  onClick={handleResetLockout}
                  className="shrink-0 text-[10px] font-bold text-[#8FA88D] bg-white/90 hover:bg-white border border-[#8FA88D]/40 px-2 py-0.5 rounded-md cursor-pointer transition shadow-2xs"
                >
                  Unlock Now
                </button>
              )}
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div>
              <label className="block text-xs font-bold text-[#252525] mb-1.5">
                Email, Phone Number, or Doctor / Admin ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. doctor@gmail.com, DOC-4482, or +91 98765 43210"
                  disabled={lockoutRemaining > 0 || isLoading}
                  autoComplete="username"
                  className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#252525]">
                  Password
                </label>
                {onNavigateForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-[11px] text-[#594723] hover:text-[#252525] font-semibold transition cursor-pointer underline underline-offset-2 decoration-[#C8B58D]/60 hover:decoration-[#C8B58D]"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={lockoutRemaining > 0 || isLoading}
                  autoComplete="current-password"
                  className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6D69] hover:text-[#252525] transition cursor-pointer p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={lockoutRemaining > 0 || isLoading}
              className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Workstation</span>
                  <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
                </>
              )}
            </button>
          </form>

          {/* Social Auth Divider & Google Sign-In */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200/90" />
            </div>
            <div className="relative bg-white px-3 text-[10px] font-bold text-[#8C8880] uppercase tracking-widest">
              or
            </div>
          </div>

          <div className="flex justify-center pb-1">
            <GoogleSignInButton onError={(msg) => setError(msg)} />
          </div>

          {/* Switch to Sign Up */}
          <div className="mt-6 pt-4 border-t border-stone-200/80 text-center">
            <p className="text-xs text-[#6F6D69]">
              New patient without a registered chart?{' '}
              <button
                type="button"
                onClick={onNavigateSignUp}
                className="text-[#252525] hover:text-[#594723] font-bold transition ml-1 cursor-pointer underline underline-offset-4 decoration-[#C8B58D]/60 hover:decoration-[#C8B58D]"
              >
                Create Account →
              </button>
            </p>
          </div>

        </div>

        {/* Security Assurance Footer */}
        <div className="mt-5 text-center text-[11px] text-[#6F6D69] flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8FA88D]" />
          <span>Server-verified RBAC with PBKDF2 encryption &amp; audit logging</span>
        </div>
      </main>

      <div className="h-4" />
    </div>
  );
};
