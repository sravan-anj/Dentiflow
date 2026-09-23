import React, { useState, useEffect } from 'react';
import { SecurityService } from '../../utils/security';
import { SecurityAuditLog, SecurityCredentials } from '../../types/security';
import { ShieldCheck, ShieldAlert, KeyRound, Lock, History, Settings, X, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  currentUserRole
}) => {
  const [tab, setTab] = useState<'audit' | 'settings'>('audit');
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [creds, setCreds] = useState<SecurityCredentials>(() => SecurityService.getCredentials());
  const [adminPinInput, setAdminPinInput] = useState('');
  const [doctorPinInput, setDoctorPinInput] = useState('');
  const [autoLockInput, setAutoLockInput] = useState(15);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLogs(SecurityService.getAuditLogs());
      const currentCreds = SecurityService.getCredentials();
      setCreds(currentCreds);
      setAdminPinInput(currentCreds.adminPin);
      setDoctorPinInput(currentCreds.doctorPin);
      setAutoLockInput(currentCreds.autoLockMinutes);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SecurityCredentials = {
      ...creds,
      adminPin: adminPinInput.trim() || '9042',
      doctorPin: doctorPinInput.trim() || '4482',
      autoLockMinutes: autoLockInput
    };
    SecurityService.saveCredentials(updated);
    setCreds(updated);
    setLogs(SecurityService.getAuditLogs());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRefresh = () => {
    setLogs(SecurityService.getAuditLogs());
  };

  const handleResetLockouts = () => {
    SecurityService.clearFailedAttempts();
    handleRefresh();
    alert('Security lockouts and cooldown timers have been reset.');
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    return log.status === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Security Operations &amp; Access Control
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero-Trust Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Unauthorized access prevention, live audit trails, and clinic PIN credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('audit')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                tab === 'audit'
                  ? 'bg-white text-sky-700 border-sky-600 shadow-2xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({logs.length})</span>
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                tab === 'settings'
                  ? 'bg-white text-sky-700 border-sky-600 shadow-2xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>PIN &amp; Security Settings</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            title="Refresh logs"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {tab === 'audit' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setFilter('ALL')}
                    className={`px-3 py-1 rounded font-semibold cursor-pointer transition ${
                      filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Events ({logs.length})
                  </button>
                  <button
                    onClick={() => setFilter('CRITICAL')}
                    className={`px-3 py-1 rounded font-semibold cursor-pointer transition flex items-center gap-1 ${
                      filter === 'CRITICAL' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Blocked Intrusion Attempts</span>
                  </button>
                  <button
                    onClick={() => setFilter('WARNING')}
                    className={`px-3 py-1 rounded font-semibold cursor-pointer transition ${
                      filter === 'WARNING' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    PIN Failures
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetLockouts}
                  className="text-xs text-sky-700 hover:text-sky-800 font-semibold underline cursor-pointer"
                >
                  Reset Active Lockouts
                </button>
              </div>

              {/* Log List */}
              <div className="space-y-2.5">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl">
                    No security events found under this filter.
                  </div>
                ) : (
                  filteredLogs.map(log => {
                    const isCritical = log.status === 'CRITICAL';
                    const isWarning = log.status === 'WARNING';
                    return (
                      <div
                        key={log.id}
                        className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          isCritical
                            ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                            : isWarning
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider ${
                              isCritical 
                                ? 'bg-rose-600 text-white' 
                                : isWarning 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {log.type.replace(/_/g, ' ')}
                            </span>
                            <span className="font-bold text-slate-900">{log.actor}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-[11px] text-slate-500 capitalize">Role: {log.targetRole}</span>
                          </div>
                          <p className="text-xs leading-relaxed font-medium">
                            {log.details}
                          </p>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Terminal: {log.ipAddress}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono shrink-0">
                          {log.timestamp}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Security configuration and credentials updated successfully.</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-sky-600" />
                  <span>Portal Clearance Passcodes</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Clinic Administrator PIN
                    </label>
                    <input
                      type="text"
                      value={adminPinInput}
                      onChange={(e) => setAdminPinInput(e.target.value)}
                      placeholder="9042"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-sky-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Required for Practice P&amp;L, Staff Salaries, and Inventory Costing
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Doctor &amp; Clinician Staff PIN
                    </label>
                    <input
                      type="text"
                      value={doctorPinInput}
                      onChange={(e) => setDoctorPinInput(e.target.value)}
                      placeholder="4482"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-sky-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Required for Odontogram modifications, SOAP clinical notes, and treatment plans
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto Lock settings */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-600" />
                  <span>Inactivity Operatory Auto-Lock</span>
                </h4>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 5, label: '5 Minutes' },
                    { val: 15, label: '15 Minutes (Default)' },
                    { val: 30, label: '30 Minutes' },
                    { val: 0, label: 'Disabled' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setAutoLockInput(opt.val)}
                      className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                        autoLockInput === opt.val
                          ? 'border-sky-600 bg-sky-600 text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Workstation automatically locks if clinician steps away to treat a patient, preventing unauthorized walk-up tampering.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Security Credentials</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
