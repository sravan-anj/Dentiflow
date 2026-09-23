import React from 'react';
import { Patient, Appointment, ToothFinding, Invoice, User } from '../../types';
import { ActiveTab } from '../layout/Sidebar';
import { Search, User as UserIcon, Calendar, Stethoscope, CreditCard, X, ChevronRight, AlertCircle } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  patients: Patient[];
  appointments: Appointment[];
  toothFindings: ToothFinding[];
  invoices: Invoice[];
  currentUser: User;
  onSelectPatient: (patientId: string) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  patients,
  appointments,
  toothFindings,
  invoices,
  currentUser,
  onSelectPatient,
  onNavigate
}) => {
  if (!isOpen) return null;

  const query = searchQuery.trim().toLowerCase();
  const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'admin';

  // If patient, restrict search scope to own records
  const accessiblePatients = isDoctor
    ? patients
    : patients.filter(p => p.id === (currentUser.patientId || 'p-1'));

  const accessibleAppointments = isDoctor
    ? appointments
    : appointments.filter(a => a.patientId === (currentUser.patientId || 'p-1'));

  const accessibleFindings = isDoctor
    ? toothFindings
    : toothFindings.filter(f => f.patientId === (currentUser.patientId || 'p-1'));

  const accessibleInvoices = isDoctor
    ? invoices
    : invoices.filter(i => i.patientId === (currentUser.patientId || 'p-1'));

  // Perform search filtering
  const matchedPatients = query
    ? accessiblePatients.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.phone.includes(query) ||
          p.email.toLowerCase().includes(query)
      )
    : [];

  const matchedAppointments = query
    ? accessibleAppointments.filter(
        a =>
          a.patientName.toLowerCase().includes(query) ||
          a.procedure.toLowerCase().includes(query) ||
          a.doctorName.toLowerCase().includes(query) ||
          a.chair.toLowerCase().includes(query) ||
          (a.tokenNumber && a.tokenNumber.toLowerCase().includes(query))
      )
    : [];

  const matchedFindings = query
    ? accessibleFindings.filter(
        f =>
          `tooth ${f.toothNumber}`.includes(query) ||
          `tooth #${f.toothNumber}`.includes(query) ||
          f.condition.toLowerCase().includes(query) ||
          f.diagnosis.toLowerCase().includes(query) ||
          (f.recommendedTreatment && f.recommendedTreatment.toLowerCase().includes(query))
      )
    : [];

  const matchedInvoices = query
    ? accessibleInvoices.filter(
        i =>
          i.patientName.toLowerCase().includes(query) ||
          i.invoiceNumber.toLowerCase().includes(query) ||
          i.status.toLowerCase().includes(query) ||
          (i.description && i.description.toLowerCase().includes(query))
      )
    : [];

  const totalResults =
    matchedPatients.length +
    matchedAppointments.length +
    matchedFindings.length +
    matchedInvoices.length;

  const handleSelectPatientClick = (patientId: string, tab: ActiveTab = 'chart') => {
    onSelectPatient(patientId);
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-white">
        
        {/* Search Input Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patients by name, code, procedure, tooth #, invoice..."
            autoFocus
            className="w-full bg-transparent border-none text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-0 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/10"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!query && (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-500 mx-auto opacity-60" />
              <p className="text-xs font-semibold">Type a patient name, ID (e.g. DF-2026-001), procedure, or tooth # to search</p>
            </div>
          )}

          {query && totalResults === 0 && (
            <div className="py-10 text-center space-y-2">
              <AlertCircle className="w-9 h-9 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No results found for "{searchQuery}"</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No matching patients, appointments, dental chart findings, or billing records were found in the database.
              </p>
            </div>
          )}

          {/* Patient Matches */}
          {matchedPatients.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-sky-400 px-1">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Patients ({matchedPatients.length})</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {matchedPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatientClick(p.id, 'chart')}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-sky-300 transition">
                          {p.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                          {p.code}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {p.age} yrs &bull; {p.gender}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Phone: {p.phone} &bull; Email: {p.email}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointment Matches */}
          {matchedAppointments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 px-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Appointments ({matchedAppointments.length})</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {matchedAppointments.map(apt => (
                  <div
                    key={apt.id}
                    onClick={() => handleSelectPatientClick(apt.patientId, 'appointments')}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition">
                          {apt.patientName}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          &bull; {apt.procedure}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {apt.date} at {apt.time} &bull; {apt.doctorName} &bull; {apt.chair}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      apt.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {apt.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dental Chart Matches */}
          {matchedFindings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-purple-400 px-1">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Dental Chart Findings ({matchedFindings.length})</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {matchedFindings.map(finding => {
                  const patient = patients.find(p => p.id === finding.patientId);
                  return (
                    <div
                      key={finding.id}
                      onClick={() => handleSelectPatientClick(finding.patientId, 'chart')}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                            Tooth #{finding.toothNumber}
                          </span>
                          <span className="font-bold text-xs text-white">
                            {patient?.name || 'Patient'}
                          </span>
                          <span className="text-xs text-amber-300 font-semibold uppercase">
                            ({finding.condition})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {finding.diagnosis}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invoice Matches */}
          {matchedInvoices.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-teal-400 px-1">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Invoices &amp; Billing ({matchedInvoices.length})</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {matchedInvoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => handleSelectPatientClick(inv.patientId, 'billing')}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {inv.patientName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {inv.invoiceNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Total: ₹{(inv.totalAmount || inv.total || 0).toLocaleString()} &bull; Paid: ₹{inv.amountPaid.toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-slate-950/60 text-right text-[11px] text-slate-400">
          Showing results filtered from active clinic records
        </div>
      </div>
    </div>
  );
};
