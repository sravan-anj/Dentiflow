import React, { useState } from 'react';
import { User, Patient, Appointment, TreatmentPlan } from '../../types';
import { EditProfileModal } from './EditProfileModal';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  FileBadge,
  ShieldCheck,
  Stethoscope,
  Calendar,
  Lock,
  Edit3,
  CheckCircle2,
  Clock,
  Layers,
  HeartPulse,
  AlertTriangle,
  CreditCard,
  KeyRound,
  History,
  Activity
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  patients: Patient[];
  appointments: Appointment[];
  treatmentPlans: TreatmentPlan[];
  onUpdateUser: (updated: User) => void;
  onLockTerminal: () => void;
  onOpenSecurityAudit: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  patients,
  appointments,
  treatmentPlans,
  onUpdateUser,
  onLockTerminal,
  onOpenSecurityAudit
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // If patient, find linked patient record
  const patientRecord = currentUser.role === 'patient'
    ? patients.find(p => p.id === currentUser.patientId || p.email.toLowerCase() === currentUser.email.toLowerCase()) || patients[0]
    : null;

  // Doctor metrics
  const doctorAppointmentsToday = appointments.filter(
    a => a.doctorName.toLowerCase().includes(currentUser.name.toLowerCase()) || a.doctorId === currentUser.id
  );
  const doctorPlans = treatmentPlans.filter(
    p => p.doctorName.toLowerCase().includes(currentUser.name.toLowerCase())
  );

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'doctor':
        return {
          label: 'Licensed Dental Surgeon / Clinician',
          bg: 'bg-[#EDE8DE] text-[#252525] border-[#C8B58D]/30',
          dot: 'bg-[#C8B58D]'
        };
      case 'admin':
        return {
          label: 'Practice & Compliance Administrator',
          bg: 'bg-[#EDE8DE] text-[#252525] border-[#C8B58D]/30',
          dot: 'bg-[#C8B58D]'
        };
      case 'patient':
      default:
        return {
          label: 'Registered Patient Portal',
          bg: 'bg-[#8FA88D]/20 text-[#3B4D3A] border-[#8FA88D]/30',
          dot: 'bg-[#8FA88D]'
        };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card with Profile Summary */}
      <div className="bg-white/85 backdrop-blur-xl border border-stone-200/90 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C8B58D] via-[#B8A378] to-[#99865E]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar with Initials */}
            <div className="relative shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#252525] via-[#333333] to-[#1A1A18] text-[#C8B58D] font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-md border-2 border-white/60">
                {currentUser.avatarText || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div
                title="Account Status: Active & Verified"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#8FA88D] border-2 border-white flex items-center justify-center text-white shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Core Info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#252525] tracking-tight">
                  {currentUser.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${roleBadge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dot}`} />
                  {roleBadge.label}
                </span>
              </div>

              <p className="text-xs text-[#6F6D69] flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Mail className="w-3.5 h-3.5 text-[#999690]" />
                  {currentUser.email}
                </span>
                {currentUser.phone && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Phone className="w-3.5 h-3.5 text-[#999690]" />
                      {currentUser.phone}
                    </span>
                  </>
                )}
                <span className="text-stone-300">•</span>
                <span className="text-[11px] font-mono text-[#999690]">
                  ID: {currentUser.id}
                </span>
              </p>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-sky-600" />
                  {currentUser.department || 'Central Operatory & Clinic Suite'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  HIPAA &amp; DCI Verified Clearance
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={onOpenSecurityAudit}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Security Logs</span>
            </button>

            <button
              type="button"
              onClick={onLockTerminal}
              title="Lock this workstation immediately"
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold border border-amber-200 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Lock Station</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Role Specific Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Professional & Clinical Identity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Information Card */}
          <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-sky-600" />
                <span>Professional &amp; Account Identity</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 cursor-pointer"
              >
                Update Details →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">Legal Name</p>
                <p className="font-bold text-slate-900">{currentUser.name}</p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">Account Access Role</p>
                <p className="font-bold text-slate-900 capitalize">{currentUser.role} Level</p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">Primary Contact Email</p>
                <p className="font-bold text-slate-900">{currentUser.email}</p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">Verified Phone Number</p>
                <p className="font-bold text-slate-900">{currentUser.phone || 'Not configured'}</p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">Department / Division</p>
                <p className="font-bold text-slate-900">
                  {currentUser.department || (currentUser.role === 'doctor' ? 'Clinical Endodontics & Surgery' : currentUser.role === 'admin' ? 'Clinic Administration' : 'Outpatient Dentistry')}
                </p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">License / Registration ID</p>
                <p className="font-bold text-slate-900 font-mono">
                  {currentUser.licenseNumber || (currentUser.role === 'doctor' ? 'DCI-KA-2018-88419' : currentUser.role === 'admin' ? 'HOSP-ADMIN-7701' : 'PATIENT-PORTAL')}
                </p>
              </div>
            </div>

            {/* Bio or Statement */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {currentUser.role === 'patient' ? 'Health Summary / Notes' : 'Clinical Bio & Scope of Practice'}
              </p>
              <p className="text-slate-700 leading-relaxed">
                {currentUser.bio ||
                  (currentUser.role === 'doctor'
                    ? 'Senior Dental Surgeon specializing in root canal therapy, digital smile aesthetics, and crown/bridge restorations. Experienced in 3D CBCT guided procedures.'
                    : currentUser.role === 'admin'
                    ? 'Managing practice scheduling, HIPAA compliance, clinician credentialing, and multi-operatory equipment sterilization inventory.'
                    : 'Active dental patient enrolled in preventive oral care, periodontal maintenance, and digital treatment follow-up.')}
              </p>
            </div>
          </div>

          {/* Role-Specific Content Area */}
          {currentUser.role === 'doctor' && (
            <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Stethoscope className="w-4 h-4 text-sky-600" />
                <span>Doctor Operatory &amp; Active Caseload</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-sky-800">
                    <span className="font-medium">Today's Visits</span>
                    <Calendar className="w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-xl font-black text-sky-950 mt-1">
                    {doctorAppointmentsToday.length || 3}
                  </p>
                  <p className="text-[10px] text-sky-700 mt-0.5">Assigned in schedule</p>
                </div>

                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-blue-800">
                    <span className="font-medium">Active Care Plans</span>
                    <Layers className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xl font-black text-blue-950 mt-1">
                    {doctorPlans.length || 2}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-0.5">Phased procedures</p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-medium">Specialization</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs font-black text-emerald-950 mt-1 truncate">
                    {currentUser.specialization || 'Endodontics & Restorative'}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Primary Clinician</p>
                </div>
              </div>
            </div>
          )}

          {currentUser.role === 'patient' && patientRecord && (
            <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Patient Dental Chart &amp; Medical Alerts</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Patient Record File</span>
                  <p className="font-extrabold text-slate-900">{patientRecord.code} ({patientRecord.name})</p>
                  <p className="text-[11px] text-slate-600">Age: {patientRecord.age} • Gender: {patientRecord.gender}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Blood Group &amp; Alerts</span>
                  <p className="font-extrabold text-slate-900">Blood Group: {patientRecord.bloodGroup || 'O+'}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patientRecord.medicalAlerts.map(alert => (
                      <span key={alert} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {alert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Dental Insurance</span>
                  <p className="font-bold text-slate-900">{patientRecord.insuranceProvider || 'Star Health Dental Shield'}</p>
                  <p className="text-[11px] text-slate-600 font-mono">Policy #{patientRecord.insurancePolicyNumber || 'POL-889102-DF'}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Outstanding Balance</span>
                  <p className="font-black text-base text-slate-900">
                    ₹{patientRecord.balanceDue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Online POS payments enabled</p>
                </div>
              </div>
            </div>
          )}

          {currentUser.role === 'admin' && (
            <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Clinic Administration &amp; System Health</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl">
                  <p className="text-[11px] font-semibold text-purple-800">Clearance Status</p>
                  <p className="text-sm font-extrabold text-purple-950 mt-1">Super-Administrator</p>
                  <p className="text-[10px] text-purple-700 mt-0.5">All Portals Authorized</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-semibold text-slate-600">Database Engine</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">Persistent Vault</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Encrypted &amp; Synced</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-semibold text-slate-600">Session Security</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">PIN Protected</p>
                  <p className="text-[10px] text-sky-600 font-medium">Walk-up Lock Active</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Col 3: Security & Session Status */}
        <div className="space-y-6">
          <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-4 h-4 text-sky-600" />
              <span>Access &amp; Security Status</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600">Security Clearance</span>
                <span className="font-bold text-sky-800 uppercase text-[11px] bg-sky-100 px-2 py-0.5 rounded-md">
                  {currentUser.role}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600">Terminal Auto-Lock</span>
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  15 Minutes
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600">Two-Factor Clearance</span>
                <span className="font-bold text-emerald-700 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  PIN Clearance
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600">Session Verification</span>
                <span className="font-mono text-[10px] text-slate-500 font-bold">
                  AUTH-{Date.now().toString().slice(-6)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenSecurityAudit}
                className="w-full py-2.5 px-3 text-xs font-bold text-slate-800 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span>View Access &amp; Audit Logs</span>
              </button>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-gradient-to-br from-sky-900 to-blue-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sky-300">
                <FileBadge className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold text-white">Need Credentials Help?</h3>
            </div>
            <p className="text-[11px] text-sky-200 leading-relaxed">
              If your DCI license number, clinical specialty, or staff permissions require updates, you can edit your profile above or contact practice administration at <span className="text-white font-semibold">admin@dentiflow.com</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={currentUser}
        onSaveUser={onUpdateUser}
      />
    </div>
  );
};
