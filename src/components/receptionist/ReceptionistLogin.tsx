import React, { useState } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Building, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface ReceptionistLoginProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const ReceptionistLogin: React.FC<ReceptionistLoginProps> = ({
  onLoginSuccess,
  onNavigateHome
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFillDemo = () => {
    setEmail('receptionist@oralix.com');
    setPassword('reception123');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (cleanEmail === 'receptionist@oralix.com' && cleanPassword === 'reception123') {
        try {
          sessionStorage.setItem('oralix_receptionist_authenticated', 'true');
        } catch (_) {}
        onLoginSuccess();
      } else {
        setErrorMessage('Invalid receptionist credentials. Please use receptionist@oralix.com and reception123.');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#C8B58D]/30 relative overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#EDE8DE]/40 via-[#FAF8F5]/80 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-10 w-72 h-72 rounded-full bg-[#C8B58D]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-[#EDE8DE]/60 blur-3xl pointer-events-none" />

      {/* Return to Main Portal Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-[#E5E0D8] shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C8B58D]" />
          <span>Return to Clinic Portal</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Icon Header */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center shadow-lg ring-4 ring-[#FAF8F5] overflow-hidden p-1">
            <ToothIcon size={56} />
          </div>
        </div>

        <h2 className="mt-5 text-center text-2xl sm:text-3xl font-bold tracking-tight text-[#1E1E1E]">
          Receptionist Workstation
        </h2>
        <p className="mt-2 text-center text-xs text-stone-500 max-w-sm mx-auto">
          Oralix Clinic Front Desk &bull; Itemized Billing, Payment Collection &amp; Real-time Receipt Ledger
        </p>

        {/* Demo Credentials Quick Pill */}
        <div className="mt-4 mx-4 sm:mx-0 p-3 bg-[#EDE8DE]/80 border border-[#C8B58D]/40 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="text-[11px] text-stone-700 leading-tight">
            <span className="font-bold text-[#1E1E1E] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C8B58D]" /> Mock Credentials:
            </span>
            <span className="text-stone-600 block mt-0.5 font-mono text-[10px]">
              receptionist@oralix.com &bull; reception123
            </span>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] hover:bg-[#2B2823] text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            Auto Fill
          </button>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-[0_12px_32px_rgba(0,0,0,0.06)] rounded-2xl border border-[#E5E0D8]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="receptionist-email" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Front Desk Email
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  id="receptionist-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="receptionist@oralix.com"
                  className="block w-full pl-10 pr-3 py-2.5 text-xs bg-stone-50 border border-[#E5E0D8] rounded-xl text-[#1E1E1E] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C8B58D]/40 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="receptionist-password" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  id="receptionist-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="reception123"
                  className="block w-full pl-10 pr-10 py-2.5 text-xs bg-stone-50 border border-[#E5E0D8] rounded-xl text-[#1E1E1E] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C8B58D]/40 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-[#1A1A1A] hover:bg-[#2B2823] active:scale-[0.99] transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating Front Desk...</span>
                ) : (
                  <>
                    <span>Unlock Receptionist Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C8B58D]" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Encrypted Session
            </span>
            <span>Oralix Dental v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
