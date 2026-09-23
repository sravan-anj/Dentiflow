import React, { useState } from 'react';
import {
  Calendar,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { ToothIcon } from '../common/ToothIcon';

interface CtaFooterSectionProps {
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  onNavigateAuth: (mode: 'signin' | 'signup') => void;
}

export const CtaFooterSection: React.FC<CtaFooterSectionProps> = ({
  onOpenBooking,
  onOpenPortal,
  onNavigateAuth
}) => {
  const [isHoveredCta, setIsHoveredCta] = useState(false);

  return (
    <footer id="contacts" className="bg-slate-950/80 backdrop-blur-2xl text-white relative overflow-hidden border-t border-white/10">
      
      {/* Ambient Radial Background Beams */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Monumental Booking CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
        <div className="bg-slate-900/60 border border-white/15 rounded-3xl p-8 sm:p-14 lg:p-16 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden text-center flex flex-col items-center">
          
          {/* Quality Badge Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-black uppercase tracking-widest mb-6 shadow-md backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Accepting New Private &amp; Referral Patients</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-display max-w-4xl leading-[1.08] mb-6">
            TRANSFORM YOUR SMILE WITH <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-200 to-white">
              SUB-10 MICRON OPTICAL ACCURACY
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mb-10 leading-relaxed font-medium">
            Reserve your sterile operatory consultation today. Experience 3D intraoral optical scanning, painless computerized anesthesia, and biocompatible ceramics.
          </p>

          {/* Conversion Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xl">
            <button
              type="button"
              id="footer-book-cta"
              onClick={onOpenBooking}
              onMouseEnter={() => setIsHoveredCta(true)}
              onMouseLeave={() => setIsHoveredCta(false)}
              className="relative overflow-hidden w-full sm:w-auto px-9 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm sm:text-base tracking-wider shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:shadow-[0_0_45px_rgba(255,255,255,0.6)] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group active:scale-[0.98] border border-white/60"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
              <Calendar className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10 text-slate-950 font-black">BOOK APPOINTMENT NOW</span>
              {isHoveredCta ? (
                <ArrowUpRight className="w-5 h-5 text-slate-950 transition-all translate-x-0.5 -translate-y-0.5 relative z-10" />
              ) : (
                <ArrowRight className="w-5 h-5 text-slate-950 transition-all group-hover:translate-x-1 relative z-10" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigateAuth('signin')}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wide border border-white/20 backdrop-blur-md transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
            >
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>Portal Sign In</span>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-white transition-transform" />
            </button>
          </div>

          {/* Clinical Assurance Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-semibold border-t border-white/10 pt-6 w-full max-w-3xl">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Sterile HEPA Operatory
            </span>
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" />
              National Dental Council Certified
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Zero Waiting Time Protocol
            </span>
          </div>

        </div>
      </div>

      {/* Main Practice Directory & Information Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 relative z-10">
        
        {/* Col 1: Brand & Philosophy */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center border border-white/25 shadow-lg">
                <ToothIcon size={24} />
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-display">
                DENTIFLOW
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium mb-6">
              Advanced Dental Medicine &amp; Operatory Centers. Combining sub-10 micron optical diagnostics, robotic CAD/CAM milling, and painless restorative protocols.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>EMERGENCY TRIAGE 24/7 HELPLINE</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Severe toothache, dental trauma, or displaced restorations handled immediately.
            </p>
            <a href="tel:+919876543210" className="text-sm font-mono font-black text-white hover:text-sky-400 transition">
              +91 80 2990 8820 / +91 98800 12026
            </a>
          </div>
        </div>

        {/* Col 2: Locations & Hours */}
        <div className="lg:col-span-3 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-sky-400 font-mono">
            Operatory Suite Location
          </h4>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-bold text-white block mb-1">Main Practice Suite 402</span>
              <p className="text-slate-400 leading-relaxed">
                100 Feet Road, Medical Enclave<br />
                Chairs 1 – 4 &bull; Digital X-Ray Wing<br />
                Mon &ndash; Sat: 08:30 AM &ndash; 08:00 PM
              </p>
            </div>
          </div>
        </div>

        {/* Col 3: Disciplines */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-sky-400 font-mono">
            Specialties
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-300 font-semibold">
            <li><a href="#services" className="hover:text-white transition flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-sky-400" /> Micro-Endodontics</a></li>
            <li><a href="#services" className="hover:text-white transition flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-sky-400" /> Cosmetic Veneers</a></li>
            <li><a href="#services" className="hover:text-white transition flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-sky-400" /> Invisalign Ortho</a></li>
            <li><a href="#services" className="hover:text-white transition flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-sky-400" /> 3D Guided Implants</a></li>
            <li><a href="#services" className="hover:text-white transition flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-sky-400" /> Laser Whitening</a></li>
          </ul>
        </div>

        {/* Col 4: Quick Portals Access */}
        <div className="lg:col-span-3 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-sky-400 font-mono">
            Access Portals
          </h4>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onNavigateAuth('signin')}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-sky-400" />
                <span>Doctor / Patient Sign In</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateAuth('signup')}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>New Patient Registration</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Sub-Footer & Legal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium relative z-10">
        <span>© 2026 DentiFlow Advanced Dental Medicine. All clinical rights reserved.</span>
        <div className="flex items-center gap-6">
          <span>Digital Health Data Protection Compliant</span>
          <span>ISO 13485 Operatory Certification</span>
        </div>
      </div>

    </footer>
  );
};
