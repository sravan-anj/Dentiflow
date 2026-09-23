import React, { useState, useEffect } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { User, UserRole } from '../../types';
import { INITIAL_USERS } from '../../data/seedData';
import { SecurityService } from '../../utils/security';
import { StorageService } from '../../utils/storage';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  KeyRound,
  CheckCircle2
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
  const [email, setEmail] = useState('doctor@gmail.com');
  const [password, setPassword] = useState('doctor123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Monitor terminal security lockout
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

  // Quick fill helper for review and testing
  const handleQuickFill = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role === 'doctor') {
      setEmail('doctor@gmail.com');
      setPassword('doctor123');
    } else if (role === 'admin') {
      setEmail('admin@gmail.com');
      setPassword('admin123');
    } else if (role === 'patient') {
      setEmail('patient@gmail.com');
      setPassword('patient123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      // Check against stored users
      const allUsers = StorageService.getUsers();
      const userMatch = allUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail || (u.role === selectedRole && cleanEmail.includes(u.role))
      );

      const creds = SecurityService.getCredentials();
      let isValid = false;

      // Verification logic adhering to existing security foundation
      if (selectedRole === 'doctor' || (userMatch && userMatch.role === 'doctor')) {
        isValid =
          cleanPass === 'doctor123' ||
          cleanPass === creds.doctorPin ||
          cleanPass.toUpperCase() === 'DOC-4482' ||
          cleanPass.toUpperCase() === 'DOC-2026';
      } else if (selectedRole === 'admin' || (userMatch && userMatch.role === 'admin')) {
        isValid =
          cleanPass === 'admin123' ||
          cleanPass === creds.adminPin ||
          cleanPass.toUpperCase() === 'ADMIN-9042';
      } else if (selectedRole === 'patient' || (userMatch && userMatch.role === 'patient')) {
        isValid =
          cleanPass === 'patient123' ||
          cleanPass === creds.patientDefaultPin ||
          cleanPass === '123456';
      } else {
        // Fallback for custom registered users
        isValid = cleanPass.length >= 6;
      }

      if (!isValid) {
        setIsLoading(false);
        const { lockedOut, attemptsLeft } = SecurityService.recordFailedAttempt(
          cleanEmail || 'Unknown User',
          selectedRole
        );
        if (lockedOut) {
          setError('Security Lockout: 3 failed attempts. Operatory terminal secured for 30s.');
          setLockoutRemaining(30);
        } else {
          setError(`Invalid clearance credentials. ${attemptsLeft} attempt(s) remaining before security lockout.`);
        }
        return;
      }

      // Success: Clear failed attempts and log audit event
      SecurityService.clearFailedAttempts();
      SecurityService.logEvent({
        type: 'AUTH_LOGIN',
        actor: userMatch ? userMatch.name : cleanEmail,
        targetRole: selectedRole,
        details: `Clinician/User signed in to ${selectedRole.toUpperCase()} terminal`,
        status: 'SUCCESS'
      });

      const authenticatedUser: User = userMatch || {
        id: `u-${selectedRole}-${Date.now()}`,
        name:
          selectedRole === 'doctor'
            ? 'Dr. Ananya Sharma'
            : selectedRole === 'admin'
            ? 'Clinic Administrator'
            : 'Aravind Kumar',
        email: cleanEmail,
        role: selectedRole,
        avatarText: selectedRole === 'doctor' ? 'AS' : selectedRole === 'admin' ? 'AD' : 'AK',
        patientId: selectedRole === 'patient' ? 'p-1' : undefined
      };

      StorageService.saveCurrentUser(authenticatedUser);
      setIsLoading(false);
      onLogin(authenticatedUser);
    }, 400);
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
              Welcome Back
            </h1>
            <p className="text-xs text-[#6F6D69] font-medium mt-1">
              Sign in to your DentiFlow clinical management account
            </p>
          </div>

          {/* Quick Demo Role Selectors */}
          <div className="mb-6 relative">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6F6D69] block mb-2 text-center">
              Quick-Select Demo Account:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('doctor')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center border cursor-pointer ${
                  selectedRole === 'doctor'
                    ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] font-black shadow-xs'
                    : 'bg-white/80 text-[#6F6D69] border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <span>Doctor</span>
                <span className="text-[9px] opacity-75">Dr. Ananya</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('patient')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center border cursor-pointer ${
                  selectedRole === 'patient'
                    ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] font-black shadow-xs'
                    : 'bg-white/80 text-[#6F6D69] border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <span>Patient</span>
                <span className="text-[9px] opacity-75">Aravind K.</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center border cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] font-black shadow-xs'
                    : 'bg-white/80 text-[#6F6D69] border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <span>Admin</span>
                <span className="text-[9px] opacity-75">Full Practice</span>
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
                Staff / Patient Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinic.com"
                  disabled={lockoutRemaining > 0 || isLoading}
                  className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#252525]">
                  Password or Operatory PIN
                </label>
                <span className="text-[10px] text-[#594723] font-mono font-bold">
                  PIN: {selectedRole === 'doctor' ? '4482' : selectedRole === 'admin' ? '9042' : '123456'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password or license PIN"
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
                  <span>Sign In To Workstation</span>
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
          <span>Protected with cryptographic rate-limiting &amp; operatory audit logs</span>
        </div>
      </main>

      <div className="h-4" />
    </div>
  );
};
