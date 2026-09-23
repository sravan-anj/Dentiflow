import React, { useState } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { User, UserRole } from '../../types';
import { StorageService } from '../../utils/storage';
import { SecurityService } from '../../utils/security';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  HeartPulse
} from 'lucide-react';

interface SignUpPageProps {
  onLogin: (user: User) => void;
  onNavigateLanding: () => void;
  onNavigateSignIn: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onLogin,
  onNavigateLanding,
  onNavigateSignIn
}) => {
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [medicalAlert, setMedicalAlert] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please provide your full legal name for medical chart records.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const existingUsers = StorageService.getUsers();
      const duplicate = existingUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      if (duplicate) {
        setIsLoading(false);
        setError('An account with this email address already exists. Please sign in instead.');
        return;
      }

      // Generate new user record
      const newUserId = `u-${Date.now()}`;
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const newUser: User = {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        role,
        avatarText: initials || 'PT',
        phone: phone.trim() || '+91 98765 43210',
        patientId: role === 'patient' ? `p-reg-${Date.now()}` : undefined,
        specialization: role === 'doctor' ? 'Clinical Associate' : undefined,
        joinedDate: new Date().toISOString().split('T')[0]
      };

      // Save to existing persistence layer
      StorageService.updateUser(newUser);

      // Audit log registration
      SecurityService.logEvent({
        type: 'AUTH_LOGIN',
        actor: newUser.name,
        targetRole: role,
        details: `New account registered and authenticated (${role.toUpperCase()})`,
        status: 'SUCCESS'
      });

      // Establish session
      StorageService.saveCurrentUser(newUser);
      setIsLoading(false);
      onLogin(newUser);
    }, 450);
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

      {/* Main Registration Form Center Box */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-4 py-6 my-auto flex flex-col items-center">
        <div className="w-full bg-white/85 border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_18px_55px_rgba(60,55,45,0.08)] backdrop-blur-2xl relative overflow-hidden text-[#252525]">
          
          <div className="text-center mb-6 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 text-[#252525] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Sparkles className="w-6 h-6 text-[#C8B58D]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#252525] font-display tracking-tight">
              Create DentiFlow Chart Account
            </h1>
            <p className="text-xs text-[#6F6D69] font-medium mt-1">
              Join the clinic system to access digital odontograms, appointments &amp; prescriptions
            </p>
          </div>

          {/* Role Switcher */}
          <div className="mb-6 relative">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6F6D69] mb-2 text-center">
              Account Registration Category:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
                  role === 'patient'
                    ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] font-black shadow-xs'
                    : 'bg-white/80 text-[#6F6D69] border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <UserIcon className="w-4 h-4 text-[#C8B58D]" />
                <span>Patient Account</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
                  role === 'doctor'
                    ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] font-black shadow-xs'
                    : 'bg-white/80 text-[#6F6D69] border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-[#C8B58D]" />
                <span>Clinician / Fellow</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#B97870]/10 border border-[#B97870]/30 text-[#632924] text-xs flex items-start gap-2 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-[#B97870] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 relative">
            <div>
              <label className="block text-xs font-bold text-[#252525] mb-1">
                Full Legal Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Katherine Dupont"
                  disabled={isLoading}
                  className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    disabled={isLoading}
                    className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={isLoading}
                    className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    disabled={isLoading}
                    className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    disabled={isLoading}
                    className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                  />
                </div>
              </div>
            </div>

            {/* Optional Medical Alert */}
            {role === 'patient' && (
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1 flex items-center justify-between">
                  <span>Medical Allergies or Alerts (Optional)</span>
                  <span className="text-[10px] text-[#594723] font-normal">Encrypted Chart Note</span>
                </label>
                <div className="relative">
                  <HeartPulse className="w-4 h-4 text-[#C8B58D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={medicalAlert}
                    onChange={(e) => setMedicalAlert(e.target.value)}
                    placeholder="e.g. Penicillin Allergy, Hypertension, None"
                    disabled={isLoading}
                    className="w-full bg-white border border-stone-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252525] placeholder-[#999690] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-medium transition"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-4 py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Account &amp; Access Terminal</span>
                  <ArrowRight className="w-4 h-4 text-[#C8B58D]" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="mt-6 pt-4 border-t border-stone-200/80 text-center">
            <p className="text-xs text-[#6F6D69]">
              Already have a registered clinical account?{' '}
              <button
                type="button"
                onClick={onNavigateSignIn}
                className="text-[#252525] hover:text-[#594723] font-bold transition ml-1 cursor-pointer underline underline-offset-4 decoration-[#C8B58D]/60 hover:decoration-[#C8B58D]"
              >
                Sign In →
              </button>
            </p>
          </div>

        </div>

        {/* Security Assurance */}
        <div className="mt-5 text-center text-[11px] text-[#6F6D69] flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-stone-200/80 backdrop-blur-md shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8FA88D]" />
          <span>Patient data stored under Swiss medical privacy standards</span>
        </div>
      </main>

      <div className="h-4" />
    </div>
  );
};
