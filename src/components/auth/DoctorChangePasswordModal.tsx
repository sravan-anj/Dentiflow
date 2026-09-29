import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, ArrowRight, CheckCircle2, AlertCircle, KeyRound, X } from 'lucide-react';
import { AuthService } from '../../utils/authService';
import { User } from '../../types';

interface DoctorChangePasswordModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onPasswordChanged: (updatedUser: User) => void;
}

export const DoctorChangePasswordModal: React.FC<DoctorChangePasswordModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onPasswordChanged
}) => {
  const [step, setStep] = useState<'prompt' | 'form'>('prompt');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleStartChange = () => {
    setError('');
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      setError('Please enter a new password.');
      return;
    }

    if (cleanPass.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (cleanPass === 'doctor123') {
      setError('Your new password cannot be the default clinic password. Please choose a different password.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.updatePassword(cleanPass);
      if (!result.success) {
        setIsLoading(false);
        setError(result.message || 'Failed to update password. Please try again.');
        return;
      }

      setSuccessMessage('Password updated successfully! Your account is now secured.');
      setIsLoading(false);

      const updatedUser: User = {
        ...currentUser,
        mustChangePassword: false
      };

      setTimeout(() => {
        onPasswordChanged(updatedUser);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'An error occurred while updating your password.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#FDFBF7] text-[#252525] rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-[0_20px_60px_rgba(0,0,0,0.25)] relative overflow-hidden font-sans">
        {/* Subtle decorative header accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C8B58D] via-[#A89369] to-[#C8B58D]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close modal"
          className="absolute right-4 top-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'prompt' ? (
          /* Step 1: Initial Prompt Screen */
          <div className="text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/40 text-[#252525] flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7 text-[#A89369]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B5A36] bg-[#EDE8DE] px-3 py-1 rounded-full border border-[#C8B58D]/40">
                Security Advisory
              </span>
              <h2 id="password-modal-title" className="text-2xl font-black text-[#252525] font-display tracking-tight mt-3">
                Secure Your Account
              </h2>
              <p className="text-xs text-[#6F6D69] mt-2 leading-relaxed">
                Welcome, <strong>{currentUser.name}</strong>. You are currently signed in with your administrator-defined default password. For clinical record security and compliance, please create a personal password.
              </p>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 leading-normal">
                Setting a private password ensures only you have access to your clinician portal and patient charts.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-stone-300/80 bg-white hover:bg-stone-50 text-[#6F6D69] hover:text-[#252525] text-xs font-bold transition cursor-pointer"
              >
                Later
              </button>

              <button
                type="button"
                onClick={handleStartChange}
                className="btn-primary w-full sm:w-1/2 py-3 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <span>Change Password</span>
                <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Password Change Form */
          <div className="pt-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[#C8B58D]" />
              </div>
              <div>
                <h2 id="password-modal-title" className="text-lg font-black text-[#252525] font-display">
                  Create Personal Password
                </h2>
                <p className="text-[11px] text-[#6F6D69]">
                  Enter a new secure password for your clinician account
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#B97870]/10 border border-[#B97870]/30 text-[#632924] text-xs flex items-start gap-2 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 text-[#B97870] shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    disabled={isLoading || !!successMessage}
                    className="w-full bg-white border border-stone-200/80 rounded-xl pl-9 pr-9 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F6D69] hover:text-[#252525] p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    disabled={isLoading || !!successMessage}
                    className="w-full bg-white border border-stone-200/80 rounded-xl pl-9 pr-9 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F6D69] hover:text-[#252525] p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('prompt')}
                  disabled={isLoading || !!successMessage}
                  className="w-1/3 py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-[#6F6D69] text-xs font-bold transition cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !!successMessage}
                  className="btn-primary w-2/3 py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Securing...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Password</span>
                      <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
