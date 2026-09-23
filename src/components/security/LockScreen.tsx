import React, { useState, useEffect } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { SecurityService } from '../../utils/security';
import { ShieldCheck, Lock, KeyRound, AlertTriangle, Clock, Activity } from 'lucide-react';
import { User } from '../../types';

interface LockScreenProps {
  currentUser: User;
  onUnlock: () => void;
  backgroundUrl: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  currentUser,
  onUnlock,
  backgroundUrl
}) => {
  const [pin, setPin] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkLockout = () => {
      const status = SecurityService.getLockoutStatus();
      if (status.isLockedOut) {
        setLockoutRemaining(status.remainingSeconds);
        setErrorMsg(`Terminal Locked Out: Retry in ${status.remainingSeconds}s`);
      } else {
        setLockoutRemaining(0);
      }
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin || lockoutRemaining > 0) return;

    // Use current user role to verify
    const targetRole = (currentUser.role === 'admin' || currentUser.role === 'doctor') 
      ? currentUser.role 
      : 'doctor';

    const result = SecurityService.verifyPin(targetRole, pin, currentUser.name);
    if (result.success) {
      SecurityService.setTerminalLocked(false, currentUser.name);
      onUnlock();
    } else {
      setErrorMsg(result.message);
      setPin('');
      const status = SecurityService.getLockoutStatus();
      if (status.isLockedOut) {
        setLockoutRemaining(status.remainingSeconds);
      }
    }
  };

  const handleKeypad = (char: string) => {
    if (lockoutRemaining > 0) return;
    if (char === 'clear') {
      setPin('');
    } else if (char === 'back') {
      setPin(prev => prev.slice(0, -1));
    } else {
      if (pin.length < 8) setPin(prev => prev + char);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const isVideo = backgroundUrl.endsWith('.mp4') || backgroundUrl.endsWith('.webm');

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/40 text-white select-none overflow-hidden backdrop-blur-xs">
      {/* Background Media Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {isVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={backgroundUrl} type="video/mp4" />
          </video>
        ) : (
          <img
            src={backgroundUrl}
            alt="Operatory Environment"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-slate-950/50" />
      </div>

      {/* Top Bar */}
      <header className="p-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shadow-lg">
            <ToothIcon size={22} />
          </span>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              DentiFlow Clinic Station
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                TERMINAL SECURED
              </span>
            </h1>
            <p className="text-xs text-slate-400">Operatory Chair 1 • Workstation ID #WS-8841</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Encrypted Session Active</span>
          </div>
        </div>
      </header>

      {/* Central Unlock Module */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        
        {/* Big Clock */}
        <div className="text-center mb-6">
          <div className="text-5xl md:text-6xl font-extrabold tracking-tight text-white font-mono drop-shadow-md">
            {formattedTime}
          </div>
          <div className="text-xs md:text-sm text-sky-200/80 font-medium mt-1">
            {formattedDate}
          </div>
        </div>

        {/* Unlock Card (Transparent Glass Template) */}
        <div className="w-full bg-white/20 border border-white/40 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          
          <div className="flex items-center gap-3 pb-3 border-b border-white/20">
            <div className="w-12 h-12 rounded-xl bg-white/30 border border-white/40 flex items-center justify-center text-white font-black text-base shadow-md backdrop-blur-md">
              {currentUser.avatarText}
            </div>
            <div>
              <h2 className="font-bold text-sm text-white drop-shadow-xs">{currentUser.name}</h2>
              <p className="text-xs text-slate-200 capitalize flex items-center gap-1.5 mt-0.5 font-medium">
                <Lock className="w-3 h-3 text-amber-300" />
                Session Locked ({currentUser.role} portal)
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/30 border border-rose-400/50 rounded-xl text-xs text-rose-100 flex items-start gap-2 font-bold backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 flex justify-between">
                <span>Enter Staff Clearance PIN</span>
                <span className="text-[10px] text-sky-200 font-mono font-bold">
                  {currentUser.role === 'admin' ? 'Hint: 9042' : 'Hint: 4482'}
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
                  className="w-full text-center tracking-[0.6em] text-2xl font-black py-3 px-4 bg-white/25 border border-white/50 rounded-xl focus:border-white focus:outline-none text-white transition disabled:opacity-50 placeholder:text-white/40 backdrop-blur-md"
                />
                <KeyRound className="w-4 h-4 text-white/70 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Keypad (Transparent Glass Buttons) */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
                <button
                  key={n}
                  type="button"
                  disabled={lockoutRemaining > 0}
                  onClick={() => handleKeypad(n)}
                  className="py-2.5 rounded-xl bg-white/20 hover:bg-white/40 border border-white/40 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40 cursor-pointer backdrop-blur-md"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypad('clear')}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-rose-500/40 border border-white/30 text-xs font-bold text-slate-200 hover:text-white transition active:scale-95 disabled:opacity-40 cursor-pointer backdrop-blur-md"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypad('0')}
                className="py-2.5 rounded-xl bg-white/20 hover:bg-white/40 border border-white/40 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40 cursor-pointer backdrop-blur-md"
              >
                0
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypad('back')}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/30 border border-white/30 text-xs font-bold text-slate-200 hover:text-white transition active:scale-95 disabled:opacity-40 cursor-pointer backdrop-blur-md"
              >
                ⌫
              </button>
            </div>

            <button
              type="submit"
              disabled={!pin || lockoutRemaining > 0}
              className="w-full py-3 bg-sky-500/35 hover:bg-sky-500/50 border border-sky-400/60 rounded-xl text-xs font-black text-white transition shadow-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Workstation</span>
            </button>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-white/5 backdrop-blur-sm bg-white/5">
        Protected by DentiFlow Zero-Trust Clinical Access Control • Auto-Lock Active
      </footer>
    </div>
  );
};
