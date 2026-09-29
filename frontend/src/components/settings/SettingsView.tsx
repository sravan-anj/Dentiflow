import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { apiClient } from '../../utils/apiClient';
import {
  Settings,
  Building,
  Users,
  ShieldCheck,
  Save,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Activity,
  Calendar,
  FileText
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
}

interface ClinicConfig {
  id: string;
  name: string;
  tagline?: string;
  phone: string;
  email: string;
  address: string;
  chairs: string[];
  businessHours?: string;
  registrationNumber?: string;
  taxRatePct?: number;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'admin' | 'patient' | 'receptionist';
  status?: 'active' | 'inactive';
  phone?: string;
  specialization?: string;
}

interface AuditLogItem {
  id: string;
  clinicId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ip?: string;
  timestamp: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'clinic' | 'users' | 'audit'>('clinic');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Clinic details state
  const [clinic, setClinic] = useState<ClinicConfig>({
    id: 'clinic-ox-main',
    name: 'Oralix Dental Medicine & Technology',
    tagline: 'Precision Operatory Dental Architecture',
    phone: '+91 80 4567 8900',
    email: 'contact@oralix.online',
    address: '42, Indiranagar 100ft Road, Bangalore, KA 560038',
    chairs: ['chair-1', 'chair-2', 'chair-3'],
    businessHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
    registrationNumber: 'KA-MED-DENT-2026-9921',
    taxRatePct: 0
  });

  // Users state
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'doctor' | 'receptionist' | 'admin'>('receptionist');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserSpecialization, setNewUserSpecialization] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const isAdmin = currentUser.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [clinicRes, usersRes, auditRes] = await Promise.all([
        apiClient.settings.getClinic(),
        isAdmin ? apiClient.settings.getUsers() : Promise.resolve({ success: true, users: [] }),
        isAdmin ? apiClient.settings.getAuditLogs() : Promise.resolve({ success: true, logs: [] }),
      ]);

      if (clinicRes && (clinicRes as any).success && (clinicRes as any).clinic) {
        setClinic((clinicRes as any).clinic);
      }

      if (usersRes && (usersRes as any).success && (usersRes as any).users) {
        setUsersList((usersRes as any).users);
      }

      if (auditRes && (auditRes as any).success && (auditRes as any).logs) {
        setAuditLogs((auditRes as any).logs);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load clinic settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only clinic administrators can update practice settings.');
      return;
    }

    try {
      setSaveLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await apiClient.settings.updateClinic(clinic);
      if (res && (res as any).success) {
        setSuccessMsg('Clinic settings saved successfully.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword.trim()) {
      alert('Name, email, and password are required.');
      return;
    }

    try {
      setSaveLoading(true);
      const res = await apiClient.settings.createUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
        phone: newUserPhone.trim(),
        specialization: newUserSpecialization.trim()
      });

      if (res && (res as any).success) {
        setIsAddUserOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserPhone('');
        setNewUserSpecialization('');
        await loadData();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to provision user.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: UserItem) => {
    const nextStatus = user.status === 'inactive' ? 'active' : 'inactive';
    try {
      const res = await apiClient.settings.updateUserStatus(user.id, nextStatus);
      if (res && (res as any).success) {
        setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-bold uppercase tracking-wider mb-1 border border-[#C8B58D]/30">
            <ShieldCheck className="w-3 h-3 text-[#8FA88D]" />
            <span>Master Practice Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
            Clinic Settings &amp; Governance
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Configure dental facility records, staff clearance levels, operatory chairs, and inspect immutable audit logs.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C8B58D] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveSubTab('clinic')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'clinic'
              ? 'bg-[#C8B58D] text-[#252525] shadow-xs'
              : 'text-[#6F6D69] hover:bg-stone-100 hover:text-[#252525]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Practice Details</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'users'
                  ? 'bg-[#C8B58D] text-[#252525] shadow-xs'
                  : 'text-[#6F6D69] hover:bg-stone-100 hover:text-[#252525]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff &amp; Permissions</span>
            </button>

            <button
              onClick={() => setActiveSubTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'audit'
                  ? 'bg-[#C8B58D] text-[#252525] shadow-xs'
                  : 'text-[#6F6D69] hover:bg-stone-100 hover:text-[#252525]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Immutable Audit Trail</span>
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: CLINIC DETAILS */}
      {activeSubTab === 'clinic' && (
        <form onSubmit={handleSaveClinic} className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-extrabold text-base text-[#252525]">Facility &amp; Invoicing Details</h3>
            <p className="text-xs text-[#6F6D69]">These official credentials appear on receipts, patient invoices, and verification certificates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#252525] mb-1">Clinic Legal Name</label>
              <input
                type="text"
                value={clinic.name}
                onChange={e => setClinic({ ...clinic, name: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C8B58D]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#252525] mb-1">Tagline / Mission</label>
              <input
                type="text"
                value={clinic.tagline || ''}
                onChange={e => setClinic({ ...clinic, tagline: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C8B58D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#252525] mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={clinic.phone}
                onChange={e => setClinic({ ...clinic, phone: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C8B58D]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#252525] mb-1">Primary Email Address</label>
              <input
                type="email"
                value={clinic.email}
                onChange={e => setClinic({ ...clinic, email: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C8B58D]"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#252525] mb-1">Registered Clinic Address</label>
              <input
                type="text"
                value={clinic.address}
                onChange={e => setClinic({ ...clinic, address: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C8B58D]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#252525] mb-1">Business &amp; Operatory Hours</label>
              <input
                type="text"
                value={clinic.businessHours || ''}
                onChange={e => setClinic({ ...clinic, businessHours: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C8B58D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#252525] mb-1">Dental Council Registration No.</label>
              <input
                type="text"
                value={clinic.registrationNumber || ''}
                onChange={e => setClinic({ ...clinic, registrationNumber: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#C8B58D]"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                type="submit"
                disabled={saveLoading}
                className="btn-primary text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveLoading ? 'Saving...' : 'Save Practice Details'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: USERS & PERMISSIONS */}
      {activeSubTab === 'users' && isAdmin && (
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-[#252525]">Staff Clearance &amp; Accounts</h3>
              <p className="text-xs text-[#6F6D69]">Manage clinician credentials, front desk receptionist roles, and master administrators.</p>
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="btn-primary text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Provision User</span>
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {usersList.map(user => (
              <div key={user.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EDE8DE] text-[#252525] font-black flex items-center justify-center border border-[#C8B58D]/30">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#252525]">{user.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'doctor'
                          ? 'bg-blue-100 text-blue-800'
                          : user.role === 'receptionist'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6F6D69]">{user.email} &bull; {user.specialization || user.phone || 'Staff Member'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    user.status === 'inactive' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {user.status === 'inactive' ? 'INACTIVE' : 'ACTIVE'}
                  </span>
                  {user.id !== currentUser.id && (
                    <button
                      onClick={() => handleToggleUserStatus(user)}
                      className="px-2.5 py-1 border border-stone-200 text-[#252525] rounded-lg text-[10px] font-bold hover:bg-stone-100 transition cursor-pointer"
                    >
                      {user.status === 'inactive' ? 'Activate' : 'Deactivate'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: IMMUTABLE AUDIT TRAIL */}
      {activeSubTab === 'audit' && isAdmin && (
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-[#252525]">Immutable Compliance &amp; Audit Trail</h3>
              <p className="text-xs text-[#6F6D69]">Cryptographically verifiable ledger of security actions, billing receipts, and permissions.</p>
            </div>
            <span className="text-[10px] font-mono bg-stone-100 px-2 py-1 rounded text-stone-700">
              {auditLogs.length} Records Logged
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6F6D69]">
              <ShieldCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700">Audit trail initialized</p>
              <p className="mt-0.5">Administrative events, payments, and resets will record here continuously.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-[#6F6D69] text-[10px] uppercase tracking-wider">
                    <th className="pb-2 font-bold">Action</th>
                    <th className="pb-2 font-bold">Actor</th>
                    <th className="pb-2 font-bold">Entity</th>
                    <th className="pb-2 font-bold">Details</th>
                    <th className="pb-2 font-bold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {auditLogs.slice(0, 30).map(log => (
                    <tr key={log.id} className="hover:bg-stone-50/60">
                      <td className="py-2.5 font-mono text-[11px] font-bold text-[#252525]">
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#252525]">{log.userEmail || 'System'}</td>
                      <td className="py-2.5 text-[#6F6D69]">{log.entityType || '&mdash;'}</td>
                      <td className="py-2.5 text-[#6F6D69] max-w-xs truncate">{log.details || '&mdash;'}</td>
                      <td className="py-2.5 text-right font-mono text-[10px] text-[#6F6D69]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Provision User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C8B58D]" />
                <h3 className="font-extrabold text-base text-[#252525]">Provision Staff Account</h3>
              </div>
              <button onClick={() => setIsAddUserOpen(false)} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#252525] mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Kavya Nair"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[#252525] mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="kavya@oralix.online"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[#252525] mb-1">Initial Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#252525] mb-1">Access Role</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="doctor">Dentist / Doctor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#252525] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={e => setNewUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {newUserRole === 'doctor' && (
                <div>
                  <label className="block font-bold text-[#252525] mb-1">Dental Specialization</label>
                  <input
                    type="text"
                    value={newUserSpecialization}
                    onChange={e => setNewUserSpecialization(e.target.value)}
                    placeholder="e.g. Endodontics, Orthodontics"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-[#252525] rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="btn-primary font-bold"
                >
                  {saveLoading ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
