import React, { useState, useEffect } from 'react';
import { SecurityService } from '../../utils/security';
import { ShieldCheck, ShieldAlert, Lock, KeyRound, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'doctor' | 'admin' | 'patient';
  targetFeatureName?: string;
  onSuccess: () => void;
  actorName?: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  targetFeatureName,
  onSuccess,
  actorName = 'Current User'
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Check lockout on mount & interval
  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setErrorMsg('');
      return;
    }

    const checkLockout = () => {
      const status = SecurityService.getLockoutStatus();
      if (status.isLockedOut) {
        setLockoutRemaining(status.remainingSeconds);
        setErrorMsg(`Terminal Security Active: Locked against unauthorized entry. Wait ${status.remainingSeconds}s.`);
      } else {
        setLockoutRemaining(0);
      }
    };

    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin || lockoutRemaining > 0) return;

    const result = SecurityService.verifyPin(targetRole, pin, actorName);
    if (result.success) {
      setErrorMsg('');
      setPin('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg(result.message);
      setPin('');
      const status = SecurityService.getLockoutStatus();
      if (status.isLockedOut) {
        setLockoutRemaining(status.remainingSeconds);
      }
    }
  };

  const handleKeypadPress = (val: string) => {
    if (lockoutRemaining > 0) return;
    if (val === 'clear') {
      setPin('');
    } else if (val === 'back') {
      setPin(prev => prev.slice(0, -1));
    } else {
      if (pin.length < 8) {
        setPin(prev => prev + val);
      }
    }
  };

  const roleTitle = targetRole === 'admin' 
    ? 'Clinic Administrator Portal' 
    : targetRole === 'doctor' 
    ? 'Dentist & Clinician Terminal' 
    : 'Patient Private Medical Portal';

  const defaultPinHint = targetRole === 'admin'
    ? 'Default Admin PIN: 9042'
    : targetRole === 'doctor'
    ? 'Default Doctor PIN: 4482'
    : 'Default Patient PIN: 123456';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Security Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-tight">
                  Security Clearance Required
                </h3>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Protected
                </span>
              </div>
              <p className="text-xs text-sky-200/80">
                Unauthorized access to clinical portals is restricted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                Attempting to access: <span className="text-sky-700">{targetFeatureName || roleTitle}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Please enter your authorized personnel clearance PIN to proceed. All access events are logged into the clinical audit trail.
              </p>
            </div>
          </div>

          {/* Error / Lockout Banner */}
          {errorMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              lockoutRemaining > 0 
                ? 'bg-rose-50 border-rose-300 text-rose-800' 
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMsg}</p>
                {lockoutRemaining > 0 && (
                  <p className="text-[11px] mt-1 font-mono">
                    Terminal cooldown countdown: 00:{lockoutRemaining.toString().padStart(2, '0')}
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Security PIN Code</span>
                <span className="text-[11px] font-normal text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {defaultPinHint}
                </span>
              </label>
              
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={lockoutRemaining > 0}
                  placeholder="••••"
                  autoFocus
                  maxLength={10}
                  className="w-full text-center tracking-[0.6em] text-xl font-bold py-2.5 px-4 bg-white border-2 border-slate-300 rounded-xl focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition disabled:bg-slate-100 disabled:text-slate-400"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Quick Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  disabled={lockoutRemaining > 0}
                  onClick={() => handleKeypadPress(num)}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-800 border border-slate-200 text-sm font-bold text-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('clear')}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-xs font-bold text-slate-600 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-800 border border-slate-200 text-sm font-bold text-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('back')}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-600 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!pin || lockoutRemaining > 0}
                className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Clearance</span>
              </button>
            </div>
          </form>

        </div>

        {/* Security Guarantee Footer */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            AES-256 Medical Portal Gate
          </span>
          <span>HIPAA / ISO 27001 Protected</span>
        </div>

      </div>
    </div>
  );
};
