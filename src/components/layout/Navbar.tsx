import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../../types';
import {
  Search,
  Menu,
  Globe,
  CalendarPlus,
  Lock,
  ShieldCheck,
  User as UserIcon,
  Edit3,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onToggleSidebar: () => void;
  onRequestSwitchRole: (role: UserRole) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSearch: () => void;
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  onOpenBackgroundManager: () => void;
  onOpenSecurityAudit: () => void;
  onLockTerminal: () => void;
  onNavigateToProfile: () => void;
  onOpenEditProfile: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onToggleSidebar,
  onRequestSwitchRole,
  searchQuery,
  setSearchQuery,
  onOpenSearch,
  onOpenBooking,
  onOpenPortal,
  onOpenSecurityAudit,
  onLockTerminal,
  onNavigateToProfile,
  onOpenEditProfile,
  onLogout
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  return (
    <header className="h-16 bg-[#F7F5F1]/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between gap-3 shadow-2xs text-[#252525]">
      {/* Left section: toggle + search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-xl text-[#6F6D69] hover:text-[#252525] hover:bg-[#EDE8DE] cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {currentUser.role !== 'patient' && (
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#6F6D69] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onClick={onOpenSearch}
              onChange={e => {
                setSearchQuery(e.target.value);
                onOpenSearch();
              }}
              placeholder="Search patients, odontogram, treatment plans..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/90 border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 text-[#252525] placeholder-[#999690] transition cursor-pointer shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* Right section: security controls + user profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Security Operations & Audit button */}
        <button
          onClick={onOpenSecurityAudit}
          title="Security Clearance & Access Logs"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-[#252525] bg-white/80 hover:bg-white border border-stone-200/80 rounded-xl transition cursor-pointer backdrop-blur-md shadow-2xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#8FA88D]" />
          <span className="hidden lg:inline">Security Center</span>
        </button>

        {/* Quick Lock Terminal button */}
        <button
          onClick={onLockTerminal}
          title="Quick Lock Workstation (Prevent Unauthorized Walk-up Tampering)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-[#594723] bg-[#C5A66A]/15 hover:bg-[#C5A66A]/25 border border-[#C5A66A]/30 rounded-xl transition cursor-pointer shadow-2xs"
        >
          <Lock className="w-3.5 h-3.5 text-[#C5A66A]" />
          <span className="hidden sm:inline">Lock Station</span>
        </button>

        {/* Quick Public Access Links */}
        <div className="hidden xl:flex items-center gap-1.5 pl-1">
          {/* Booking Button: NO Booking in Doctor or Admin Portal Header */}
          {currentUser.role !== 'doctor' && currentUser.role !== 'admin' && (
            <button
              onClick={onOpenBooking}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#252525] bg-white/80 hover:bg-white border border-stone-200/80 rounded-xl transition cursor-pointer backdrop-blur-md shadow-2xs"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#C8B58D]" />
              <span>Booking</span>
            </button>
          )}
          <button
            onClick={onOpenPortal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#252525] bg-white/80 hover:bg-white border border-stone-200/80 rounded-xl transition cursor-pointer backdrop-blur-md shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#C8B58D]" />
            <span>Queue Board</span>
          </button>
        </div>

        {/* Interactive Profile & Avatar Control */}
        <div className="relative pl-2 border-l border-stone-200/80" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
            aria-label="User profile menu"
            className="flex items-center gap-2 p-1 -m-1 rounded-xl hover:bg-[#EDE8DE]/60 transition cursor-pointer focus:outline-none group"
          >
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-[#252525] leading-tight transition">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-semibold text-[#6F6D69] capitalize flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {currentUser.role} portal
              </span>
            </div>

            <div className="relative">
              <span className="w-8 h-8 rounded-xl bg-[#252525] text-white border border-[#C8B58D]/30 text-xs font-bold flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                {currentUser.avatarText || currentUser.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#F7F5F1] rounded-full" />
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-[#6F6D69] group-hover:text-[#252525] transition-transform duration-200 hidden sm:inline ${
              isProfileMenuOpen ? 'rotate-180 text-[#252525]' : ''
            }`} />
          </button>

          {/* Polished Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 mt-2 w-72 sm:w-80 bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-[#252525]"
            >
              {/* Profile Header */}
              <div className="p-4 bg-[#EDE8DE]/50 border-b border-stone-200/80 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#252525] text-white font-extrabold text-base flex items-center justify-center border border-[#C8B58D]/30 shadow-xs shrink-0">
                  {currentUser.avatarText || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#252525] truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-[#6F6D69] truncate">
                    {currentUser.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE8DE] text-[#252525] border border-[#C8B58D]/30 capitalize">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      {currentUser.role}
                    </span>
                    {currentUser.specialization && (
                      <span className="text-[10px] text-[#6F6D69] truncate">
                        • {currentUser.specialization}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Navigation Options */}
              <div className="p-2 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onNavigateToProfile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#EDE8DE]/60 text-[#252525] font-semibold transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="w-4 h-4 text-[#C8B58D] group-hover:scale-110 transition-transform" />
                    <span>View Profile</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#252525] bg-[#EDE8DE] px-1.5 py-0.5 rounded border border-[#C8B58D]/30">
                    Open
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenEditProfile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#EDE8DE]/60 text-[#252525] font-semibold transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Edit3 className="w-4 h-4 text-[#6F6D69] group-hover:scale-110 transition-transform" />
                    <span>Edit Profile</span>
                  </div>
                  <span className="text-[10px] text-[#6F6D69]">Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenSecurityAudit();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#EDE8DE]/60 text-[#252525] font-semibold transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#8FA88D] group-hover:scale-110 transition-transform" />
                    <span>Account Security &amp; Audit</span>
                  </div>
                  <span className="text-[10px] text-[#3B4D3A] font-bold bg-[#8FA88D]/20 px-1.5 py-0.5 rounded border border-[#8FA88D]/30">
                    Verified
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLockTerminal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#C5A66A]/10 text-[#594723] font-semibold transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#C5A66A] group-hover:scale-110 transition-transform" />
                    <span>Lock Workstation</span>
                  </div>
                  <span className="text-[10px] text-[#594723] bg-[#C5A66A]/20 px-1.5 py-0.5 rounded border border-[#C5A66A]/30">
                    PIN
                  </span>
                </button>
              </div>

              {/* Footer / Logout */}
              <div className="p-2 border-t border-stone-200/80 bg-[#EDE8DE]/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#B97870] hover:bg-[#B97870]/10 hover:text-[#9B4D45] font-bold text-xs transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#B97870]" />
                  <span>Sign Out of DentiFlow</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
