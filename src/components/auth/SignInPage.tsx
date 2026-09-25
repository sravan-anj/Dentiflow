import React, { useState, useEffect } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { User, UserRole } from '../../types';
import { SecurityService } from '../../utils/security';
import { StorageService } from '../../utils/storage';
import { AuthService } from '../../utils/authService';
import {
  ArrowLeft,
  KeyRound,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface SignInPageProps {
  onLogin: (user: User) => void;
  onNavigateLanding: () => void;
  onNavigateSignUp: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onLogin,
  onNavigateLanding,
  onNavigateSignUp
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [oralixId, setOralixId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Monitor security lockout
  useEffect(() => {
    const checkLockout = () => {
      const status = SecurityService.getLockoutStatus();
      if (status.isLockedOut) {
        setLockoutRemaining(status.remainingSeconds);
        setError(`Terminal Suspended: Too many failed security attempts. Wait ${status.remainingSeconds}s.`);
      } else {
        setLockoutRemaining(0);
      }
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;
    setError('');

    const cleanId = oralixId.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter your Oralix ID / Email and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const allUsers = StorageService.getUsers();
      const result = AuthService.verifyCredentials(cleanId, cleanPass, allUsers, selectedRole);

      if (!result.success || !result.user) {
        setIsLoading(false);
        const { lockedOut } = SecurityService.recordFailedAttempt(
          cleanId || 'Unknown Account',
          selectedRole
        );
        if (lockedOut) {
          setError('Security Lockout: 3 failed attempts. Account login protected for 30s.');
          setLockoutRemaining(30);
        } else {
          setError(result.message || 'Invalid Oralix ID / Email or password.');
        }
        return;
      }

      // Success
      const authenticatedUser = result.user;
      SecurityService.clearFailedAttempts();
      SecurityService.logEvent({
        type: 'AUTH_LOGIN',
        actor: authenticatedUser.name,
        targetRole: authenticatedUser.role,
        details: `Authenticated user ${authenticatedUser.oralixId || authenticatedUser.email} (${authenticatedUser.role.toUpperCase()})`,
        status: 'SUCCESS'
      });

      StorageService.saveCurrentUser(authenticatedUser);
      setIsLoading(false);
      onLogin(authenticatedUser);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#252525] relative flex flex-col justify-between overflow-x-hidden font-sans antialiased">
      {/* SINGLE FIXED FULL-SCREEN LOOPING DENTAL VIDEO BACKGROUND WITH WARM IVORY FROST */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#F5F3EF] w-full h-full min-w-full min-h-full max-w-none max-h-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full min-w-full min-h-full max-w-none max-h-none object-cover object-center origin-center scale-[1.14] block filter brightness-[1.05] contrast-[1.02] opacity-35"
          poster="/realistic_human_molar.png"
        >
          <source src="/Denti video3.2.mp4" type="video/mp4" />
          <source src="/Denti video3.mp4" type="video/mp4" />
        </video>
        {/* Soft Warm Ivory Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F3EF]/70 via-[#F7F5F1]/50 to-[#F5F3EF]/80 pointer-events-none" />
      </div>

      {/* Top Header Navbar */}
      <header className="relative z-10 w-full px-6 py-5 max-w-7xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateLanding}
          className="group flex items-center gap-2 text-xs font-bold text-[#252525] px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md hover:border-[#C8B58D] hover:bg-white transition-all duration-200 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#C8B58D] group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Back to Showcase</span>
        </button>

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-[#EDE8DE] border border-[#C8B58D]/30 text-[#252525] flex items-center justify-center font-black">
            <ToothIcon size={16} />
          </div>
          <span className="text-sm font-black font-display tracking-tight text-[#252525]">
            ORALIX
          </span>
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-6 my-auto flex flex-col items-center">
        <div className="w-full bg-white/85 border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_18px_55px_rgba(60,55,45,0.08)] backdrop-blur-2xl relative overflow-hidden text-[#252525]">
          
          <div className="text-center mb-5 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 text-[#252525] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <KeyRound className="w-6 h-6 text-[#C8B58D]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#252525] font-display tracking-tight">
              Welcome to Oralix
            </h1>
            <p className="text-xs text-[#6F6D69] font-medium mt-1">
              Select your role and sign in with your Oralix ID or Email
            </p>
          </div>

          {/* Role Selector Buttons */}
          <div className="mb-5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6F6D69] mb-2 text-center">
              Who are you signing in as?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center ${
                  selectedRole === 'patient'
                    ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] shadow-2xs font-extrabold ring-1 ring-[#C8B58D]'
                    : 'bg-white/80 border-stone-200 text-[#6F6D69] hover:bg-stone-50'
                }`}
              >
                <span className="text-lg mb-0.5">👤</span>
                <span className="text-[10px] font-black uppercase tracking-tight">PATIENT</span>
                <span className="text-[9px] text-[#6F6D69]">Patient Portal</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('doctor')}
                className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center ${
                  selectedRole === 'doctor'
                    ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] shadow-2xs font-extrabold ring-1 ring-[#C8B58D]'
                    : 'bg-white/80 border-stone-200 text-[#6F6D69] hover:bg-stone-50'
                }`}
              >
                <span className="text-lg mb-0.5">🩺</span>
                <span className="text-[10px] font-black uppercase tracking-tight">DOCTOR</span>
                <span className="text-[9px] text-[#6F6D69]">Clinician Portal</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center ${
                  selectedRole === 'admin'
                    ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] shadow-2xs font-extrabold ring-1 ring-[#C8B58D]'
                    : 'bg-white/80 border-stone-200 text-[#6F6D69] hover:bg-stone-50'
                }`}
              >
                <span className="text-lg mb-0.5">🛡️</span>
                <span className="text-[10px] font-black uppercase tracking-tight">ADMIN</span>
                <span className="text-[9px] text-[#6F6D69]">Clinic Mgmt</span>
              </button>
            </div>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#B97870]/10 border border-[#B97870]/30 text-[#632924] text-xs flex items-start gap-2 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-[#B97870] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div>
              <label className="block text-xs font-bold text-[#252525] mb-1.5">
                Oralix ID / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={oralixId}
                  onChange={(e) => setOralixId(e.target.value)}
                  placeholder={selectedRole === 'doctor' ? 'doctor@gmail.com or dr.ananya@oralix.com' : selectedRole === 'admin' ? 'admin@gmail.com or admin@oralix.com' : 'patient@gmail.com or aravind@oralix.com'}
                  disabled={lockoutRemaining > 0 || isLoading}
                  className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#252525] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  disabled={lockoutRemaining > 0 || isLoading}
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
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
                </>
              )}
            </button>
          </form>

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
          <span>Protected with cryptographic rate-limiting &amp; audit logging</span>
        </div>
      </main>

      <div className="h-4" />
    </div>
  );
};
