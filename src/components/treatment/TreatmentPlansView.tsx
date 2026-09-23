import React, { useState, useEffect } from 'react';
import { TreatmentPlan, Patient, User, PlanStatus, FinancingRequest } from '../../types';
import { useToast } from '../common/Toast';
import { StorageService } from '../../utils/storage';
import { downloadTreatmentPlanPdfBlob } from '../../utils/pdfGenerator';
import {
  Layers,
  Plus,
  CheckCircle2,
  Clock,
  Shield,
  CreditCard,
  FileCheck,
  ChevronRight,
  Sparkles,
  Download,
  HelpCircle,
  Info,
  Calendar,
  Stethoscope,
  BadgePercent,
  FileText,
  Check,
  Lock,
  X,
  Send,
  AlertCircle
} from 'lucide-react';

interface TreatmentPlansViewProps {
  currentUser: User;
  treatmentPlans: TreatmentPlan[];
  patients: Patient[];
  onSaveTreatmentPlans: (plans: TreatmentPlan[]) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
}

export const TreatmentPlansView: React.FC<TreatmentPlansViewProps> = ({
  currentUser,
  treatmentPlans,
  patients,
  onSaveTreatmentPlans,
  onSelectPatient,
  onNavigateToChart
}) => {
  const { showToast } = useToast();
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [selectedPlanPatientId, setSelectedPlanPatientId] = useState(patients[0]?.id || '');
  const [filterPatientId, setFilterPatientId] = useState<string>('all');
  const [planTitle, setPlanTitle] = useState('Comprehensive Restorative Care Plan');
  const [planPhase, setPlanPhase] = useState('Phase 1: Urgent Relief & Stabilization');
  const [planProcedures, setPlanProcedures] = useState([
    { name: 'Molar Endodontic Therapy (D3330)', fee: 9500, tooth: 16 },
    { name: 'Fiber Post & Core Buildup (D2950)', fee: 3800, tooth: 16 },
    { name: 'Full Zirconia Crown (D2740)', fee: 8500, tooth: 16 }
  ]);
  const [planDiscount, setPlanDiscount] = useState(1500);
  const [insuranceEstimate, setInsuranceEstimate] = useState(10000);

  // Financing State
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  const [financingTenure, setFinancingTenure] = useState<3 | 6 | 12>(6);
  const [employmentType, setEmploymentType] = useState('Salaried Professional');
  const [financingNotes, setFinancingNotes] = useState('');
  const [financingRequests, setFinancingRequests] = useState<FinancingRequest[]>(() => StorageService.getFinancingRequests());

  const isPatient = currentUser.role === 'patient';
  const currentPatient = isPatient
    ? patients.find(p => p.id === (currentUser.patientId || 'p-1')) || patients[0]
    : null;

  const displayedPlans = isPatient
    ? treatmentPlans.filter(p => p.patientId === (currentUser.patientId || 'p-1'))
    : filterPatientId === 'all'
    ? treatmentPlans
    : treatmentPlans.filter(p => p.patientId === filterPatientId);

  const myFinancingRequests = isPatient
    ? financingRequests.filter(r => r.patientId === (currentUser.patientId || 'p-1'))
    : financingRequests;

  const handleUpdateStatus = (planId: string, newStatus: PlanStatus) => {
    const updated = treatmentPlans.map(p =>
      p.id === planId ? { ...p, status: newStatus } : p
    );
    onSaveTreatmentPlans(updated);
    showToast(`Treatment plan marked as ${newStatus.replace('_', ' ')}`, 'success');
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPlanPatientId) || patients[0];
    const total = planProcedures.reduce((acc, curr) => acc + curr.fee, 0);
    const patientPay = Math.max(0, total - planDiscount - insuranceEstimate);

    const newPlan: TreatmentPlan = {
      id: `plan-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorName: currentUser.name || 'Dr. Ananya Sharma',
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'proposed',
      title: planTitle,
      phase: planPhase,
      totalCost: total,
      discount: planDiscount,
      insuranceCovered: insuranceEstimate,
      patientPortion: patientPay,
      procedures: planProcedures.map((p, idx) => ({
        id: `proc-${Date.now()}-${idx}`,
        toothNumber: p.tooth,
        code: 'D2750',
        name: p.name,
        fee: p.fee,
        status: 'pending'
      }))
    };

    onSaveTreatmentPlans([newPlan, ...treatmentPlans]);
    setFilterPatientId(patient.id);
    setIsBuildModalOpen(false);
    showToast(`Created treatment plan for ${patient.name}`, 'success');
  };

  const handleSignPlan = (planId: string) => {
    handleUpdateStatus(planId, 'accepted');
    showToast('Consent confirmed! Digitally recorded with clinic audit trail.', 'success');
  };

  // Direct PDF Download Handler
  const handleDownloadPlanPdf = (plan: TreatmentPlan) => {
    // Security check: Patient can only download their own treatment plan
    if (isPatient && plan.patientId !== (currentUser.patientId || 'p-1')) {
      showToast('Unauthorized Access Blocked: You can only download your own treatment plans.', 'error');
      return;
    }
    const patientObj = patients.find(p => p.id === plan.patientId) || currentPatient;
    downloadTreatmentPlanPdfBlob(plan, patientObj);
    showToast(`Downloaded Treatment Plan PDF: ${plan.title}`, 'success');
  };

  // Financing Request Submission
  const handleSubmitFinancingRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    const totalOut = displayedPlans.reduce((acc, p) => acc + p.patientPortion, 0) || currentPatient.balanceDue || 15000;
    const monthlyAmt = Math.round(totalOut / financingTenure);

    const newReq: FinancingRequest = {
      id: `fin-${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      requestedAmount: totalOut,
      tenureMonths: financingTenure,
      monthlyInstallment: monthlyAmt,
      status: 'submitted',
      submittedDate: new Date().toISOString().split('T')[0],
      employmentStatus: employmentType,
      notes: financingNotes
    };

    const updated = [newReq, ...financingRequests];
    setFinancingRequests(updated);
    StorageService.saveFinancingRequests(updated);

    setIsFinancingModalOpen(false);
    setFinancingNotes('');
    showToast(`Financing Request Submitted! 0% EMI Plan of ₹${monthlyAmt.toLocaleString()}/mo over ${financingTenure} months is under review by billing desk.`, 'success');
  };

  // -------------------------------------------------------------
  // PATIENT VIEW: Dedicated, Level 10 Patient Treatment Roadmap
  // -------------------------------------------------------------
  if (isPatient && currentPatient) {
    const totalEstCost = displayedPlans.reduce((acc, p) => acc + p.totalCost, 0);
    const totalInsurance = displayedPlans.reduce((acc, p) => acc + p.insuranceCovered, 0);
    const totalOutOfPocket = displayedPlans.reduce((acc, p) => acc + p.patientPortion, 0);
    const totalProcedures = displayedPlans.reduce((acc, p) => acc + p.procedures.length, 0);

    return (
      <div className="space-y-6">
        {/* Top Header Banner matching Main UI */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-[#C8B58D]/30 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#C8B58D]" />
              <span>Patient Care Blueprint &bull; Treatment Roadmap</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
              My Treatment Roadmap &amp; Care Plan
            </h1>
            <p className="text-xs text-[#6F6D69]">
              Review prescribed clinical phases, tooth-by-tooth procedures, estimated coverage, and transparent out-of-pocket costs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onNavigateToChart}
              className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Stethoscope className="w-4 h-4 text-[#252525]" />
              <span>View Interactive Odontogram</span>
            </button>
          </div>
        </div>

        {/* 4 Patient Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6F6D69]">Active Phases</span>
              <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                <Layers className="w-4 h-4 text-[#C8B58D]" />
              </span>
            </div>
            <p className="text-2xl font-black text-[#252525]">{displayedPlans.length}</p>
            <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">
              {displayedPlans[0]?.phase || 'No active plan'}
            </p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6F6D69]">Total Procedures</span>
              <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                <FileCheck className="w-4 h-4 text-[#C8B58D]" />
              </span>
            </div>
            <p className="text-2xl font-black text-[#252525]">{totalProcedures}</p>
            <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">Across all phases</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6F6D69]">Insurance &amp; Courtesy</span>
              <span className="p-2 rounded-xl bg-[#8FA88D]/20 text-[#3B4D3A]">
                <Shield className="w-4 h-4 text-[#8FA88D]" />
              </span>
            </div>
            <p className="text-2xl font-black text-[#3B4D3A]">₹{(totalInsurance + 1500).toLocaleString()}</p>
            <p className="text-[11px] text-[#3B4D3A] font-semibold mt-1">Covered &amp; discounted</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6F6D69]">Est. Out-of-Pocket</span>
              <span className="p-2 rounded-xl bg-[#C5A66A]/20 text-[#594723]">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900">₹{totalOutOfPocket.toLocaleString()}</p>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">0% EMI options available</p>
          </div>
        </div>

        {/* Active Financing Request Status Banner if present */}
        {myFinancingRequests.length > 0 && (
          <div className="bg-sky-950 text-white border border-sky-800 rounded-2xl p-5 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <BadgePercent className="w-4 h-4" />
                </span>
                <span className="font-extrabold text-sm text-white">Active CareFinancing Application</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                STATUS: {myFinancingRequests[0].status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Requested <span className="font-bold text-white">₹{myFinancingRequests[0].requestedAmount.toLocaleString()}</span> over{' '}
              <span className="font-bold text-white">{myFinancingRequests[0].tenureMonths} Months</span> at{' '}
              <span className="font-bold text-emerald-400">₹{myFinancingRequests[0].monthlyInstallment.toLocaleString()}/mo</span>.
              Submitted on {myFinancingRequests[0].submittedDate}.
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="space-y-6">
          {displayedPlans.length === 0 ? (
            <div className="bg-white/92 backdrop-blur-md border border-slate-200/80 rounded-2xl p-8 text-center shadow-xs">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Treatment Plans Prescribed Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your dentist will generate an itemized treatment roadmap following your next clinical oral assessment.
              </p>
            </div>
          ) : (
            displayedPlans.map(plan => (
              <div
                key={plan.id}
                className="bg-white/92 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5"
              >
                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold uppercase tracking-wider border border-sky-200">
                        {plan.phase}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        plan.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : plan.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : plan.status === 'completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {plan.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 mt-2">{plan.title}</h2>
                    <p className="text-xs text-slate-500">
                      Prescribed by {plan.doctorName} &bull; Created {plan.dateCreated}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPlanPdf(plan)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-600" />
                      <span>Download PDF</span>
                    </button>
                    {plan.status === 'proposed' && (
                      <button
                        onClick={() => handleSignPlan(plan.id)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign &amp; Consent to Plan</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Procedures Breakdown */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    Procedures &amp; Clinical Steps
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {plan.procedures.map((proc, idx) => (
                      <div
                        key={proc.id || idx}
                        className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            {proc.toothNumber ? (
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-extrabold border border-sky-200">
                                Tooth #{proc.toothNumber}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-extrabold">
                                General
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-400 font-bold">
                              Code: {proc.code || 'D2750'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-2">{proc.name}</h4>
                        </div>
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-slate-500 text-[11px]">Clinical Fee</span>
                          <span className="font-extrabold text-slate-900">
                            ₹{proc.fee.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Breakdown Table & Visual Bar */}
                <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Financial Estimate &amp; Coverage Breakdown</span>
                    <span className="text-slate-500">Gross Total: ₹{plan.totalCost.toLocaleString()}</span>
                  </div>

                  {/* Progress visualization */}
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.round((plan.insuranceCovered / plan.totalCost) * 100)}%` }}
                      className="bg-sky-500 h-full"
                      title="Insurance Covered"
                    />
                    <div
                      style={{ width: `${Math.round((plan.discount / plan.totalCost) * 100)}%` }}
                      className="bg-emerald-500 h-full"
                      title="Clinic Courtesy"
                    />
                    <div
                      style={{ width: `${Math.round((plan.patientPortion / plan.totalCost) * 100)}%` }}
                      className="bg-amber-400 h-full"
                      title="Patient Out of Pocket"
                    />
                  </div>

                  <div className="grid grid-cols-3 text-xs gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-sky-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>Insurance: ₹{plan.insuranceCovered.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Courtesy: ₹{plan.discount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Patient Pay: ₹{plan.patientPortion.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Footer note & Odontogram link */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>DentiFlow HIPAA-compliant treatment estimate &bull; Final claim subject to provider pre-authorization.</span>
                  </span>
                  <button
                    onClick={onNavigateToChart}
                    className="text-sky-700 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Inspect In Dental Odontogram</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real Working Flexible Payment & Financing Section */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">Flexible Payment &amp; Insurance Support</h4>
                <p className="text-xs text-slate-400">Zero-interest EMI financing and direct cashless insurance claim settlement</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 self-start sm:self-auto">
              0% Interest EMI Eligible
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* EMI 3 Months */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                <span>3-Month Tenure</span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px]">Zero Fee</span>
              </div>
              <p className="text-lg font-black text-white">₹{Math.round((totalOutOfPocket || 15000) / 3).toLocaleString()} <span className="text-xs font-semibold text-slate-400">/ mo</span></p>
              <p className="text-[11px] text-slate-400">Automatic monthly auto-debit via UPI or Credit Card.</p>
            </div>

            {/* EMI 6 Months */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                <span>6-Month Tenure</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">Zero Fee</span>
              </div>
              <p className="text-lg font-black text-white">₹{Math.round((totalOutOfPocket || 15000) / 6).toLocaleString()} <span className="text-xs font-semibold text-slate-400">/ mo</span></p>
              <p className="text-[11px] text-slate-400">No processing charges or hidden bank fees.</p>
            </div>

            {/* Cashless Insurance */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>Cashless Insurance</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Instant</span>
              </div>
              <p className="text-sm font-bold text-white">Direct Pre-Authorization</p>
              <p className="text-[11px] text-slate-400">Star Health &bull; HDFC ERGO &bull; ICICI Lombard &bull; Max Bupa</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Need help setting up EMI or insurance pre-auth? Apply for DentiFlow CareFinancing below.</span>
            </span>
            <button
              onClick={() => setIsFinancingModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              Request Financing Assistance
            </button>
          </div>
        </div>

        {/* Real Working Financing Application Modal */}
        {isFinancingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                    <BadgePercent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Apply for DentiFlow CareFinancing
                    </h3>
                    <p className="text-xs text-slate-500">
                      0% Interest EMI Healthcare Loan &bull; Instant Desk Authorization
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFinancingModalOpen(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitFinancingRequest} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Requested Balance to Finance:</span>
                    <span className="text-slate-900 font-extrabold">₹{(totalOutOfPocket || 15000).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Calculated mathematically from your active treatment out-of-pocket balance.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select EMI Tenure Duration *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([3, 6, 12] as const).map(m => {
                      const monthly = Math.round((totalOutOfPocket || 15000) / m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFinancingTenure(m)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            financingTenure === m
                              ? 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-500/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-extrabold">{m} Months</div>
                          <div className="text-sm font-black text-sky-600 mt-1">₹{monthly.toLocaleString()}<span className="text-[10px] font-normal text-slate-500">/mo</span></div>
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">0% Interest</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employment / Income Status *
                  </label>
                  <select
                    value={employmentType}
                    onChange={e => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Salaried Professional">Salaried Professional (Corporate / Govt)</option>
                    <option value="Self-Employed / Business">Self-Employed / Business Owner</option>
                    <option value="Freelancer / Consultant">Freelancer / Independent Consultant</option>
                    <option value="Student / Dependent">Dependent / Family Supported</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Additional Notes for Billing Desk
                  </label>
                  <textarea
                    rows={2}
                    value={financingNotes}
                    onChange={e => setFinancingNotes(e.target.value)}
                    placeholder="Specify preferred auto-debit dates or insurance co-pay notes..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFinancingModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Financing Request</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Doctor / Admin View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            CARE PLANS &bull; CLINICAL ARCHITECTURE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Treatment plans
          </h1>
          <p className="text-xs text-gray-500">
            Turn clinical findings into transparent, structured treatment steps.
          </p>
        </div>

        {!isPatient && (
          <button
            onClick={() => setIsBuildModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Build plan</span>
          </button>
        )}
      </div>

      {/* Patient Filter Bar for Doctor / Admin */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-700">Filter Plans by Patient:</label>
          <select
            value={filterPatientId}
            onChange={e => setFilterPatientId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-md bg-gray-50 text-gray-800 focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Patients ({treatmentPlans.length} plans total)</option>
            {patients.map(p => {
              const count = treatmentPlans.filter(tp => tp.patientId === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) — {count} plan{count === 1 ? '' : 's'}
                </option>
              );
            })}
          </select>
        </div>

        {filterPatientId !== 'all' && (
          <button
            onClick={() => setFilterPatientId('all')}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Reset Filter (Show All)
          </button>
        )}
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayedPlans.map(plan => (
          <div
            key={plan.id}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    {plan.phase}
                  </span>
                  <h2 className="text-base font-bold text-gray-900 mt-0.5">{plan.patientName}</h2>
                  <p className="text-xs text-gray-500 font-medium">{plan.title}</p>
                </div>

                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                  plan.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : plan.status === 'accepted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : plan.status === 'completed'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {plan.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Procedures Breakdown */}
              <div className="my-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Procedures &amp; Steps
                </span>
                <div className="space-y-1.5">
                  {plan.procedures.map((proc, idx) => (
                    <div
                      key={proc.id || idx}
                      className="p-2.5 rounded bg-gray-50 border border-gray-200/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {proc.toothNumber && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            #{proc.toothNumber}
                          </span>
                        )}
                        <span className="font-semibold text-gray-800">{proc.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        ₹{proc.fee.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="bg-gray-50/80 p-3 rounded-md border border-gray-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Gross Procedure Total</span>
                  <span className="font-semibold">₹{plan.totalCost.toLocaleString()}</span>
                </div>
                {plan.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Clinic Courtesy Discount</span>
                    <span>- ₹{plan.discount.toLocaleString()}</span>
                  </div>
                )}
                {plan.insuranceCovered > 0 && (
                  <div className="flex items-center justify-between text-blue-700">
                    <span>Estimated Insurance Coverage</span>
                    <span>- ₹{plan.insuranceCovered.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-bold text-gray-900 text-sm">
                  <span>Estimated Patient Out-of-Pocket</span>
                  <span className="text-blue-700">₹{plan.patientPortion.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Plan Action Footer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPlanPdf(plan)}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download PDF</span>
              </button>

              <div className="flex items-center gap-2">
                {plan.status === 'proposed' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(plan.id, 'accepted')}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Plan</span>
                  </button>
                )}
                {plan.status === 'accepted' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(plan.id, 'in_progress')}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded transition shadow-2xs cursor-pointer"
                  >
                    Start Phase
                  </button>
                )}
                {plan.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(plan.id, 'completed')}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-2xs cursor-pointer"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Build Plan Modal */}
      {isBuildModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Build Treatment Plan</h2>
              <button
                onClick={() => setIsBuildModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Patient *
                </label>
                <select
                  value={selectedPlanPatientId}
                  onChange={e => setSelectedPlanPatientId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={e => setPlanTitle(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phase Classification
                </label>
                <select
                  value={planPhase}
                  onChange={e => setPlanPhase(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Phase 1: Urgent Relief & Stabilization">
                    Phase 1: Urgent Relief &amp; Stabilization
                  </option>
                  <option value="Phase 2: Restorative Revision & Prosthodontics">
                    Phase 2: Restorative Revision &amp; Prosthodontics
                  </option>
                  <option value="Phase 3: Aesthetics & Clear Aligners">
                    Phase 3: Aesthetics &amp; Clear Aligners
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Courtesy Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={planDiscount}
                    onChange={e => setPlanDiscount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Estimated Insurance (₹)
                  </label>
                  <input
                    type="number"
                    value={insuranceEstimate}
                    onChange={e => setInsuranceEstimate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBuildModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs cursor-pointer"
                >
                  Save Treatment Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
