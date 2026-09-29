import React, { useState } from 'react';
import {
  Patient,
  Appointment,
  QueueItem,
  Invoice,
  User,
  TreatmentPlan,
  ToothFinding
} from '../../types';
import { StorageService } from '../../utils/storage';
import { ActiveTab } from '../layout/Sidebar';
import { OperatoryChairModal } from './OperatoryChairModal';
import { TodaysVisitsModal } from './TodaysVisitsModal';
import { RevenueModal } from './RevenueModal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Stethoscope,
  UsersRound,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  Sparkles,
  Shield,
  FileText,
  Pill,
  Check,
  ChevronRight,
  Info,
  HeartPulse,
  MapPin,
  Smile
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  patients: Patient[];
  appointments: Appointment[];
  queue: QueueItem[];
  invoices: Invoice[];
  treatmentPlans: TreatmentPlan[];
  toothFindings?: ToothFinding[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewAppointment: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  patients,
  appointments,
  queue,
  invoices,
  treatmentPlans,
  toothFindings = [],
  onNavigate,
  onOpenNewAppointment,
  onSelectPatient
}) => {
  const [isTodaysVisitsOpen, setIsTodaysVisitsOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [selectedChairData, setSelectedChairData] = useState<any | null>(null);

  const isPatient = currentUser.role === 'patient';
  const currentPatient = isPatient
    ? (patients.find(p => (currentUser.patientId && p.id === currentUser.patientId) || p.id === currentUser.id || (p.email && currentUser.email && p.email.toLowerCase() === currentUser.email.toLowerCase())) || StorageService.ensurePatientRecord(currentUser))
    : null;

  // Aggregate Metrics
  const todayVisitsCount = appointments.length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const inQueueCount = queue.filter(q => q.status === 'waiting' || q.status === 'in_chair').length;
  
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

  // Patient view specific calculations
  const patientAppointments = appointments.filter(a => a.patientId === currentPatient?.id);
  const patientPlans = treatmentPlans.filter(p => p.patientId === currentPatient?.id);
  const patientInvoices = invoices.filter(i => i.patientId === currentPatient?.id);

  if (isPatient && currentPatient) {
    const nextApt = patientAppointments.find(a => a.status === 'confirmed' || a.status === 'in_chair') || patientAppointments[0];
    const activePlan = patientPlans[0];
    const totalPaid = patientInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    const totalOutstanding = currentPatient.balanceDue ?? patientInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-[#C8B58D]/30">
              <Sparkles className="w-3 h-3 text-[#C8B58D]" />
              <span>Personal Dental Vault &bull; Record {currentPatient.code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
              Welcome, {currentPatient.name}
            </h1>
            <p className="text-xs text-[#6F6D69] mt-0.5">
              Primary Clinician: <strong className="text-[#252525] font-semibold">Dr. Ananya Sharma</strong> &bull; Blood Group: <strong className="text-[#252525] font-semibold">{currentPatient.bloodGroup || 'O+'}</strong>
            </p>
          </div>

          <button
            onClick={onOpenNewAppointment}
            className="btn-primary flex items-center justify-center gap-1.5 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Medical Safety Alert Banner (if any) */}
        {currentPatient.medicalAlerts.length > 0 && (
          <div className="bg-[#C5A66A]/10 backdrop-blur-xs border border-[#C5A66A]/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#252525] shadow-2xs">
            <div className="p-2 rounded-xl bg-[#C5A66A]/20 text-[#635028] shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[#252525] flex items-center gap-2">
                <span>Medical Safety Alerts on File</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C5A66A]/20 text-[#635028] font-extrabold uppercase">
                  Verified by Clinician
                </span>
              </div>
              <p className="text-[#6F6D69] text-xs mt-0.5 leading-relaxed">
                {currentPatient.medicalAlerts.join(' • ')} &mdash; The clinical team takes standard prophylactic measures prior to administering local anesthetics or operative treatments.
              </p>
            </div>
          </div>
        )}

        {/* 1. NEXT APPOINTMENT SECTION */}
        <div className="bg-gradient-to-r from-[#252525] via-[#2D2A26] to-[#1A1A18] text-white rounded-2xl p-6 shadow-md relative overflow-hidden border border-[#C8B58D]/30">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C8B58D]/20 via-transparent to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#C8B58D]/20 text-[#E8DCC4] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8B58D]/30">
                  NEXT APPOINTMENT
                </span>
                {nextApt && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#8FA88D]/20 text-[#C3D9C1] text-[10px] font-extrabold uppercase tracking-wider border border-[#8FA88D]/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8FA88D] animate-pulse" />
                    {nextApt.status.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-white">
                {nextApt ? nextApt.procedure : 'No Upcoming Appointment Scheduled'}
              </h2>

              {nextApt ? (
                <p className="text-xs text-[#E8DCC4]/90 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C8B58D]" />
                    <span>{nextApt.date} at {nextApt.time}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-[#C8B58D]" />
                    <span>{nextApt.doctorName}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C8B58D]" />
                    <span>{nextApt.chair || 'Operatory Chair 1'}</span>
                  </span>
                </p>
              ) : (
                <p className="text-xs text-[#E8DCC4]/70">
                  Schedule your routine 6-month checkup or consultation with Dr. Ananya Sharma.
                </p>
              )}
            </div>

            <div className="shrink-0">
              <button
                onClick={() => onNavigate('appointments')}
                className="btn-secondary text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#C8B58D]" />
                <span>Manage Appointments</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. TREATMENT PLAN SECTION */}
        <div
          onClick={() => onNavigate('treatment-plans')}
          className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C8B58D] block mb-0.5">
                TREATMENT PLAN SUMMARY
              </span>
              <h3 className="text-base font-extrabold text-[#252525] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#C8B58D]" />
                <span>{activePlan ? activePlan.title : 'Comprehensive Restorative Care Plan'}</span>
              </h3>
            </div>
            <span className="text-xs font-bold text-[#252525] group-hover:text-[#C8B58D] flex items-center gap-1 shrink-0 transition">
              <span>View Full Plan</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#EDE8DE]/60 rounded-xl border border-stone-200/80">
              <span className="text-[10px] text-[#6F6D69] font-bold block uppercase">Current Status</span>
              <span className="font-extrabold text-[#252525] capitalize mt-0.5 block">
                {activePlan ? activePlan.status.replace('_', ' ') : 'Active Maintenance'}
              </span>
            </div>

            <div className="p-3 bg-[#EDE8DE]/60 rounded-xl border border-stone-200/80">
              <span className="text-[10px] text-[#6F6D69] font-bold block uppercase">Next Procedure Step</span>
              <span className="font-extrabold text-[#252525] mt-0.5 block truncate">
                {activePlan?.procedures?.[0]?.name || 'Tooth #16 Zirconia Crown Placement'}
              </span>
            </div>

            <div className="p-3 bg-[#EDE8DE]/60 rounded-xl border border-stone-200/80">
              <span className="text-[10px] text-[#6F6D69] font-bold block uppercase">Prescribed Date</span>
              <span className="font-extrabold text-[#6F6D69] mt-0.5 block">
                {activePlan ? activePlan.dateCreated : 'Recent Assessment'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. DENTAL HEALTH / ODONTOGRAM PREVIEW SECTION */}
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C8B58D] block mb-0.5">
                DENTAL HEALTH SUMMARY
              </span>
              <h3 className="text-base font-extrabold text-[#252525] flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#C8B58D]" />
                <span>Dental Odontogram Status</span>
              </h3>
              <p className="text-xs text-[#6F6D69]">
                Live anatomical record of recorded conditions across your 32 adult teeth
              </p>
            </div>
            <button
              onClick={() => onNavigate('chart')}
              className="btn-secondary text-xs border border-stone-200 flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>Open Full Dental Chart</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Arch Preview Graphic */}
          <div className="bg-[#252525] text-white rounded-xl p-4 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300 border-b border-stone-800 pb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8FA88D]" />
                <span>Anatomical Teeth Map</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400">32 Teeth Tracked</span>
            </div>

            {/* Teeth Pills Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                {Array.from({ length: 16 }, (_, i) => i + 1).map(num => {
                  const finding = toothFindings.find(f => f.patientId === currentPatient.id && f.toothNumber === num);
                  const cond = finding?.condition;
                  const isCrown = cond === 'crown';
                  const isRestored = cond === 'filling';
                  const isWatch = cond === 'watch';
                  const isCaries = cond === 'cavity';
                  const isRCT = cond === 'root_canal';
                  const isMissing = cond === 'missing';
                  const isImplant = cond === 'implant';
                  const hasCondition = Boolean(finding && cond !== 'healthy');

                  return (
                    <div
                      key={num}
                      onClick={() => onNavigate('chart')}
                      title={`Tooth #${num}: ${hasCondition ? (cond ? cond.replace('_', ' ').toUpperCase() : 'Condition Recorded') : 'Healthy & Sound'}`}
                      className={`w-7 h-8 rounded-md flex flex-col items-center justify-center text-[10px] font-extrabold shrink-0 border transition cursor-pointer ${
                        isCrown
                          ? 'bg-[#C8B58D] text-[#252525] border-[#E8DCC4]'
                          : isRestored
                          ? 'bg-[#8FA88D] text-white border-[#A4BDA2]'
                          : isWatch
                          ? 'bg-[#C5A66A] text-white border-[#D6B77B]'
                          : isCaries
                          ? 'bg-rose-600 text-white border-rose-400'
                          : isRCT
                          ? 'bg-[#C8B58D] text-[#252525] border-[#E8DCC4]'
                          : isImplant
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : isMissing
                          ? 'bg-stone-700 text-stone-400 border-stone-600'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}
                    >
                      <span>{num}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                {Array.from({ length: 16 }, (_, i) => i + 17).map(num => {
                  const finding = toothFindings.find(f => f.patientId === currentPatient.id && f.toothNumber === num);
                  const cond = finding?.condition;
                  const isCrown = cond === 'crown';
                  const isRestored = cond === 'filling';
                  const isWatch = cond === 'watch';
                  const isCaries = cond === 'cavity';
                  const isRCT = cond === 'root_canal';
                  const isMissing = cond === 'missing';
                  const isImplant = cond === 'implant';
                  const hasCondition = Boolean(finding && cond !== 'healthy');

                  return (
                    <div
                      key={num}
                      onClick={() => onNavigate('chart')}
                      title={`Tooth #${num}: ${hasCondition ? (cond ? cond.replace('_', ' ').toUpperCase() : 'Condition Recorded') : 'Healthy & Sound'}`}
                      className={`w-7 h-8 rounded-md flex flex-col items-center justify-center text-[10px] font-extrabold shrink-0 border transition cursor-pointer ${
                        isCrown
                          ? 'bg-[#C8B58D] text-[#252525] border-[#E8DCC4]'
                          : isRestored
                          ? 'bg-[#8FA88D] text-white border-[#A4BDA2]'
                          : isWatch
                          ? 'bg-[#C5A66A] text-white border-[#D6B77B]'
                          : isCaries
                          ? 'bg-rose-600 text-white border-rose-400'
                          : isRCT
                          ? 'bg-[#C8B58D] text-[#252525] border-[#E8DCC4]'
                          : isImplant
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : isMissing
                          ? 'bg-stone-700 text-stone-400 border-stone-600'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}
                    >
                      <span>{num}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. PAYMENT SUMMARY SECTION */}
        <div
          onClick={() => onNavigate('billing')}
          className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8FA88D] block mb-0.5">
                PAYMENT SUMMARY
              </span>
              <h3 className="text-base font-extrabold text-[#252525] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#8FA88D]" />
                <span>Account &amp; Treatment Settlement</span>
              </h3>
            </div>
            <span className="text-xs font-bold text-[#252525] group-hover:text-[#C8B58D] flex items-center gap-1 shrink-0 transition">
              <span>View Payment Details</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#8FA88D]/15 rounded-xl border border-[#8FA88D]/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-[#3B4D3A] block uppercase">Amount Paid</span>
                <span className="text-2xl font-black text-[#252525] mt-1 block">
                  INR ₹{totalPaid.toLocaleString()}
                </span>
              </div>
              <CheckCircle2 className="w-8 h-8 text-[#8FA88D] opacity-80" />
            </div>

            <div className="p-4 bg-[#C5A66A]/15 rounded-xl border border-[#C5A66A]/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-[#594723] block uppercase">Outstanding Amount</span>
                <span className="text-2xl font-black text-[#252525] mt-1 block">
                  INR ₹{totalOutstanding.toLocaleString()}
                </span>
              </div>
              {totalOutstanding > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('billing');
                  }}
                  className="btn-primary font-bold text-xs shrink-0 flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Now</span>
                </button>
              ) : (
                <CreditCard className="w-8 h-8 text-[#C5A66A] opacity-80" />
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Receptionist Dashboard View
  if (currentUser.role === 'receptionist') {
    const todayAppointments = appointments;
    const waitingQueue = queue.filter(q => q.status === 'waiting');
    const unpaidInvoices = invoices.filter(i => i.status !== 'paid');

    return (
      <div className="space-y-6">
        {/* Receptionist Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-bold uppercase tracking-wider mb-1 border border-[#C8B58D]/30">
              <ShieldCheck className="w-3 h-3 text-[#8FA88D]" />
              <span>Front Desk Reception &amp; Billing Terminal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
              Reception Operations &amp; POS
            </h1>
            <p className="text-xs text-[#6F6D69]">
              Patient check-ins, appointment arrival intake, instant invoice generation, and collection recording.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewAppointment}
              className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => onNavigate('billing')}
              className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-[#8FA88D]" />
              <span>Open Billing &amp; POS</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('appointments')}
            className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[#6F6D69] mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#252525]">Today's Schedule</span>
              <Calendar className="w-4 h-4 text-[#C8B58D]" />
            </div>
            <p className="text-2xl font-black text-[#252525]">{todayAppointments.length}</p>
            <p className="text-[11px] text-[#6F6D69] mt-1">{completedCount} Completed &bull; View Schedule &rarr;</p>
          </div>

          <div
            onClick={() => onNavigate('queue')}
            className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[#6F6D69] mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#252525]">Waiting Room</span>
              <UsersRound className="w-4 h-4 text-[#C5A66A]" />
            </div>
            <p className="text-2xl font-black text-[#252525]">{waitingQueue.length}</p>
            <p className="text-[11px] text-[#594723] mt-1">In Queue / Checked-in &rarr;</p>
          </div>

          <div
            onClick={() => onNavigate('billing')}
            className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[#6F6D69] mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#252525]">Today's Collections</span>
              <CheckCircle2 className="w-4 h-4 text-[#8FA88D]" />
            </div>
            <p className="text-2xl font-black text-[#252525]">INR ₹{totalCollected.toLocaleString()}</p>
            <p className="text-[11px] text-[#3B4D3A] mt-1">Settled payments on file &rarr;</p>
          </div>

          <div
            onClick={() => onNavigate('billing')}
            className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[#6F6D69] mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#252525]">Pending Balances</span>
              <CreditCard className="w-4 h-4 text-[#B97870]" />
            </div>
            <p className="text-2xl font-black text-[#252525]">INR ₹{totalOutstanding.toLocaleString()}</p>
            <p className="text-[11px] text-[#B97870] mt-1">{unpaidInvoices.length} Invoices Pending &rarr;</p>
          </div>
        </div>

        {/* Receptionist Main Grid: Today's Appointments & Pending Billing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments Table */}
          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8B58D]" />
                <h3 className="font-bold text-sm text-[#252525]">Today's Patient Schedule</h3>
              </div>
              <button
                onClick={() => onNavigate('appointments')}
                className="text-xs text-[#C8B58D] font-bold hover:underline"
              >
                View All &rarr;
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6F6D69]">
                <Calendar className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="font-semibold text-stone-700">No appointments scheduled today</p>
                <p className="mt-1">Book an appointment or register a walk-in patient.</p>
                <button
                  onClick={onOpenNewAppointment}
                  className="btn-primary text-xs mt-3 mx-auto flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Appointment</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {todayAppointments.slice(0, 6).map(apt => {
                  const pat = patients.find(p => p.id === apt.patientId);
                  return (
                    <div key={apt.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-[#252525]">{pat?.name || apt.patientName}</p>
                        <p className="text-[11px] text-[#6F6D69]">
                          {apt.time} &bull; {apt.procedure} &bull; {apt.doctorName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'completed'
                            ? 'bg-[#8FA88D]/20 text-[#3B4D3A]'
                            : apt.status === 'in_chair'
                            ? 'bg-[#C8B58D] text-[#252525]'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {apt.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            if (apt.patientId) onSelectPatient(apt.patientId);
                            onNavigate('billing');
                          }}
                          className="px-2 py-1 bg-stone-100 hover:bg-[#EDE8DE] text-[#252525] rounded font-bold text-[10px] transition"
                        >
                          Bill
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Invoices / Quick Billing Action */}
          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8FA88D]" />
                <h3 className="font-bold text-sm text-[#252525]">Pending Balances &amp; Collections</h3>
              </div>
              <button
                onClick={() => onNavigate('billing')}
                className="text-xs text-[#C8B58D] font-bold hover:underline"
              >
                Open POS &rarr;
              </button>
            </div>

            {unpaidInvoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6F6D69]">
                <CheckCircle2 className="w-8 h-8 mx-auto text-[#8FA88D] mb-2" />
                <p className="font-semibold text-stone-700">All invoices are settled in full!</p>
                <p className="mt-1">Create an invoice when treatments are completed.</p>
                <button
                  onClick={() => onNavigate('billing')}
                  className="btn-secondary text-xs mt-3 mx-auto flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Invoice</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {unpaidInvoices.slice(0, 6).map(inv => {
                  const pat = patients.find(p => p.id === inv.patientId);
                  return (
                    <div key={inv.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-[#252525]">{inv.invoiceNumber} &bull; {pat?.name || 'Patient'}</p>
                        <p className="text-[11px] text-[#6F6D69]">
                          Billed: INR ₹{(inv.total ?? 0).toLocaleString()} &bull; Balance: <strong className="text-rose-600">INR ₹{inv.balanceDue.toLocaleString()}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (inv.patientId) onSelectPatient(inv.patientId);
                          onNavigate('billing');
                        }}
                        className="px-2.5 py-1 bg-[#8FA88D] hover:bg-[#7D967B] text-white rounded font-bold text-[10px] transition"
                      >
                        Collect Payment
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Doctor & Admin Dashboard View
  const CHAIR_DEFINITIONS = [
    { id: 'chair-1', name: 'Chair 1 - Endodontics', defaultDoctor: 'Dr. Ananya Sharma' },
    { id: 'chair-2', name: 'Chair 2 - Oral Surgery', defaultDoctor: 'Dr. Vikram Mehta' },
    { id: 'chair-3', name: 'Chair 3 - Aesthetics & Hygiene', defaultDoctor: 'Dr. Priya Sen' }
  ];

  const chairStatuses = CHAIR_DEFINITIONS.map(chair => {
    const inChairApt = appointments.find(a => 
      a.status === 'in_chair' && 
      (a.chair === chair.id || a.chair === chair.name || a.chair?.includes(chair.id.split('-')[1]))
    );
    const nextApt = !inChairApt ? appointments.find(a =>
      a.status === 'confirmed' &&
      (a.chair === chair.id || a.chair === chair.name || a.chair?.includes(chair.id.split('-')[1]))
    ) : undefined;

    const activeApt = inChairApt || nextApt;
    const patient = activeApt ? patients.find(p => p.id === activeApt.patientId) : undefined;
    const isOccupied = Boolean(inChairApt);

    return {
      chair,
      activeApt,
      patient,
      isOccupied,
      isNextInLine: Boolean(nextApt)
    };
  });

  const activeCareCount = chairStatuses.filter(c => c.isOccupied).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-bold uppercase tracking-wider mb-1 border border-[#C8B58D]/30">
            <Sparkles className="w-3 h-3 text-[#C8B58D]" />
            <span>Clinic Operatory Terminal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
            Practice Overview
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Real-time operatory chair status, queue times, and patient treatment workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role !== 'admin' && currentUser.role !== 'doctor' && (
            <button
              onClick={onOpenNewAppointment}
              className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('chart')}
            className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Stethoscope className="w-4 h-4 text-[#C8B58D]" />
            <span>Open Odontogram</span>
          </button>
        </div>
      </div>

      {/* Primary 4 Vertical Dashboard Options */}
      <div className="grid grid-cols-1 gap-4.5">
        
        {/* Option 1: TODAY'S VISITS */}
        <div
          onClick={() => setIsTodaysVisitsOpen(true)}
          className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md transition cursor-pointer group flex items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#6F6D69]">
              <span className="p-2.5 rounded-xl bg-[#EDE8DE] text-[#252525] group-hover:bg-[#C8B58D]/20 transition">
                <Calendar className="w-5 h-5 text-[#C8B58D]" />
              </span>
              <span className="text-sm font-extrabold uppercase tracking-wider text-[#252525] group-hover:text-[#C8B58D] transition">
                TODAY'S VISITS
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#252525] tracking-tight pt-1">
              {todayVisitsCount}
            </p>
            <p className="text-xs text-[#252525] font-bold flex items-center gap-1">
              <span>Inspect Today's Appointments &amp; Live Waiting Room</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#C8B58D]" />
            </p>
          </div>

          <div className="shrink-0 text-right hidden sm:block">
            <span className="px-3.5 py-1.5 rounded-xl bg-[#EDE8DE] text-[#252525] font-extrabold text-xs border border-[#C8B58D]/30">
              Appointments + Queue Hub &rarr;
            </span>
          </div>
        </div>

        {/* Option 2: APPOINTMENTS COMPLETED */}
        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md transition cursor-pointer group flex items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#6F6D69]">
              <span className="p-2.5 rounded-xl bg-[#8FA88D]/20 text-[#3B4D3A] group-hover:bg-[#8FA88D]/30 transition">
                <CheckCircle2 className="w-5 h-5 text-[#8FA88D]" />
              </span>
              <span className="text-sm font-extrabold uppercase tracking-wider text-[#252525] group-hover:text-[#8FA88D] transition">
                APPOINTMENTS COMPLETED
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#252525] tracking-tight pt-1">
              {completedCount}
            </p>
            <p className="text-xs text-[#3B4D3A] font-bold flex items-center gap-1">
              <span>All clinical treatment notes signed &bull; Open Log</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div className="shrink-0 text-right hidden sm:block">
            <span className="px-3.5 py-1.5 rounded-xl bg-[#8FA88D]/20 text-[#3B4D3A] font-extrabold text-xs border border-[#8FA88D]/30">
              Completed Calendar &rarr;
            </span>
          </div>
        </div>

        {/* Option 3: IN QUEUE */}
        <div
          onClick={() => onNavigate('queue')}
          className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md transition cursor-pointer group flex items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#6F6D69]">
              <span className="p-2.5 rounded-xl bg-[#C5A66A]/20 text-[#594723] group-hover:bg-[#C5A66A]/30 transition">
                <UsersRound className="w-5 h-5 text-[#C5A66A]" />
              </span>
              <span className="text-sm font-extrabold uppercase tracking-wider text-[#252525] group-hover:text-[#C5A66A] transition">
                IN QUEUE
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#252525] tracking-tight pt-1">
              {inQueueCount}
            </p>
            <p className="text-xs text-[#594723] font-bold flex items-center gap-1">
              <span>Patients currently checked-in / waiting &bull; Open Queue Board</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div className="shrink-0 text-right hidden sm:block">
            <span className="px-3.5 py-1.5 rounded-xl bg-[#C5A66A]/20 text-[#594723] font-extrabold text-xs border border-[#C5A66A]/30">
              Queue Display Screen &rarr;
            </span>
          </div>
        </div>

        {/* Option 4: REVENUE COLLECTED */}
        <div
          onClick={() => setIsRevenueModalOpen(true)}
          className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md transition cursor-pointer group flex items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#6F6D69]">
              <span className="p-2.5 rounded-xl bg-[#EDE8DE] text-[#252525] group-hover:bg-[#C8B58D]/20 transition">
                <CreditCard className="w-5 h-5 text-[#C8B58D]" />
              </span>
              <span className="text-sm font-extrabold uppercase tracking-wider text-[#252525] group-hover:text-[#C8B58D] transition">
                REVENUE COLLECTED
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#252525] tracking-tight pt-1">
              INR ₹{totalCollected.toLocaleString()}
            </p>
            <p className="text-xs text-[#6F6D69] font-bold flex items-center gap-1">
              <span>₹{totalOutstanding.toLocaleString()} pending settlement &bull; Financial Ledger</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div className="shrink-0 text-right hidden sm:block">
            <span className="px-3.5 py-1.5 rounded-xl bg-[#EDE8DE] text-[#252525] font-extrabold text-xs border border-[#C8B58D]/30">
              Revenue Breakdown &rarr;
            </span>
          </div>
        </div>

      </div>

      {/* Operatory Chairs Live Status */}
      <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#C8B58D]" />
            <h2 className="text-sm font-bold text-[#252525]">Operatory Dental Chairs</h2>
          </div>
          <span className="text-xs font-bold text-[#3B4D3A] bg-[#8FA88D]/20 px-2.5 py-0.5 rounded-full border border-[#8FA88D]/30">
            {activeCareCount} / {CHAIR_DEFINITIONS.length} In Active Care
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chairStatuses.map(({ chair, activeApt, patient, isOccupied, isNextInLine }) => {
            const hasActivity = isOccupied || isNextInLine;
            return (
              <div
                key={chair.id}
                onClick={() =>
                  setSelectedChairData({
                    chairId: chair.id,
                    chairName: chair.name,
                    doctorName: activeApt?.doctorName || chair.defaultDoctor,
                    appointment: activeApt,
                    patient
                  })
                }
                className={`border rounded-xl p-3.5 relative shadow-2xs cursor-pointer transition group ${
                  isOccupied
                    ? 'border-[#C8B58D]/30 bg-[#EDE8DE]/40 hover:bg-[#EDE8DE]/70'
                    : isNextInLine
                    ? 'border-stone-200 bg-stone-50/70 hover:bg-stone-100'
                    : 'border-[#8FA88D]/30 bg-[#8FA88D]/10 hover:bg-[#8FA88D]/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#252525] group-hover:text-[#C8B58D] transition">
                    {chair.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOccupied
                        ? 'bg-[#C8B58D] text-[#252525]'
                        : isNextInLine
                        ? 'bg-[#C5A66A]/20 text-[#594723]'
                        : 'bg-[#8FA88D]/20 text-[#3B4D3A]'
                    }`}
                  >
                    {isOccupied ? 'In Chair' : isNextInLine ? 'Next In Line' : 'Sterilized / Ready'}
                  </span>
                </div>

                {hasActivity && activeApt ? (
                  <>
                    <p className="text-xs font-bold text-[#252525]">
                      {patient?.name || activeApt.patientName || 'Patient'} {patient?.code ? `(${patient.code})` : ''}
                    </p>
                    <p className="text-[11px] text-[#6F6D69] truncate">
                      {activeApt.doctorName || chair.defaultDoctor} &bull; {activeApt.procedure}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#6F6D69] border-t border-stone-200 pt-2">
                      <span>{activeApt.time || 'Today'}</span>
                      <span className="font-bold text-[#252525] group-hover:text-[#C8B58D] flex items-center gap-0.5 transition">
                        Inspect Operatory &rarr;
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-[#252525]">{chair.defaultDoctor}</p>
                    <p className="text-[11px] text-[#6F6D69]">Sterilized &bull; No active patient in chair</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#6F6D69] border-t border-[#8FA88D]/30 pt-2">
                      <span>Available for intake</span>
                      <span className="font-bold text-[#3B4D3A] group-hover:underline flex items-center gap-0.5">
                        Assign Chair &rarr;
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Operatory Chair Detail Modal */}
      <OperatoryChairModal
        isOpen={Boolean(selectedChairData)}
        onClose={() => setSelectedChairData(null)}
        chairData={selectedChairData}
        onSelectPatient={onSelectPatient}
        onNavigateToChart={() => onNavigate('chart')}
        onOpenNewAppointment={onOpenNewAppointment}
      />

      {/* Consolidated Today's Visits Modal */}
      <TodaysVisitsModal
        isOpen={isTodaysVisitsOpen}
        onClose={() => setIsTodaysVisitsOpen(false)}
        appointments={appointments}
        patients={patients}
        queue={queue}
        onSelectPatient={onSelectPatient}
        onNavigateToChart={() => onNavigate('chart')}
        onOpenNewAppointment={onOpenNewAppointment}
      />

      {/* Revenue Breakdown Modal */}
      <RevenueModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        invoices={invoices}
        patients={patients}
        onSelectPatient={onSelectPatient}
        onNavigateToBilling={() => onNavigate('billing')}
      />
    </div>
  );
};
