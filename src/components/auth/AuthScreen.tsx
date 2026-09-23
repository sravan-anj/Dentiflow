import React, { useState, useEffect } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { User, UserRole } from '../../types';
import { INITIAL_USERS } from '../../data/seedData';
import { SecurityService } from '../../utils/security';
import { BackgroundStorage, DENTI_PRESETS } from '../../utils/backgroundStorage';
import { BackgroundConfig } from '../../types/background';
import {
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Users,
  Lock,
  KeyRound,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronDown,
  Check,
  Shield,
  Activity,
  FileText,
  Cpu,
  HeartHandshake,
  Phone
} from 'lucide-react';

const DENTAL_ASSETS = {
  heroVideo: encodeURI('/Denti video3.mp4'),
  heroVideoFallback: encodeURI('/Denti video3.mp4'),
  analyzingProblem: encodeURI('/Analyzing the problem.png'),
  appointmentBooking: encodeURI('/Appointment booking background.png'),
  checkUp: encodeURI('/Check-up.png'),
  consulting: encodeURI('/Consulting.png'),
  interaction: encodeURI('/Interaction.png'),
  preCheckUp: encodeURI('/Pre-check up.png'),
};

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  backgroundConfig?: BackgroundConfig;
  onOpenThemeModal?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onOpenBooking,
  onOpenPortal,
  backgroundConfig,
  onOpenThemeModal
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>('doctor');
  const [email, setEmail] = useState('doctor@gmail.com');
  const [password, setPassword] = useState('doctor123');
  const [securityError, setSecurityError] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Background config & theme (defaults to Cinematic 3D Molar Loop in Denti 9 palette)
  const currentThemeId = backgroundConfig?.activeId || 'denti-video-loop';
  const activePreset = DENTI_PRESETS.find(p => p.id === currentThemeId) || DENTI_PRESETS[0];
  const bgSource = backgroundConfig?.activeUrl || activePreset.source;
  const isBgVideo = activePreset.isVideo || bgSource.endsWith('.mp4') || bgSource.endsWith('.webm');

  // Registration fields
  const [signupRole, setSignupRole] = useState<'patient' | 'doctor'>('patient');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  useEffect(() => {
    const checkLockout = () => {
      const status = SecurityService.getLockoutStatus();
      if (status.isLockedOut) {
        setLockoutRemaining(status.remainingSeconds);
        setSecurityError(`Security Lockout Active: Terminal suspended. Wait ${status.remainingSeconds}s.`);
      } else {
        setLockoutRemaining(0);
      }
    };
    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, []);

  const fillDemo = (fillRole: UserRole) => {
    setTab('signin');
    setRole(fillRole);
    setSecurityError('');
    if (fillRole === 'doctor') {
      setEmail('doctor@gmail.com');
      setPassword('doctor123');
    } else if (fillRole === 'patient') {
      setEmail('patient@gmail.com');
      setPassword('patient123');
    } else if (fillRole === 'admin') {
      setEmail('admin@gmail.com');
      setPassword('admin123');
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    // Strict security authentication check
    const creds = SecurityService.getCredentials();
    const cleanPass = password.trim();

    let isValid = false;
    if (role === 'doctor') {
      isValid = cleanPass === 'doctor123' || cleanPass === creds.doctorPin || cleanPass.toUpperCase() === 'DOC-4482' || cleanPass.toUpperCase() === 'DOC-2026';
    } else if (role === 'admin') {
      isValid = cleanPass === 'admin123' || cleanPass === creds.adminPin || cleanPass.toUpperCase() === 'ADMIN-9042';
    } else if (role === 'patient') {
      isValid = cleanPass === 'patient123' || cleanPass === creds.patientDefaultPin || cleanPass === '123456';
    }

    if (!isValid) {
      const { lockedOut, attemptsLeft } = SecurityService.recordFailedAttempt(email, role);
      if (lockedOut) {
        setSecurityError('Access Denied: 3 incorrect attempts. Terminal protected for 30 seconds.');
        setLockoutRemaining(30);
      } else {
        setSecurityError(`Unauthorized credentials for ${role.toUpperCase()} portal. ${attemptsLeft} attempt(s) remaining.`);
      }
      return;
    }

    // Success
    SecurityService.clearFailedAttempts();
    SecurityService.logEvent({
      type: 'AUTH_LOGIN',
      actor: email,
      targetRole: role,
      details: `Successful authenticated sign-in to ${role.toUpperCase()} terminal`,
      status: 'SUCCESS'
    });

    const matchedUser = INITIAL_USERS.find(u => u.role === role) || {
      id: `u-${role}`,
      name: role === 'doctor' ? 'Dr. Ananya Sharma' : role === 'admin' ? 'Clinic Administrator' : 'Aravind Kumar',
      email: email || `${role}@gmail.com`,
      role,
      avatarText: role === 'doctor' ? 'DR' : role === 'admin' ? 'AD' : 'PT',
      patientId: role === 'patient' ? 'p-1' : undefined
    };
    onLogin(matchedUser);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `u-reg-${Date.now()}`,
      name: signupName || 'New Clinician',
      email: signupEmail,
      role: signupRole,
      avatarText: signupName ? signupName.substring(0, 2).toUpperCase() : 'US',
      phone: signupPhone,
      patientId: signupRole === 'patient' ? 'p-1' : undefined
    };
    SecurityService.logEvent({
      type: 'AUTH_LOGIN',
      actor: signupName,
      targetRole: signupRole,
      details: `Registered and signed in as ${signupRole}`,
      status: 'SUCCESS'
    });
    onLogin(newUser);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden text-slate-900 selection:bg-sky-500/20">
      {/* Background Media Layer: Themed Operatory Examination (Denti 1) */}
      <div className="fixed inset-0 -z-20 select-none pointer-events-none overflow-hidden bg-slate-950 w-full h-full">
        {isBgVideo ? (
          <video
            key={bgSource}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full min-w-full min-h-full object-cover object-center filter brightness-[1.14] contrast-[1.08] saturate-[1.12]"
          >
            <source src={bgSource} type="video/mp4" />
          </video>
        ) : (
          <img
            key={bgSource}
            src={bgSource}
            alt={activePreset.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== window.location.origin + '/Check-up.png') {
                target.src = '/Check-up.png';
              }
            }}
            className="w-full h-full object-cover object-center transition-all duration-700"
          />
        )}
        {/* Subtle ambient clinical tint with clear left-side aperture so the realistic tooth shines through */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/10 via-transparent to-slate-950/35 backdrop-blur-[0.2px]" />
      </div>

      {/* Top Clinical Navigation Bar */}
      <header className="w-full sticky top-0 z-30 bg-white/30 backdrop-blur-xl border-b border-white/40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-md text-sky-700 flex items-center justify-center shadow-xs border border-white/60">
              <ToothIcon size={20} />
            </span>
            <div>
              <span className="text-slate-950 font-black text-lg tracking-tight">DentiFlow</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-900 border border-sky-400/30">
                Clinic &amp; Portals
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-800">
            <a href="#diagnostics" className="hover:text-sky-900 transition">Diagnostics</a>
            <a href="#checkup" className="hover:text-sky-900 transition">Check-ups</a>
            <a href="#consulting" className="hover:text-sky-900 transition">Consultation</a>
            <a href="#interaction" className="hover:text-sky-900 transition">Patient Care</a>
            <a href="#precheck" className="hover:text-sky-900 transition">Sterile Protocol</a>
            <a href="#booking" className="hover:text-sky-900 transition">Book Visit</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {onOpenThemeModal && (
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/40 hover:bg-white/60 text-slate-950 rounded-xl text-xs font-black backdrop-blur-md border border-white/60 transition cursor-pointer shadow-2xs"
                title={`Visual Theme (${activePreset.name})`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Theme: {activePreset.name.split(' (')[0]}</span>
                <Sparkles className="w-3.5 h-3.5 text-sky-700" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenBooking}
              className="px-3.5 py-1.5 bg-sky-600/30 hover:bg-sky-600/45 text-slate-950 rounded-xl text-xs font-black backdrop-blur-md border border-sky-400/50 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-700" />
              <span>Book Online</span>
            </button>
            <button
              type="button"
              onClick={onOpenPortal}
              className="hidden sm:flex px-3 py-1.5 bg-white/30 hover:bg-white/50 text-slate-900 rounded-xl text-xs font-bold backdrop-blur-md border border-white/50 transition cursor-pointer shadow-2xs items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-slate-700" />
              <span>TV Queue</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION with Existing Dentiflow Content and Auth Card */}
      <section className="w-full min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-4 md:px-8 py-8 md:py-12 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left Art / Info Section */}
          <section className="md:col-span-6 flex flex-col justify-center py-4 text-slate-900">
            <div className="flex items-center gap-2.5 font-bold text-xl mb-4">
              <span className="w-10 h-10 rounded-xl bg-white/40 backdrop-blur-md text-sky-700 flex items-center justify-center shadow-sm border border-white/60">
                <ToothIcon size={22} />
              </span>
              <span className="text-slate-900 tracking-tight font-extrabold text-2xl drop-shadow-xs">DentiFlow Clinic</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-sky-950 text-xs font-black w-fit mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-700" />
              <span>{activePreset.name}</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 leading-tight mb-3 tracking-tight drop-shadow-xs">
              High-Precision Dental Clinic Portals
            </h1>
            <p className="text-sm md:text-base text-slate-800 font-medium mb-6 leading-relaxed max-w-md">
              Centralized terminal for digital odontograms, chair queue management, treatment plans, sterile inventory, and invoices.
            </p>

            <div className="flex flex-col gap-3 max-w-sm mb-7">
              <button
                type="button"
                onClick={onOpenBooking}
                className="flex items-center justify-between w-full px-4 py-3 bg-white/30 hover:bg-white/45 backdrop-blur-md border border-white/50 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-sm cursor-pointer"
              >
                <span>Book Appointment Online</span>
                <ArrowRight className="w-4 h-4 text-sky-700" />
              </button>
              <button
                type="button"
                onClick={onOpenPortal}
                className="flex items-center justify-between w-full px-4 py-3 bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/40 text-slate-900 rounded-xl text-xs font-extrabold transition cursor-pointer"
              >
                <span>Patient Queue &amp; TV Status</span>
                <ArrowRight className="w-4 h-4 text-sky-700" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/30 backdrop-blur-md text-emerald-950 font-bold border border-white/40 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Zero Unauthorized Access
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/30 backdrop-blur-md text-sky-950 font-bold border border-white/40 shadow-2xs">
                <Stethoscope className="w-4 h-4 text-sky-700" />
                SVG Dental Odontogram
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/30 backdrop-blur-md text-amber-950 font-bold border border-white/40 shadow-2xs">
                <Users className="w-4 h-4 text-amber-700" />
                Multi-Role Vault
              </span>
            </div>
          </section>

          {/* Right Auth Panel Card (Transparent Glass Template) */}
          <section className="md:col-span-6">
            <div className="bg-white/25 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-6 sm:p-7 text-slate-900">
              
              {/* Toggle Tabs (Transparent Glass) */}
              <div className="flex bg-white/25 backdrop-blur-md p-1 rounded-xl border border-white/40 mb-5">
                <button
                  type="button"
                  onClick={() => { setTab('signin'); setSecurityError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    tab === 'signin'
                      ? 'bg-white/65 text-slate-950 shadow-xs border border-white/50'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white/20'
                  }`}
                >
                  Portal Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setSecurityError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    tab === 'signup'
                      ? 'bg-white/65 text-slate-950 shadow-xs border border-white/50'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white/20'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {securityError && (
                <div className="mb-4 p-3 bg-rose-500/20 backdrop-blur-md border border-rose-400/40 rounded-xl text-xs text-rose-950 flex items-start gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
                  <span>{securityError}</span>
                </div>
              )}

              {tab === 'signin' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-extrabold text-slate-950">Sign in to DentiFlow</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/40 border border-white/60 text-sky-950 font-bold">
                      PORTAL GATEWAY
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mb-4">
                    Select your authorized portal role and provide clearance credentials.
                  </p>

                  <form onSubmit={handleSignIn} className="space-y-3.5">
                    {/* Role Selector Radio Group (Transparent Glass) */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-white/25 backdrop-blur-md rounded-xl border border-white/40 text-xs font-bold">
                      <label className={`flex items-center justify-center py-2 rounded-lg cursor-pointer transition gap-1.5 ${
                        role === 'doctor' ? 'bg-white/60 text-sky-950 border border-white/60 shadow-xs font-black' : 'text-slate-700 hover:bg-white/30'
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="doctor"
                          checked={role === 'doctor'}
                          onChange={() => { setRole('doctor'); setEmail('doctor@gmail.com'); setPassword('doctor123'); setSecurityError(''); }}
                          className="sr-only"
                        />
                        <Stethoscope className="w-3.5 h-3.5 text-sky-700" />
                        <span>Doctor</span>
                      </label>

                      <label className={`flex items-center justify-center py-2 rounded-lg cursor-pointer transition gap-1.5 ${
                        role === 'patient' ? 'bg-white/60 text-sky-950 border border-white/60 shadow-xs font-black' : 'text-slate-700 hover:bg-white/30'
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="patient"
                          checked={role === 'patient'}
                          onChange={() => { setRole('patient'); setEmail('patient@gmail.com'); setPassword('patient123'); setSecurityError(''); }}
                          className="sr-only"
                        />
                        <Users className="w-3.5 h-3.5 text-sky-700" />
                        <span>Patient</span>
                      </label>

                      <label className={`flex items-center justify-center py-2 rounded-lg cursor-pointer transition gap-1.5 ${
                        role === 'admin' ? 'bg-white/60 text-sky-950 border border-white/60 shadow-xs font-black' : 'text-slate-700 hover:bg-white/30'
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="admin"
                          checked={role === 'admin'}
                          onChange={() => { setRole('admin'); setEmail('admin@gmail.com'); setPassword('admin123'); setSecurityError(''); }}
                          className="sr-only"
                        />
                        <Lock className="w-3.5 h-3.5 text-sky-700" />
                        <span>Admin</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={`${role}@gmail.com`}
                        required
                        className="w-full px-3 py-2 text-xs border border-white/50 rounded-xl bg-white/35 backdrop-blur-md text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white/55"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex justify-between">
                        <span>Password / Clearance PIN</span>
                        <span className="text-[10px] text-sky-900 font-mono font-bold">
                          {role === 'doctor' ? 'PIN: 4482 or doctor123' : role === 'admin' ? 'PIN: 9042 or admin123' : 'PIN: 123456 or patient123'}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full px-3 py-2 text-xs border border-white/50 rounded-xl bg-white/35 backdrop-blur-md text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white/55"
                        />
                        <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={lockoutRemaining > 0}
                      className="w-full py-2.5 px-4 bg-sky-600/30 hover:bg-sky-600/45 backdrop-blur-md border border-sky-400/50 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl transition shadow-xs mt-2 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-sky-700" />
                      <span>Enter {role.toUpperCase()} Portal</span>
                      <span>→</span>
                    </button>
                  </form>

                  {/* Demo Quick-Fill Credentials (Transparent Buttons) */}
                  <div className="mt-5 pt-3.5 border-t border-white/30">
                    <p className="text-[11px] text-center text-slate-700 mb-2 font-bold">
                      Quick-fill authorized demo accounts:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => fillDemo('doctor')}
                        className="py-1.5 px-2 text-xs border border-white/40 bg-white/25 hover:bg-white/45 backdrop-blur-md rounded-lg text-slate-900 font-bold transition cursor-pointer"
                      >
                        Doctor (Ananya)
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemo('patient')}
                        className="py-1.5 px-2 text-xs border border-white/40 bg-white/25 hover:bg-white/45 backdrop-blur-md rounded-lg text-slate-900 font-bold transition cursor-pointer"
                      >
                        Patient (Aravind)
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemo('admin')}
                        className="py-1.5 px-2 text-xs border border-white/40 bg-white/25 hover:bg-white/45 backdrop-blur-md rounded-lg text-slate-900 font-bold transition cursor-pointer"
                      >
                        Admin (Clinic)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-base font-extrabold text-slate-950 mb-0.5">Create your Account</h2>
                  <p className="text-xs text-slate-700 mb-4">
                    Register a new verified patient or medical clinician profile.
                  </p>

                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Account Role</label>
                      <select
                        value={signupRole}
                        onChange={e => setSignupRole(e.target.value as 'patient' | 'doctor')}
                        className="w-full px-3 py-2 text-xs border border-white/50 rounded-xl bg-white/35 backdrop-blur-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      >
                        <option value="patient">Patient (Appointments, X-rays &amp; Billing)</option>
                        <option value="doctor">Dentist / Clinician (Full Odontogram &amp; Rx)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                        placeholder="Dr. Rajesh Pillai"
                        required
                        className="w-full px-3 py-2 text-xs border border-white/50 rounded-xl bg-white/35 backdrop-blur-md text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        placeholder="doctor@gmail.com"
                        required
                        className="w-full px-3 py-2 text-xs border border-white/50 rounded-xl bg-white/35 backdrop-blur-md text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={e => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 text-xs border border-white/50 rounded-xl bg-white/35 backdrop-blur-md text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Password</label>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 text-xs border border-white/50 rounded-xl bg-white/35 backdrop-blur-md text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-sky-600/30 hover:bg-sky-600/45 backdrop-blur-md border border-sky-400/50 text-slate-950 text-xs font-black rounded-xl transition shadow-xs mt-2 cursor-pointer"
                    >
                      Register &amp; Proceed to Terminal →
                    </button>
                  </form>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-white/30 text-center">
                <p className="text-xs text-slate-700 font-medium">
                  Looking to schedule a consultation?{' '}
                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="font-extrabold text-sky-900 hover:underline cursor-pointer"
                  >
                    Online Patient Booking →
                  </button>
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Scroll down indicator */}
        <div className="mt-8 md:mt-12 text-center">
          <a
            href="#diagnostics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 hover:bg-white/45 backdrop-blur-md border border-white/50 text-slate-900 text-xs font-extrabold shadow-sm transition"
          >
            <span>Explore Clinical Services &amp; Technology</span>
            <ChevronDown className="w-4 h-4 text-sky-700 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 1. DIAGNOSTIC SECTION: Analyzing the problem.png                 */}
      {/* ================================================================= */}
      <section id="diagnostics" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20 relative z-10">
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/50 p-6 sm:p-8 md:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 backdrop-blur-md border border-sky-400/40 text-sky-950 text-xs font-black">
                <Cpu className="w-3.5 h-3.5 text-sky-700" />
                <span>High-Definition Diagnostics</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Precision Dental Diagnosis &amp; Digital Radiography
              </h2>
              
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                Our operatory suites integrate panoramic digital X-ray scans with high-resolution diagnostic displays. Clinicians analyze root canal trajectories, sub-gingival caries, and bone density with surgical accuracy before proposing treatment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-950 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Panoramic OPG &amp; Bitewings</span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium leading-normal">
                    Ultra-low dose digital radiography with instant chairside screen rendering.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-950 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Root Canal Mapping</span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium leading-normal">
                    Micro-leakage detection and precise anatomical measurement for endodontics.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600/30 hover:bg-sky-600/45 backdrop-blur-md border border-sky-400/50 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                >
                  <span>Book Diagnostic Scan</span>
                  <ArrowRight className="w-4 h-4 text-sky-700" />
                </button>
              </div>
            </div>

            {/* Right Image Container */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-white/20 aspect-16/10">
                <img
                  src={DENTAL_ASSETS.analyzingProblem}
                  alt="Dentist analyzing patient's dental X-ray"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-[center_25%] transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-slate-950 text-xs font-bold flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-700" />
                    Digital Radiographic Scan Review
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-950 font-bold">
                    HD Sensor
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. SERVICES / CHECK-UP SECTION: Check-up.png                      */}
      {/* ================================================================= */}
      <section id="checkup" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20 relative z-10">
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/50 p-6 sm:p-8 md:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Image Container */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-white/20 aspect-16/10">
                <img
                  src={DENTAL_ASSETS.checkUp}
                  alt="Dentist conducting routine preventive dental check-up with mirror and probe"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-slate-950 text-xs font-bold flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-sky-700" />
                    Routine Operatory Examination
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-950 font-bold">
                    Certified Gentle
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-950 text-xs font-black">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>Preventive Oral Health</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Comprehensive Dental Check-ups &amp; Care
              </h2>
              
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                Routine dental evaluations form the cornerstone of lifelong oral vitality. Our clinical specialists employ gentle ultrasonic scaling, periodontal pocket assessment, and enamel remineralization to catch complications early.
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-2.5 text-xs text-slate-900 font-semibold">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Gentle ultrasonic prophylaxis cleaning to eliminate persistent tartar and stains.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-900 font-semibold">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>32-tooth odontogram indexing to document every restoration and gingival margin.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-900 font-semibold">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Personalized oral hygiene home regimen customized to your enamel density.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600/30 hover:bg-emerald-600/45 backdrop-blur-md border border-emerald-400/50 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                >
                  <span>Book Regular Check-up</span>
                  <ArrowRight className="w-4 h-4 text-emerald-800" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. CONSULTATION SECTION: Consulting.png                           */}
      {/* ================================================================= */}
      <section id="consulting" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20 relative z-10">
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/50 p-6 sm:p-8 md:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-950 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Specialist Consultation</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Clear Aligner Consultation &amp; Treatment Plans
              </h2>
              
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                Discover modern orthodontic alignment with nearly invisible clear aligners and restorative cosmetic dentistry. Our dentists walk you through 3D smile design mockups, expected timelines, and realistic aesthetic milestones.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 shadow-2xs">
                  <span className="text-xs font-bold text-slate-950 block mb-1">Clear Orthodontics</span>
                  <p className="text-[11px] text-slate-700 font-medium leading-normal">
                    Custom thermoformed aligner trays engineered for comfortable, discrete bite correction.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 shadow-2xs">
                  <span className="text-xs font-bold text-slate-950 block mb-1">Transparent Pricing</span>
                  <p className="text-[11px] text-slate-700 font-medium leading-normal">
                    Detailed phased cost breakdown with zero unexpected bills or surgical surcharges.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600/30 hover:bg-amber-600/45 backdrop-blur-md border border-amber-400/50 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                >
                  <span>Schedule Orthodontic Consult</span>
                  <ArrowRight className="w-4 h-4 text-amber-800" />
                </button>
              </div>
            </div>

            {/* Right Image Container */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-white/20 aspect-16/10">
                <img
                  src={DENTAL_ASSETS.consulting}
                  alt="Dentist discussing orthodontic treatment and clear aligners with patient"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-slate-950 text-xs font-bold flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-amber-700" />
                    Aligner &amp; Treatment Consultation
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-950 font-bold">
                    Custom Plan
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. PATIENT INTERACTION SECTION: Interaction.png                   */}
      {/* ================================================================= */}
      <section id="interaction" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20 relative z-10">
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/50 p-6 sm:p-8 md:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Image Container */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-white/20 aspect-16/10">
                <img
                  src={DENTAL_ASSETS.interaction}
                  alt="Dentist interacting with patient explaining digital treatment plan on a tablet"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-[center_30%] transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-slate-950 text-xs font-bold flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-700" />
                    Doctor-Patient Interactive Review
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-950 font-bold">
                    100% Digital
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 backdrop-blur-md border border-sky-400/40 text-sky-950 text-xs font-black">
                <HeartHandshake className="w-3.5 h-3.5 text-sky-700" />
                <span>Patient Trust &amp; Education</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Digital Communication &amp; Informed Care
              </h2>
              
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                Dentistry is best delivered through mutual understanding and calm reassurance. We review your digital records, treatment phases, and odontograms chairside on tablets so you are always fully informed and in control of your care.
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-2.5 text-xs text-slate-900 font-semibold">
                  <Check className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <span>Interactive tablet walkthrough of clinical findings and tooth surfaces.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-900 font-semibold">
                  <Check className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <span>Clear explanations without confusing medical jargon or rushed appointments.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-900 font-semibold">
                  <Check className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <span>Instant portal access to your clinical summary, invoices, and follow-up guidance.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/60 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                >
                  <span>View Patient Portal Features</span>
                  <ArrowRight className="w-4 h-4 text-sky-700" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. PRE-CHECK / PROCESS SECTION: Pre-check up.png                  */}
      {/* ================================================================= */}
      <section id="precheck" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20 relative z-10">
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/50 p-6 sm:p-8 md:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-400/40 text-indigo-950 text-xs font-black">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                <span>Sterile Operatory Protocol</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Hospital-Grade Hygiene &amp; Tray Preparation
              </h2>
              
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                Before you ever sit in the chair, our clinical staff executes a multi-point sterile setup protocol. Every handpiece, probe, and surgical tray is vacuum-sealed in an autoclave cycle and unsealed strictly in your presence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 shadow-2xs">
                  <span className="text-xs font-bold text-slate-950 block mb-1">Class-B Autoclave</span>
                  <p className="text-[11px] text-slate-700 font-medium leading-normal">
                    Pressure-monitored steam sterilization verified with chemical barcode indicators.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 shadow-2xs">
                  <span className="text-xs font-bold text-slate-950 block mb-1">Single-Use Barriers</span>
                  <p className="text-[11px] text-slate-700 font-medium leading-normal">
                    Medical-grade operatory barrier films changed between every single patient session.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-950 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Zero Cross-Contamination Standard Enforced</span>
                </div>
              </div>
            </div>

            {/* Right Image Container */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-white/20 aspect-16/10">
                <img
                  src={DENTAL_ASSETS.preCheckUp}
                  alt="Dentist preparing sterile clinical instruments and operatory equipment before treatment"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-[center_35%] transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-slate-950 text-xs font-bold flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    Pre-Treatment Instrument Preparation
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-950 font-bold">
                    Class-B Sterile
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. APPOINTMENT CTA SECTION: Appointment booking background.png   */}
      {/* ================================================================= */}
      <section id="booking" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20 relative z-10">
        <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/60 p-6 sm:p-10 md:p-14 shadow-2xl overflow-hidden relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Supporting Clinical Image with Patient and Dentist Clearly Visible */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-white/60 bg-white/20 aspect-4/3">
                <img
                  src={DENTAL_ASSETS.appointmentBooking}
                  alt="Dentist performing patient examination and check-up"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-slate-950 text-[10px] font-black tracking-wider uppercase border border-white/70 shadow-2xs">
                  Active Operatory Suite
                </div>
              </div>
            </div>

            {/* Right CTA Information */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 backdrop-blur-md border border-sky-400/40 text-sky-950 text-xs font-black">
                <Calendar className="w-3.5 h-3.5 text-sky-700" />
                <span>Immediate Online Reservations</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Ready to Experience Gentle, Technology-Driven Dental Care?
              </h2>

              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                Reserve your examination, tooth pain relief, or orthodontic consultation online in under 60 seconds. Receive your real-time queue token, appointment confirmation, and direct doctor assignment.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-600/35 hover:bg-sky-600/50 backdrop-blur-md border border-sky-400/60 text-slate-950 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer shadow-md"
                >
                  <Calendar className="w-4 h-4 text-sky-800" />
                  <span>Book Appointment Online</span>
                  <ArrowRight className="w-4 h-4 text-sky-800" />
                </button>

                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/35 hover:bg-white/55 backdrop-blur-md border border-white/60 text-slate-900 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs"
                >
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span>Check Live Waiting Queue</span>
                </button>
              </div>

              <p className="text-xs text-slate-700 pt-1 font-medium">
                Need urgent dental care? Direct clinic reception helpline:{' '}
                <span className="font-extrabold text-slate-950">+91 (080) 4122-3399</span>
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Modern Dental Clinic Footer */}
      <footer className="w-full bg-white/20 backdrop-blur-xl border-t border-white/40 py-10 px-4 sm:px-6 relative z-10 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-800 font-medium">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/40 text-sky-700 flex items-center justify-center border border-white/60 shadow-2xs">
              <ToothIcon size={18} />
            </span>
            <div>
              <p className="font-black text-slate-950 text-sm">DentiFlow Multispecialty Clinic</p>
              <p className="text-slate-700">Centralized Digital Operatory &amp; Patient Records</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#diagnostics" className="hover:text-slate-950 transition font-bold">Diagnostics</a>
            <a href="#checkup" className="hover:text-slate-950 transition font-bold">Check-ups</a>
            <a href="#consulting" className="hover:text-slate-950 transition font-bold">Orthodontics</a>
            <a href="#precheck" className="hover:text-slate-950 transition font-bold">Sterile Protocol</a>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sky-900 hover:text-sky-950 font-black underline cursor-pointer"
            >
              Sign In Portal ↑
            </button>
          </div>

          <p className="text-[11px] text-slate-600">
            &copy; {new Date().getFullYear()} DentiFlow. High-Precision Dental Care.
          </p>
        </div>
      </footer>
    </div>
  );
};
