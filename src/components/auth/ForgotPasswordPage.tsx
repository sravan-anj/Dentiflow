/**
 * ForgotPasswordPage.tsx
 *
 * Password reset initiation UI.
 * User enters registered email. The backend generates a 32-byte secure token,
 * stores its SHA-256 hash, and dispatches the reset link email via Resend/SMTP.
 *
 * SECURITY:
 * - The reset token is generated and stored server-side ONLY.
 * - No token is returned in the API response or shown to the user.
 * - Response message is generic to prevent email enumeration.
 */

import React, { useState } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { AuthService } from '../../utils/authService';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigateSignIn: () => void;
  onNavigateLanding: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateSignIn,
  onNavigateLanding,
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.initiatePasswordReset(trimmedEmail);

      if (!res.success && res.error) {
        setError(res.error);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Unable to connect to the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#252525] relative flex flex-col justify-between overflow-x-hidden font-sans antialiased">
      {/* Background Video with Frost Overlay */}
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

      {/* Header */}
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

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-6 my-auto flex flex-col items-center">
        <div className="w-full bg-white/85 border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_18px_55px_rgba(60,55,45,0.08)] backdrop-blur-2xl relative overflow-hidden text-[#252525]">

          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <KeyRound className="w-6 h-6 text-[#C8B58D]" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#252525] font-display tracking-tight">
                  Forgot Password?
                </h1>
                <p className="text-xs text-[#6F6D69] font-medium mt-1">
                  Enter your registered email address to receive a secure password reset link.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-[#B97870]/10 border border-[#B97870]/30 text-[#632924] text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#B97870] shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. patient@gmail.com"
                      disabled={isLoading}
                      autoComplete="email"
                      className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Reset Link…</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-stone-200/80 text-center">
                <p className="text-xs text-[#6F6D69]">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={onNavigateSignIn}
                    className="text-[#252525] hover:text-[#594723] font-bold transition ml-1 cursor-pointer underline underline-offset-4 decoration-[#C8B58D]/60"
                  >
                    Sign In →
                  </button>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F0E8] border border-[#8FA88D]/30 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <CheckCircle2 className="w-7 h-7 text-[#8FA88D]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#252525] font-display tracking-tight mb-2">
                Check Your Email
              </h2>
              <p className="text-xs text-[#6F6D69] mb-2">
                If an account exists for{' '}
                <span className="font-bold text-[#252525]">{email}</span>,
                password reset instructions have been sent.
              </p>
              <p className="text-xs text-[#6F6D69] mb-6">
                Click the button inside the email to create your new password.
                The link is valid for <strong>30 minutes</strong> and can only be used once.
              </p>

              <button
                type="button"
                onClick={onNavigateSignIn}
                className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs mb-3"
              >
                <span>Back to Sign In</span>
                <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
              </button>

              <button
                type="button"
                onClick={() => { setSubmitted(false); setEmail(''); setError(''); }}
                className="text-xs text-[#6F6D69] hover:text-[#252525] transition cursor-pointer underline underline-offset-4 decoration-[#C8B58D]/60"
              >
                Send to a different email address
              </button>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-5 text-center text-[11px] text-[#6F6D69] flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8FA88D]" />
          <span>Reset links are cryptographically random, single-use, and expire in 30 minutes</span>
        </div>
      </main>

      <div className="h-4" />
    </div>
  );
};
