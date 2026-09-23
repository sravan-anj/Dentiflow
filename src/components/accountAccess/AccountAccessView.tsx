import React, { useState } from 'react';
import { User, UserRole, Patient } from '../../types';
import { StorageService } from '../../utils/storage';
import { useToast } from '../common/Toast';
import {
  ShieldCheck,
  UserCheck,
  Search,
  Filter,
  Users,
  Stethoscope,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AccountAccessViewProps {
  currentUser: User;
  patients: Patient[];
  onAccessAccount: (user: User) => void;
}

export const AccountAccessView: React.FC<AccountAccessViewProps> = ({
  currentUser,
  patients,
  onAccessAccount
}) => {
  const { showToast } = useToast();
  const [roleFilter, setRoleFilter] = useState<'all' | 'patient' | 'doctor' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Strict role security: Block if non-admin renders this component
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-[#B97870]/10 border border-[#B97870]/30 rounded-2xl p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-[#B97870] mx-auto" />
        <h3 className="text-base font-extrabold text-[#252525]">Access Restricted</h3>
        <p className="text-xs text-[#6F6D69] max-w-md mx-auto">
          Security Denial: User &amp; Account Access management is strictly limited to authorized System Administrators.
        </p>
      </div>
    );
  }

  const allUsers = StorageService.getUsers();

  const filteredUsers = allUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'doctor':
        return 'bg-sky-100 text-sky-900 border-sky-200';
      case 'patient':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-[#C8B58D]/30 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-[#C8B58D]" />
            <span>Administrative Security Terminal &bull; Clearance L3</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
            User &amp; Account Access
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Inspect registered clinic accounts, verify role credentials, and launch controlled admin view sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#EDE8DE] border border-[#C8B58D]/30 text-xs font-bold text-[#252525] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C8B58D]" />
            <span>{allUsers.length} Total Accounts</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">All Accounts</span>
            <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
              <Users className="w-4 h-4 text-[#C8B58D]" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">{allUsers.length}</p>
          <p className="text-[11px] text-[#6F6D69] mt-1 font-semibold">Registered in system</p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Patients</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <Users className="w-4 h-4 text-emerald-600" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">
            {allUsers.filter(u => u.role === 'patient').length}
          </p>
          <p className="text-[11px] text-emerald-800 mt-1 font-semibold">Active patient records</p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Clinicians</span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-800">
              <Stethoscope className="w-4 h-4 text-sky-600" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">
            {allUsers.filter(u => u.role === 'doctor').length}
          </p>
          <p className="text-[11px] text-sky-800 mt-1 font-semibold">Licensed dental staff</p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Administrators</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-800">
              <Shield className="w-4 h-4 text-purple-600" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">
            {allUsers.filter(u => u.role === 'admin').length}
          </p>
          <p className="text-[11px] text-purple-800 mt-1 font-semibold">Superuser clearance</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'patient', 'doctor', 'admin'] as const).map(f => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer capitalize ${
                roleFilter === f
                  ? 'bg-[#252525] text-white shadow-2xs'
                  : 'bg-[#EDE8DE]/60 text-[#6F6D69] hover:bg-[#EDE8DE] hover:text-[#252525]'
              }`}
            >
              {f === 'all' ? 'All Accounts' : `${f}s`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#6F6D69] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#C8B58D] text-[#252525] placeholder-[#999690]"
          />
        </div>
      </div>

      {/* Users Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const isSelf = user.id === currentUser.id;
          return (
            <div
              key={user.id}
              className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs transition hover:border-[#C8B58D] flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#252525] text-white font-extrabold text-sm flex items-center justify-center border border-[#C8B58D]/30 shadow-2xs shrink-0">
                      {user.avatarText || user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#252525] line-clamp-1">
                        {user.name}
                      </h3>
                      <p className="text-xs text-[#6F6D69] truncate max-w-[180px]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${getRoleBadgeStyle(user.role)}`}>
                    {user.role}
                  </span>
                </div>

                <div className="p-3 bg-[#EDE8DE]/40 rounded-xl border border-stone-200/60 space-y-1.5 text-xs text-[#6F6D69]">
                  <div className="flex items-center justify-between">
                    <span>Account ID:</span>
                    <span className="font-mono font-bold text-[#252525] text-[11px]">{user.id}</span>
                  </div>
                  {user.patientId && (
                    <div className="flex items-center justify-between">
                      <span>Patient Chart Code:</span>
                      <span className="font-mono font-bold text-[#252525] text-[11px]">{user.patientId}</span>
                    </div>
                  )}
                  {user.specialization && (
                    <div className="flex items-center justify-between">
                      <span>Specialization:</span>
                      <span className="font-bold text-[#252525]">{user.specialization}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Account Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#3B4D3A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active &bull; Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#999690]">
                  {isSelf ? 'Current Admin Session' : 'Controlled Admin Action'}
                </span>
                
                {isSelf ? (
                  <span className="px-3 py-1.5 bg-stone-100 text-[#6F6D69] rounded-xl text-xs font-bold border border-stone-200">
                    Active Session
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onAccessAccount(user);
                      showToast(`Launched Admin Access session for ${user.name} (${user.role})`, 'success');
                    }}
                    className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 py-1.5 px-3.5"
                  >
                    <span>Access Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
