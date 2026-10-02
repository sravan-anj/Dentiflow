import React, { useState, useEffect, useMemo } from 'react';
import { TreatmentPlan, Patient, User, PlanStatus, FinancingRequest, TreatmentCatalogueItem } from '../../types';
import { useToast } from '../common/Toast';
import { StorageService } from '../../utils/storage';
import { downloadTreatmentPlanPdfBlob } from '../../utils/pdfGenerator';
import { treatmentService, formatIndianRupees } from '../../utils/treatmentService';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
  Sparkles,
  FileCheck,
  Shield,
  CreditCard,
  ChevronRight,
  Stethoscope,
  BadgePercent,
  Lock,
  X,
  Send,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  Activity,
  ArrowUpDown,
  Filter
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

  // -------------------------------------------------------------
  // Master Treatment Catalogue State
  // -------------------------------------------------------------
  const [catalogue, setCatalogue] = useState<TreatmentCatalogueItem[]>([]);
  const [isLoadingCatalogue, setIsLoadingCatalogue] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('price-asc');

  // Modals for CRUD operations
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentCatalogueItem | null>(null);
  const [deletingTreatment, setDeletingTreatment] = useState<TreatmentCatalogueItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Dedicated Consultation Fee State
  const [consultationFee, setConsultationFee] = useState<number>(() =>
    treatmentService.getConsultationFee()
  );
  const [isEditConsultationModalOpen, setIsEditConsultationModalOpen] = useState<boolean>(false);
  const [editConsultationInput, setEditConsultationInput] = useState<string>('');

  // Form State for Add Treatment
  const [formName, setFormName] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('General Dentistry');
  const [formDescription, setFormDescription] = useState<string>('');

  // Form State for Edit Treatment
  const [editName, setEditName] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('General Dentistry');
  const [editDescription, setEditDescription] = useState<string>('');

  // -------------------------------------------------------------
  // Patient Portal State (preserved for patient accounts)
  // -------------------------------------------------------------
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState<boolean>(false);
  const [financingTenure, setFinancingTenure] = useState<3 | 6 | 12>(6);
  const [employmentType, setEmploymentType] = useState('Salaried Professional');
  const [financingNotes, setFinancingNotes] = useState('');
  const [financingRequests, setFinancingRequests] = useState<FinancingRequest[]>(() =>
    StorageService.getFinancingRequests()
  );

  const isPatient = currentUser.role === 'patient';
  const currentPatient = isPatient
    ? patients.find(p => p.id === (currentUser.patientId || 'p-1')) || patients[0]
    : null;

  const displayedPatientPlans = isPatient
    ? treatmentPlans.filter(p => p.patientId === (currentUser.patientId || 'p-1'))
    : treatmentPlans;

  const myFinancingRequests = isPatient
    ? financingRequests.filter(r => r.patientId === (currentUser.patientId || 'p-1'))
    : financingRequests;

  // Load Catalogue on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchCatalogue = async () => {
      setIsLoadingCatalogue(true);
      try {
        const items = await treatmentService.getTreatments();
        if (isMounted) {
          setCatalogue(items);
        }
      } catch (err) {
        console.error('Error fetching treatment catalogue:', err);
      } finally {
        if (isMounted) {
          setIsLoadingCatalogue(false);
        }
      }
    };
    fetchCatalogue();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync edit modal fields when editing treatment changes
  useEffect(() => {
    if (editingTreatment) {
      setEditName(editingTreatment.name);
      setEditPrice(editingTreatment.price.toString());
      setEditCategory(editingTreatment.category || 'General Dentistry');
      setEditDescription(editingTreatment.description || '');
    }
  }, [editingTreatment]);

  // Available unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogue.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [catalogue]);

  // Filtered and Sorted Catalogue
  const filteredCatalogue = useMemo(() => {
    return catalogue
      .filter(item => {
        const matchesCategory =
          selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [catalogue, selectedCategory, searchTerm, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    if (catalogue.length === 0) {
      return { total: 0, minPrice: 0, maxPrice: 0, avgPrice: 0 };
    }
    const prices = catalogue.map(i => i.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / catalogue.length);
    return {
      total: catalogue.length,
      minPrice,
      maxPrice,
      avgPrice
    };
  }, [catalogue]);

  // -------------------------------------------------------------
  // CRUD Handlers for Master Treatment Catalogue
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setFormName('');
    setFormPrice('');
    setFormCategory('General Dentistry');
    setFormDescription('');
    setIsAddModalOpen(true);
  };

  const handleAddTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      showToast('Please enter a treatment name.', 'error');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid treatment price in Indian Rupees.', 'error');
      return;
    }

    try {
      const newItem = await treatmentService.createTreatment({
        name: cleanName,
        price: priceNum,
        category: formCategory.trim() || 'General Dentistry',
        description: formDescription.trim()
      });

      setCatalogue(prev => [newItem, ...prev.filter(i => i.id !== newItem.id)]);
      setIsAddModalOpen(false);
      showToast(
        `Added "${newItem.name}" (${formatIndianRupees(newItem.price)}) to catalogue`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to create treatment.', 'error');
    }
  };

  const handleSaveEditTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTreatment) return;

    const cleanName = editName.trim();
    if (!cleanName) {
      showToast('Please enter a treatment name.', 'error');
      return;
    }

    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid treatment price.', 'error');
      return;
    }

    try {
      const updated = await treatmentService.updateTreatment(editingTreatment.id, {
        name: cleanName,
        price: priceNum,
        category: editCategory.trim() || 'General Dentistry',
        description: editDescription.trim()
      });

      setCatalogue(prev => prev.map(item => (item.id === updated.id ? updated : item)));
      setEditingTreatment(null);
      showToast(
        `Updated "${updated.name}" to ${formatIndianRupees(updated.price)}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update treatment.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTreatment) return;

    const targetId = deletingTreatment.id;
    const targetName = deletingTreatment.name;
    const targetPrice = deletingTreatment.price;

    try {
      await treatmentService.deleteTreatment(targetId);
      setCatalogue(prev => prev.filter(item => item.id !== targetId));
      setDeletingTreatment(null);
      showToast(
        `Removed "${targetName}" (${formatIndianRupees(targetPrice)}) from catalogue`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to delete treatment.', 'error');
    }
  };

  const handleResetToDefaults = async () => {
    try {
      const defaults = await treatmentService.resetToDefaults();
      setCatalogue(defaults);
      setIsResetConfirmOpen(false);
      showToast('Treatment catalogue reset to standard mock data.', 'success');
    } catch (err: any) {
      showToast('Failed to reset catalogue.', 'error');
    }
  };

  const handleSaveConsultationFee = (e: React.FormEvent) => {
    e.preventDefault();
    const feeNum = parseFloat(editConsultationInput);
    if (isNaN(feeNum) || feeNum < 0) {
      showToast('Please enter a valid consultation fee amount.', 'error');
      return;
    }
    const updated = treatmentService.saveConsultationFee(feeNum);
    setConsultationFee(updated);
    setIsEditConsultationModalOpen(false);
    showToast(`Standard Consultation Fee updated to ${formatIndianRupees(updated)}`, 'success');
  };

  // -------------------------------------------------------------
  // PATIENT VIEW: Preserved for patient accounts
  // -------------------------------------------------------------
  if (isPatient && currentPatient) {
    const totalEstCost = displayedPatientPlans.reduce((acc, p) => acc + p.totalCost, 0);
    const totalInsurance = displayedPatientPlans.reduce((acc, p) => acc + p.insuranceCovered, 0);
    const totalOutOfPocket = displayedPatientPlans.reduce((acc, p) => acc + p.patientPortion, 0);
    const totalProcedures = displayedPatientPlans.reduce((acc, p) => acc + p.procedures.length, 0);

    const handleUpdateStatus = (planId: string, newStatus: PlanStatus) => {
      const updated = treatmentPlans.map(p =>
        p.id === planId ? { ...p, status: newStatus } : p
      );
      onSaveTreatmentPlans(updated);
      showToast(`Treatment plan marked as ${newStatus.replace('_', ' ')}`, 'success');
    };

    const handleSignPlan = (planId: string) => {
      handleUpdateStatus(planId, 'accepted');
      showToast('Consent confirmed! Digitally recorded with clinic audit trail.', 'success');
    };

    const handleDownloadPlanPdf = (plan: TreatmentPlan) => {
      if (plan.patientId !== (currentUser.patientId || 'p-1')) {
        showToast('Unauthorized Access Blocked: You can only download your own treatment plans.', 'error');
        return;
      }
      downloadTreatmentPlanPdfBlob(plan, currentPatient);
      showToast(`Downloaded Treatment Plan PDF: ${plan.title}`, 'success');
    };

    const handleSubmitFinancingRequest = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentPatient) return;

      const totalOut =
        displayedPatientPlans.reduce((acc, p) => acc + p.patientPortion, 0) ||
        currentPatient.balanceDue ||
        15000;
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
      showToast(
        `Financing Request Submitted! 0% EMI Plan of ₹${monthlyAmt.toLocaleString()}/mo over ${financingTenure} months is under review by billing desk.`,
        'success'
      );
    };

    return (
      <div className="space-y-6">
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
            <p className="text-2xl font-black text-[#252525]">{displayedPatientPlans.length}</p>
            <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">
              {displayedPatientPlans[0]?.phase || 'No active plan'}
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

        {/* Active Financing Request Banner */}
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

        {/* Patient Plans List */}
        <div className="space-y-6">
          {displayedPatientPlans.length === 0 ? (
            <div className="bg-white/92 backdrop-blur-md border border-slate-200/80 rounded-2xl p-8 text-center shadow-xs">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Treatment Plans Prescribed Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your dentist will generate an itemized treatment roadmap following your next clinical oral assessment.
              </p>
            </div>
          ) : (
            displayedPatientPlans.map(plan => (
              <div
                key={plan.id}
                className="bg-white/92 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      {plan.phase}
                    </span>
                    <h2 className="text-base font-bold text-gray-900 mt-0.5">{plan.patientName}</h2>
                    <p className="text-xs text-gray-500 font-medium">{plan.title}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        plan.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : plan.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : plan.status === 'completed'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {plan.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleDownloadPlanPdf(plan)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      title="Download PDF"
                    >
                      <Layers className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>

                {/* Procedures Breakdown */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Itemized Clinical Procedures
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

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total Estimate: ₹{plan.totalCost.toLocaleString()} &bull; Out of Pocket: ₹{plan.patientPortion.toLocaleString()}</span>
                  </span>
                  {plan.status === 'proposed' && (
                    <button
                      onClick={() => handleSignPlan(plan.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Confirm Digital Consent
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DOCTOR / ADMIN VIEW: Master Treatment Catalogue Management Module
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-[#C8B58D]/30 shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#C8B58D]" />
            <span>Clinic Master Catalogue &bull; Procedure Tariffs</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
            Treatment Plans &amp; Master Catalogue
          </h1>
          <p className="text-xs text-[#6F6D69] mt-0.5">
            Configure standardized clinical treatments and default pricing for operative consultations, patient roadmaps, and billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5 py-2 px-3"
            title="Reset Catalogue to Default Mock Data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6F6D69]" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 shadow-sm py-2 px-3.5"
          >
            <Plus className="w-4 h-4 text-[#252525]" />
            <span>Add Treatment Plan</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Available Treatments</span>
            <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
              <Layers className="w-4 h-4 text-[#C8B58D]" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">{stats.total}</p>
          <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">
            Across {categories.length - 1} clinical specialties
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Starting Tariff (Min)</span>
            <span className="p-2 rounded-xl bg-[#8FA88D]/20 text-[#3B4D3A]">
              <IndianRupee className="w-4 h-4 text-[#8FA88D]" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#3B4D3A]">
            {stats.total > 0 ? formatIndianRupees(stats.minPrice) : '₹0'}
          </p>
          <p className="text-[11px] text-[#3B4D3A] font-semibold mt-1">
            Diagnostic &amp; preventive entry
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Premium Procedure (Max)</span>
            <span className="p-2 rounded-xl bg-[#C5A66A]/20 text-[#594723]">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">
            {stats.total > 0 ? formatIndianRupees(stats.maxPrice) : '₹0'}
          </p>
          <p className="text-[11px] text-[#C5A66A] font-semibold mt-1">
            Advanced surgical &amp; implantology
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Average Tariff</span>
            <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
              <Activity className="w-4 h-4 text-[#C8B58D]" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">
            {stats.total > 0 ? formatIndianRupees(stats.avgPrice) : '₹0'}
          </p>
          <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">
            Mean procedure standard fee
          </p>
        </div>
      </div>

      {/* 2.5 DEDICATED SEPARATE CONSULTATION FEE SECTION */}
      <div className="bg-gradient-to-r from-amber-500/10 via-[#EDE8DE]/70 to-white/90 backdrop-blur-md border border-[#C8B58D]/40 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 text-[#252525] shrink-0 shadow-2xs">
              <Stethoscope className="w-6 h-6 text-[#C8B58D]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C8B58D]/20 text-[#635028] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8B58D]/30">
                  <Sparkles className="w-3 h-3 text-[#C8B58D]" />
                  <span>Outpatient Visit Tariff &bull; Separate From Procedural Plans</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#8FA88D]/20 text-[#3B4D3A] text-[10px] font-bold border border-[#8FA88D]/30">
                  Includes 7-Day Follow-Up Review
                </span>
              </div>
              <h2 className="text-base font-extrabold text-[#252525]">
                Standard Clinical Consultation Fee
              </h2>
              <p className="text-xs text-[#6F6D69] max-w-2xl leading-relaxed">
                Baseline tariff charged for comprehensive oral clinical examination, triage diagnosis, radiographic review, and specialist treatment roadmap planning. This consultation fee is managed and applied independently from the procedural treatment catalogue below.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-200/60">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#6F6D69] block">
                Standard Fee
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#252525] tracking-tight">
                {formatIndianRupees(consultationFee)}
              </span>
            </div>
            <button
              onClick={() => {
                setEditConsultationInput(consultationFee.toString());
                setIsEditConsultationModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-[#252525] font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Edit Standard Consultation Fee"
            >
              <Pencil className="w-3.5 h-3.5 text-[#C8B58D]" />
              <span>Edit Fee</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6F6D69] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search treatments by name, code (e.g. Root Canal, Implant, Cleaning)..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] placeholder:text-stone-400 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-[#6F6D69] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#C8B58D]" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-xl bg-white text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#C8B58D] cursor-pointer"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Treatment Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-[11px] font-bold text-[#6F6D69] mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#C8B58D]" />
            <span>Specialty:</span>
          </span>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#252525] text-white shadow-2xs'
                    : 'bg-[#EDE8DE]/70 text-[#6F6D69] hover:bg-[#EDE8DE] hover:text-[#252525]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Treatment Plans Table / List */}
      <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoadingCatalogue ? (
          <div className="p-12 text-center text-xs text-[#6F6D69] space-y-2">
            <div className="w-6 h-6 border-2 border-[#C8B58D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-bold">Loading Treatment Plans Catalogue...</p>
          </div>
        ) : filteredCatalogue.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] text-[#252525] flex items-center justify-center mx-auto shadow-2xs">
              <Layers className="w-6 h-6 text-[#C8B58D]" />
            </div>
            <h3 className="text-base font-extrabold text-[#252525]">No Treatments Found</h3>
            <p className="text-xs text-[#6F6D69] max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'All'
                ? `No treatments match "${searchTerm || selectedCategory}". Try adjusting your filters.`
                : 'Your clinic treatment catalogue is currently empty.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              {searchTerm || selectedCategory !== 'All' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button onClick={handleOpenAddModal} className="btn-primary text-xs cursor-pointer">
                  + Add First Treatment
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/75 text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Treatment &amp; Procedure Name</th>
                  <th className="py-3.5 px-4">Specialty / Category</th>
                  <th className="py-3.5 px-4">Procedure Code</th>
                  <th className="py-3.5 px-5 text-right">Standard Tariff (₹)</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredCatalogue.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-stone-50/60 transition-colors group"
                  >
                    {/* Treatment Name & Description */}
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-[#252525] text-sm group-hover:text-[#C8B58D] transition-colors">
                        {item.name}
                      </div>
                      {item.description ? (
                        <p className="text-[11px] text-[#6F6D69] mt-0.5 line-clamp-1 max-w-md">
                          {item.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-400 mt-0.5 italic">
                          Standard clinic tariff protocol
                        </p>
                      )}
                    </td>

                    {/* Category Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EDE8DE]/80 text-[#252525] border border-[#C8B58D]/25">
                        {item.category || 'General'}
                      </span>
                    </td>

                    {/* Procedure Code */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-[#6F6D69]">
                      <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-semibold">
                        {item.code || 'TR-STD'}
                      </span>
                    </td>

                    {/* Price in Indian Rupees */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <span className="text-base font-black text-[#252525] tracking-tight">
                        {formatIndianRupees(item.price)}
                      </span>
                    </td>

                    {/* Edit & Delete Action Buttons */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingTreatment(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:border-[#C8B58D] hover:bg-[#EDE8DE]/40 text-[#252525] font-bold text-xs transition cursor-pointer flex items-center gap-1"
                          title={`Edit ${item.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#C8B58D]" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setDeletingTreatment(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 hover:border-red-400 hover:bg-red-50 text-red-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                          title={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer info */}
        <div className="p-3.5 bg-stone-50/70 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#6F6D69]">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Showing {filteredCatalogue.length} of {catalogue.length} total treatments in clinic master catalogue.
            </span>
          </span>
          <span className="text-stone-500">
            Tariffs automatically populate clinical invoices and treatment plans.
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. ADD TREATMENT PLAN MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-[#252525]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                  <Plus className="w-5 h-5 text-[#C8B58D]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#252525]">
                    Add Treatment Plan
                  </h3>
                  <p className="text-xs text-[#6F6D69]">
                    Register a new procedure into the clinic master tariff catalogue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTreatment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Treatment Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Root Canal, Tooth Implant, Dental Cleaning..."
                  className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] placeholder:text-stone-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Treatment Price (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full pl-8 pr-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] font-bold"
                  />
                </div>
                {formPrice && !isNaN(Number(formPrice)) && Number(formPrice) >= 0 && (
                  <p className="text-[11px] text-[#3B4D3A] font-semibold mt-1">
                    Formatted Tariff Preview: <strong className="font-extrabold">{formatIndianRupees(Number(formPrice))}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Clinical Specialty / Category
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] cursor-pointer"
                >
                  <option value="General Dentistry">General Dentistry</option>
                  <option value="Endodontics">Endodontics (Root Canal)</option>
                  <option value="Implantology">Implantology (Implants)</option>
                  <option value="Preventive">Preventive &amp; Hygiene</option>
                  <option value="Oral Surgery">Oral Surgery (Extractions)</option>
                  <option value="Restorative">Restorative (Fillings)</option>
                  <option value="Radiology / Diagnostics">Radiology / Diagnostics (X-Rays)</option>
                  <option value="Prosthodontics">Prosthodontics (Crowns &amp; Bridges)</option>
                  <option value="Orthodontics">Orthodontics (Aligners &amp; Braces)</option>
                  <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                  <option value="Periodontics">Periodontics (Gum Care)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Clinical Description &amp; Specifications (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="e.g. Includes digital diagnostic radiographs, rotary canal preparation, and bio-inert gutta-percha obturation..."
                  className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] placeholder:text-stone-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#252525]" />
                  <span>Save Treatment Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. EDIT TREATMENT PLAN MODAL */}
      {/* ------------------------------------------------------------- */}
      {editingTreatment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-[#252525]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                  <Pencil className="w-5 h-5 text-[#C8B58D]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#252525]">
                    Edit Treatment Plan
                  </h3>
                  <p className="text-xs text-[#6F6D69]">
                    Modify procedure details, tariff price, or specialty
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTreatment(null)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTreatment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Treatment Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Treatment Price (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] font-bold"
                  />
                </div>
                {editPrice && !isNaN(Number(editPrice)) && Number(editPrice) >= 0 && (
                  <p className="text-[11px] text-[#3B4D3A] font-semibold mt-1">
                    Updated Tariff Preview: <strong className="font-extrabold">{formatIndianRupees(Number(editPrice))}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Clinical Specialty / Category
                </label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] cursor-pointer"
                >
                  <option value="General Dentistry">General Dentistry</option>
                  <option value="Endodontics">Endodontics (Root Canal)</option>
                  <option value="Implantology">Implantology (Implants)</option>
                  <option value="Preventive">Preventive &amp; Hygiene</option>
                  <option value="Oral Surgery">Oral Surgery (Extractions)</option>
                  <option value="Restorative">Restorative (Fillings)</option>
                  <option value="Radiology / Diagnostics">Radiology / Diagnostics (X-Rays)</option>
                  <option value="Prosthodontics">Prosthodontics (Crowns &amp; Bridges)</option>
                  <option value="Orthodontics">Orthodontics (Aligners &amp; Braces)</option>
                  <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                  <option value="Periodontics">Periodontics (Gum Care)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Clinical Description &amp; Specifications
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingTreatment(null)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Update Treatment Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. DELETE CONFIRMATION DIALOG MODAL */}
      {/* ------------------------------------------------------------- */}
      {deletingTreatment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-[#252525]">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-red-50 text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#252525]">
                  Delete Treatment Plan?
                </h3>
                <p className="text-xs text-[#6F6D69] leading-relaxed">
                  Are you sure you want to remove{' '}
                  <strong className="text-[#252525]">
                    {deletingTreatment.name} ({formatIndianRupees(deletingTreatment.price)})
                  </strong>{' '}
                  from the master treatment catalogue?
                </p>
                <p className="text-[11px] text-stone-500 pt-1">
                  This procedure will no longer appear in default selection dropdowns. Past clinical records will remain intact.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeletingTreatment(null)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. RESET DEFAULTS CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-[#252525]">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-[#EDE8DE] text-[#252525] shrink-0">
                <RotateCcw className="w-6 h-6 text-[#C8B58D]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#252525]">
                  Reset Treatment Catalogue?
                </h3>
                <p className="text-xs text-[#6F6D69] leading-relaxed">
                  This will reload the clinic's standard mock treatment list including{' '}
                  <strong className="text-[#252525]">Root Canal (₹4,500), Tooth Implant (₹1,50,000), Dental Cleaning (₹1,000), Tooth Extraction (₹1,500), Dental Filling (₹1,200), Dental X-Ray (₹500)</strong>, and other master procedures.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#252525]" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. EDIT CONSULTATION FEE MODAL */}
      {/* ------------------------------------------------------------- */}
      {isEditConsultationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-[#252525]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                  <Stethoscope className="w-5 h-5 text-[#C8B58D]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#252525]">
                    Edit Consultation Fee
                  </h3>
                  <p className="text-xs text-[#6F6D69]">
                    Set default baseline outpatient clinical consultation tariff
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditConsultationModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConsultationFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Clinical Consultation Fee (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={editConsultationInput}
                    onChange={e => setEditConsultationInput(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-8 pr-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] font-bold"
                    autoFocus
                  />
                </div>
                {editConsultationInput && !isNaN(Number(editConsultationInput)) && Number(editConsultationInput) >= 0 && (
                  <p className="text-[11px] text-[#3B4D3A] font-semibold mt-1">
                    Updated Tariff Preview: <strong className="font-extrabold">{formatIndianRupees(Number(editConsultationInput))}</strong>
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#EDE8DE]/40 border border-stone-200/80 text-[11px] text-[#6F6D69] space-y-1">
                <span className="font-bold text-[#252525] block">Clinical Policy:</span>
                <p>
                  This consultation fee is automatically applied for patient triage, check-in, and clinical assessment, separate from operative procedural fees (such as Root Canal, Extractions, and Implants).
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditConsultationModalOpen(false)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Save Consultation Fee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
