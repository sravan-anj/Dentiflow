import React, { useState, useEffect } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import {
  Calendar,
  ArrowUpRight,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

interface LandingNavbarProps {
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  onNavigateAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenBooking,
  onOpenPortal,
  onNavigateAuth
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'SERVICES', href: '#services' },
    { label: 'TECHNOLOGY', href: '#technology' },
    { label: 'RESULTS', href: '#results' },
    { label: 'DOCTORS', href: '#doctors' },
    { label: 'REVIEWS', href: '#reviews' },
    { label: 'CONTACTS', href: '#contacts' }
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="landing-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/20 backdrop-blur-md py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, '#hero')}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-white/20 group-hover:scale-105 transition-transform duration-200">
              <ToothIcon size={22} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-black font-black tracking-tight text-xl leading-none font-display drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]" style={{ color: '#000000' }}>
                  DENTIFLOW
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-black" />
              </div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-black/80 font-sans drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                Advanced Dental Medicine
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-[12px] font-bold tracking-wider text-slate-100 hover:text-white transition-colors duration-150 relative py-1 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-white transition-all duration-200 group-hover:w-full rounded-full" />
              </a>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Sign In Portal Link */}
            <button
              type="button"
              onClick={() => onNavigateAuth('signin')}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all duration-200 shadow-md active:scale-95 cursor-pointer flex items-center gap-2 group"
            >
              <UserCheck className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform duration-200" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-200 bg-white/10 hover:bg-white/20 transition border border-white/15 backdrop-blur-md cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 pb-4 bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Navigation</span>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-bold text-slate-200 hover:text-white py-1.5 flex items-center justify-between"
              >
                <span>{link.label}</span>
                <span className="text-slate-400">→</span>
              </a>
            ))}

            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateAuth('signin');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 text-white font-bold text-xs text-center border border-white/15 cursor-pointer active:scale-95 transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateAuth('signup');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/20 text-white font-bold text-xs text-center border border-white/25 cursor-pointer active:scale-95 transition"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
