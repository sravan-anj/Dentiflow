import React from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { User, UserRole } from '../../types';
import {
  LayoutDashboard,
  Calendar,
  UsersRound,
  Users,
  Layers,
  FileText,
  CreditCard,
  Package,
  UserCheck,
  BarChart3,
  LogOut,
  Stethoscope,
  ShieldCheck,
  Lock,
  Image as ImageIcon
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'appointments'
  | 'queue'
  | 'patients'
  | 'chart'
  | 'treatment-plans'
  | 'clinical'
  | 'billing'
  | 'inventory'
  | 'staff'
  | 'reports'
  | 'account-access'
  | 'profile';

interface SidebarProps {
  currentUser: User;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenBackgroundManager: () => void;
  onOpenSecurityAudit: () => void;
  onLockTerminal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  isOpen,
  setIsOpen,
  onOpenBackgroundManager,
  onOpenSecurityAudit,
  onLockTerminal
}) => {
  const role: UserRole = currentUser.role;

  const getNavItems = () => {
    if (role === 'patient') {
      return [
        { id: 'dashboard', label: 'My Patient Portal', icon: LayoutDashboard },
        { id: 'appointments', label: 'My Appointments', icon: Calendar },
        { id: 'chart', label: 'Dental Odontogram', icon: Stethoscope },
        { id: 'treatment-plans', label: 'Treatment Plans', icon: Layers },
        { id: 'billing', label: 'Invoices & Receipts', icon: CreditCard }
      ];
    }

    if (role === 'doctor') {
      return [
        { id: 'dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'queue', label: 'Patient Queue', icon: UsersRound },
        { id: 'patients', label: 'Patient Directory', icon: Users },
        { id: 'chart', label: 'Dental Odontogram', icon: Stethoscope },
        { id: 'treatment-plans', label: 'Treatment Plans', icon: Layers },
        { id: 'clinical', label: 'SOAP Notes & Rx', icon: FileText }
      ];
    }

    // Admin
    return [
      { id: 'dashboard', label: 'Practice Overview', icon: LayoutDashboard },
      { id: 'appointments', label: 'All Appointments', icon: Calendar },
      { id: 'queue', label: 'Patient Queue', icon: UsersRound },
      { id: 'patients', label: 'Patient Records', icon: Users },
      { id: 'chart', label: 'Dental Odontogram', icon: Stethoscope },
      { id: 'treatment-plans', label: 'Treatment Plans', icon: Layers },
      { id: 'clinical', label: 'Clinical Records', icon: FileText },
      { id: 'billing', label: 'Billing & POS', icon: CreditCard },
      { id: 'inventory', label: 'Sterile Inventory', icon: Package },
      { id: 'staff', label: 'Doctors & Staff', icon: UserCheck },
      { id: 'reports', label: 'Practice Reports', icon: BarChart3 },
      { id: 'account-access', label: 'User & Account Access', icon: ShieldCheck }
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#F7F5F1]/95 backdrop-blur-2xl border-r border-[#C8B58D]/30 text-[#252525] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-4 border-b border-[#C8B58D]/20 bg-[#EDE8DE]/70">
            <span className="w-9 h-9 rounded-xl bg-[#C8B58D] text-[#252525] flex items-center justify-center border border-[#C8B58D]/40 shadow-xs">
              <ToothIcon size={20} />
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#252525] text-sm tracking-tight leading-none font-display">
                Oralix
              </span>
              <span className="text-[10px] text-[#6F6D69] font-bold uppercase tracking-wider mt-1">
                Clinic Management
              </span>
            </div>
          </div>

          {/* Security Access Badge */}
          <div className="px-3 pt-3 pb-1">
            <div className="p-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 border bg-white/80 border-[#C8B58D]/30 text-[#252525] backdrop-blur-md shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#8FA88D]" />
              <div className="truncate">
                <span className="font-bold uppercase tracking-wide text-[10px] block text-[#252525]">
                  {role === 'admin' ? 'Master Admin' : role === 'doctor' ? 'Clinician Verified' : 'Patient Vault'}
                </span>
                <span className="text-[9px] text-[#6F6D69]">
                  {role === 'patient' ? 'Restricted Access' : 'Zero-Trust Clearance'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#C8B58D] text-[#252525] shadow-xs font-extrabold border border-[#C8B58D]'
                      : 'text-[#6F6D69] hover:bg-[#EDE8DE] hover:text-[#252525] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#252525]' : 'text-[#6F6D69]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Tools in Sidebar */}
          <div className="px-3 py-2 border-t border-[#C8B58D]/20 space-y-1">
            <button
              onClick={onOpenSecurityAudit}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#6F6D69] hover:bg-[#EDE8DE] hover:text-[#252525] transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8FA88D]" />
              <span>Security Center &amp; PINs</span>
            </button>
          </div>
        </div>

        {/* Sidebar Bottom / User info & Lock & Sign out */}
        <div className="p-3 border-t border-[#C8B58D]/20 bg-[#EDE8DE]/60 backdrop-blur-md space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setIsOpen(false);
            }}
            title="Open your Profile & Clinical Credentials"
            className="w-full text-left px-2 py-1.5 flex items-center gap-2.5 rounded-xl hover:bg-white/70 transition cursor-pointer group focus:outline-none"
          >
            <span className="w-8 h-8 rounded-xl bg-[#C8B58D] text-[#252525] text-xs font-black flex items-center justify-center border border-[#C8B58D]/40 shadow-2xs group-hover:scale-105 transition-transform">
              {currentUser.avatarText || currentUser.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-[#252525] truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#6F6D69] capitalize flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8FA88D] inline-block" />
                <span>{currentUser.role}</span>
                <span className="text-[#252525] font-bold ml-auto text-[9px] uppercase tracking-wider">Profile &rarr;</span>
              </p>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onLockTerminal}
              title="Lock Terminal"
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-[#C5A66A] bg-[#C5A66A]/10 hover:bg-[#C5A66A]/20 rounded-lg transition cursor-pointer font-bold border border-[#C5A66A]/30"
            >
              <Lock className="w-3 h-3 text-[#C5A66A]" />
              <span>Lock</span>
            </button>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-[#B97870] bg-[#B97870]/10 hover:bg-[#B97870]/20 rounded-lg transition cursor-pointer font-bold border border-[#B97870]/30"
            >
              <LogOut className="w-3 h-3 text-[#B97870]" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
