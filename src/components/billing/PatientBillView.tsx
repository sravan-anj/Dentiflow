import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Invoice,
  Patient,
  Appointment,
  InvoiceItem,
  TreatmentCatalogueItem,
  TreatmentPlan,
  TreatmentProcedureItem
} from '../../types';
import { useToast } from '../common/Toast';
import { formatIndianRupees, treatmentService } from '../../utils/treatmentService';
import { StorageService } from '../../utils/storage';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  AlertCircle,
  Receipt,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Send,
  Download,
  X,
  Search,
  Check,
  ClipboardList,
  Filter,
  RefreshCw,
  Percent,
  Tag,
  BadgePercent,
  RotateCcw
} from 'lucide-react';

interface PatientBillViewProps {
  patient: Patient;
  invoice?: Invoice | null;
  appointment?: Appointment | null;
  treatmentPlans?: TreatmentPlan[];
  catalogueItems?: TreatmentCatalogueItem[];
  onSave: (
    updatedInvoice: Invoice,
    updatedPatientData: { age: number; gender: 'Male' | 'Female' | 'Other' },
    sendToReceptionist?: boolean
  ) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onBack: () => void;
}

export interface BillItemForm {
  id: string;
  description: string;
  tooth?: number | '';
  fee: number | '';
  code?: string;
}

export const PatientBillView: React.FC<PatientBillViewProps> = ({
  patient,
  invoice,
  appointment,
  treatmentPlans = [],
  catalogueItems = [],
  onSave,
  onDeleteInvoice,
  onBack
}) => {
  const { showToast } = useToast();

  // Modal State for Importing Treatments from Treatment Plans
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [showAllClinicPlans, setShowAllClinicPlans] = useState(false);
  const [modalTab, setModalTab] = useState<'catalogue' | 'roadmaps'>('catalogue');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Real Treatment Plans State (fetched directly from Doctor Dashboard Treatment Plans data source: treatmentService)
  const [realTreatments, setRealTreatments] = useState<TreatmentCatalogueItem[]>(() => {
    if (catalogueItems && catalogueItems.length > 0) return catalogueItems;
    return treatmentService.getTreatmentsSync();
  });
  const [isLoadingTreatments, setIsLoadingTreatments] = useState<boolean>(false);
  const [treatmentFetchError, setTreatmentFetchError] = useState<string | null>(null);

  const loadRealTreatments = useCallback(async () => {
    setIsLoadingTreatments(true);
    setTreatmentFetchError(null);
    try {
      const items = await treatmentService.getTreatments();
      if (items && items.length > 0) {
        setRealTreatments(items);
      }
    } catch (err: any) {
      console.error('Failed to fetch real treatment plans from doctor dashboard source:', err);
      setTreatmentFetchError('Unable to load real treatment plans. Please retry.');
    } finally {
      setIsLoadingTreatments(false);
    }
  }, []);

  // Fetch real treatment plans on mount and when modal opens
  useEffect(() => {
    loadRealTreatments();
  }, [loadRealTreatments]);

  useEffect(() => {
    if (isTreatmentModalOpen) {
      loadRealTreatments();
    }
  }, [isTreatmentModalOpen, loadRealTreatments]);

  // 1. Patient Header Info (Editable & Verifiable)
  const [patientAge, setPatientAge] = useState<number | ''>(
    invoice?.patientAge !== undefined ? invoice.patientAge : patient.age || ''
  );
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>(
    invoice?.patientGender || patient.gender || 'Male'
  );

  // Stable ID and Invoice Number (prevents generating duplicate IDs or duplicate bills on multiple clicks)
  const [currentInvoiceId] = useState<string>(() => invoice?.id || `inv-${Date.now()}`);
  const [currentInvoiceNumber] = useState<string>(
    () => invoice?.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [isSaving, setIsSaving] = useState(false);

  // 2. Appointment Details (from appointment or invoice, editable if needed)
  const [appointmentDate, setAppointmentDate] = useState<string>(
    invoice?.appointmentDate || appointment?.date || invoice?.date || new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState<string>(
    invoice?.appointmentTime || appointment?.time || '10:00 AM'
  );
  const [attendingDoctor, setAttendingDoctor] = useState<string>(
    invoice?.attendingDoctor || appointment?.doctorName || 'Dr. Ananya Sharma'
  );
  const [chiefComplaint, setChiefComplaint] = useState<string>(
    invoice?.chiefComplaint || appointment?.procedure || 'Routine Examination & Pain Assessment'
  );

  // 3. Clinical Diagnosis / Notes (Optional)
  const [diagnosis, setDiagnosis] = useState<string>(
    invoice?.diagnosis || ''
  );

  // 4. Treatments & Items Section
  const initialItems: BillItemForm[] = useMemo(() => {
    if (invoice?.items && invoice.items.length > 0) {
      return invoice.items.map((item, idx) => ({
        id: item.id || `item-${idx}-${Date.now()}`,
        description: item.description || '',
        tooth: item.tooth !== undefined ? item.tooth : '',
        fee: item.unitPrice || item.total || 0,
        code: item.code
      }));
    }
    // If invoice had only a top-level description and totalAmount
    if (invoice?.description) {
      return [
        {
          id: `item-0-${Date.now()}`,
          description: invoice.description,
          tooth: '',
          fee: invoice.totalAmount || invoice.total || 0
        }
      ];
    }
    // Default fallback with standard consultation fee
    const standardFee = treatmentService.getConsultationFee();
    return [
      {
        id: `item-init-${Date.now()}`,
        description: 'Comprehensive Oral Clinical Consultation',
        tooth: '',
        fee: standardFee,
        code: 'CONS-01'
      }
    ];
  }, [invoice]);

  const [items, setItems] = useState<BillItemForm[]>(initialItems);

  // Financial Calculations
  const [amountPaid, setAmountPaid] = useState<number | ''>(
    invoice?.amountPaid !== undefined ? invoice.amountPaid : 0
  );

  // Discount Configuration State (Percentage vs Flat Amount)
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>(() => {
    if (invoice?.discountType) return invoice.discountType;
    return 'percentage';
  });

  const [percentageDiscount, setPercentageDiscount] = useState<number | ''>(() => {
    if (invoice?.discountType === 'percentage' && invoice.discountValue !== undefined) {
      return invoice.discountValue;
    }
    if (invoice?.discount && invoice.subtotal && invoice.subtotal > 0) {
      const pct = Math.round((invoice.discount / invoice.subtotal) * 100);
      if (Math.round((invoice.subtotal * pct) / 100) === invoice.discount) {
        return pct;
      }
    }
    return 0;
  });

  const [manualDiscountAmount, setManualDiscountAmount] = useState<number | ''>(() => {
    if (invoice?.discountType === 'flat' && invoice.discountValue !== undefined) {
      return invoice.discountValue;
    }
    if (invoice?.discount !== undefined && invoice.discount > 0) {
      return invoice.discount;
    }
    return '';
  });

  // Dynamic calculations:
  // Subtotal (Original Total): Sum of all itemized procedural charges before any discount
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const feeNum = typeof item.fee === 'number' ? item.fee : 0;
      return sum + feeNum;
    }, 0);
  }, [items]);

  // Real-time calculated discount amount in Rupees (strictly validated and bounded)
  const calculatedDiscount = useMemo(() => {
    if (subtotal <= 0) return 0;
    if (discountType === 'percentage') {
      const pct = typeof percentageDiscount === 'number' ? Math.max(0, Math.min(100, percentageDiscount)) : 0;
      if (pct <= 0) return 0;
      const raw = Math.round((subtotal * pct) / 100);
      return Math.min(subtotal, Math.max(0, raw));
    } else {
      const flat = typeof manualDiscountAmount === 'number' ? Math.max(0, manualDiscountAmount) : 0;
      return Math.min(subtotal, flat);
    }
  }, [subtotal, discountType, percentageDiscount, manualDiscountAmount]);

  // Effective Total / Net Amount: Recalculate and display final billable total after subtracting discount
  const effectiveTotal = useMemo(() => {
    return Math.max(0, subtotal - calculatedDiscount);
  }, [subtotal, calculatedDiscount]);

  // Total amount alias to effective net total
  const totalAmount = effectiveTotal;

  const numericPaid = typeof amountPaid === 'number' ? Math.max(0, amountPaid) : 0;
  const balanceDue = Math.max(0, effectiveTotal - numericPaid);

  // Discount input handlers with validations
  const handlePercentageChange = (val: string | number) => {
    if (val === '') {
      setPercentageDiscount('');
      return;
    }
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) {
      setPercentageDiscount('');
      return;
    }
    // Restrict percentage input strictly between 0% and 100%
    const clamped = Math.max(0, Math.min(100, num));
    setPercentageDiscount(clamped);
  };

  const handleManualDiscountChange = (val: string | number) => {
    if (val === '') {
      setManualDiscountAmount('');
      return;
    }
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) {
      setManualDiscountAmount('');
      return;
    }
    // Restrict manual discount input so it cannot exceed the total subtotal (prevents negative bill amounts)
    const clamped = Math.max(0, Math.min(subtotal, num));
    setManualDiscountAmount(clamped);
  };

  const handleClearDiscount = () => {
    setPercentageDiscount(0);
    setManualDiscountAmount('');
    showToast('Discount reset to ₹0', 'info');
  };

  // Available catalogue items for quick addition
  const masterCatalogue = useMemo(() => {
    if (catalogueItems && catalogueItems.length > 0) return catalogueItems;
    if (realTreatments && realTreatments.length > 0) return realTreatments;
    return treatmentService.getTreatmentsSync();
  }, [catalogueItems, realTreatments]);

  // Derived unique categories from real treatment plans
  const treatmentCategories = useMemo(() => {
    const set = new Set<string>();
    realTreatments.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [realTreatments]);

  // Filtered real treatment plans matching category and search term
  const filteredRealTreatments = useMemo(() => {
    return realTreatments.filter(item => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      if (!planSearch.trim()) return matchesCategory;

      const q = planSearch.trim().toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [realTreatments, selectedCategory, planSearch]);

  // Handler: Select Real Treatment Plan from Doctor Dashboard and add to patient bill
  const handleSelectRealTreatment = (plan: TreatmentCatalogueItem) => {
    const isSingleBlankItem =
      items.length === 1 &&
      (!items[0].description || items[0].description.trim() === '') &&
      (!items[0].fee || items[0].fee === 0);

    const newItem: BillItemForm = {
      id: `item-tp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      description: plan.name,
      tooth: '',
      fee: plan.price,
      code: plan.code || undefined
    };

    if (isSingleBlankItem) {
      setItems([newItem]);
    } else {
      setItems(prev => [...prev, newItem]);
    }

    showToast(
      `Added "${plan.name}" (${formatIndianRupees(plan.price)}) to bill`,
      'success'
    );
  };

  // Retrieve all clinic treatment plans (from props or storage cache)
  const allClinicPlans = useMemo<TreatmentPlan[]>(() => {
    if (treatmentPlans && treatmentPlans.length > 0) return treatmentPlans;
    try {
      return StorageService.getTreatmentPlans() || [];
    } catch {
      return [];
    }
  }, [treatmentPlans]);

  // Filter plans specifically belonging to this patient
  const patientTreatmentPlans = useMemo<TreatmentPlan[]>(() => {
    return allClinicPlans.filter(plan => {
      const matchId =
        plan.patientId &&
        patient.id &&
        String(plan.patientId).trim().toLowerCase() === String(patient.id).trim().toLowerCase();
      const matchName =
        plan.patientName &&
        patient.name &&
        plan.patientName.trim().toLowerCase() === patient.name.trim().toLowerCase();
      return matchId || matchName;
    });
  }, [allClinicPlans, patient.id, patient.name]);

  // Which plans to display inside the modal (with optional search filter)
  const displayedPlans = useMemo<TreatmentPlan[]>(() => {
    const plansToUse = showAllClinicPlans
      ? allClinicPlans
      : patientTreatmentPlans.length > 0
      ? patientTreatmentPlans
      : allClinicPlans;

    if (!planSearch.trim()) return plansToUse;
    const q = planSearch.trim().toLowerCase();

    return plansToUse
      .map(plan => {
        const matchesPlan =
          plan.title?.toLowerCase().includes(q) ||
          plan.phase?.toLowerCase().includes(q) ||
          plan.doctorName?.toLowerCase().includes(q);
        const matchingProcedures = (plan.procedures || []).filter(
          proc =>
            proc.name.toLowerCase().includes(q) ||
            (proc.code && proc.code.toLowerCase().includes(q)) ||
            (proc.toothNumber !== undefined && String(proc.toothNumber).includes(q))
        );
        if (matchesPlan) return plan;
        if (matchingProcedures.length > 0) {
          return {
            ...plan,
            procedures: matchingProcedures
          };
        }
        return null;
      })
      .filter((plan): plan is TreatmentPlan => plan !== null);
  }, [showAllClinicPlans, allClinicPlans, patientTreatmentPlans, planSearch]);

  // Handler: Import single procedure from Treatment Plan into the bill
  const handleImportProcedure = (procedure: TreatmentProcedureItem) => {
    const isSingleBlankItem =
      items.length === 1 &&
      (!items[0].description || items[0].description.trim() === '') &&
      (!items[0].fee || items[0].fee === 0);

    const newItem: BillItemForm = {
      id: `item-tp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      description: procedure.name,
      tooth: procedure.toothNumber !== undefined && procedure.toothNumber !== null ? procedure.toothNumber : '',
      fee: typeof procedure.fee === 'number' ? procedure.fee : (parseFloat(String(procedure.fee)) || 0),
      code: procedure.code || undefined
    };

    if (isSingleBlankItem) {
      setItems([newItem]);
    } else {
      setItems(prev => [...prev, newItem]);
    }

    showToast(`Imported "${procedure.name}" (${formatIndianRupees(typeof newItem.fee === 'number' ? newItem.fee : 0)}) into bill`, 'success');
  };

  // Handler: Import all procedures from a specific Treatment Plan
  const handleImportAllFromPlan = (plan: TreatmentPlan) => {
    if (!plan.procedures || plan.procedures.length === 0) return;

    const isSingleBlankItem =
      items.length === 1 &&
      (!items[0].description || items[0].description.trim() === '') &&
      (!items[0].fee || items[0].fee === 0);

    const newItems: BillItemForm[] = plan.procedures.map((proc, idx) => ({
      id: `item-tp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      description: proc.name,
      tooth: proc.toothNumber !== undefined && proc.toothNumber !== null ? proc.toothNumber : '',
      fee: typeof proc.fee === 'number' ? proc.fee : (parseFloat(String(proc.fee)) || 0),
      code: proc.code || undefined
    }));

    if (isSingleBlankItem) {
      setItems(newItems);
    } else {
      setItems(prev => [...prev, ...newItems]);
    }

    showToast(`Imported ${plan.procedures.length} procedure(s) from "${plan.title}" into bill`, 'success');
  };

  // Handler: Add new empty treatment row
  const handleAddTreatment = () => {
    const newItem: BillItemForm = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: '',
      tooth: '',
      fee: ''
    };
    setItems(prev => [...prev, newItem]);
  };

  // Handler: Quick add from master catalogue
  const handleQuickAddCatalogueItem = (catalogueItem: TreatmentCatalogueItem) => {
    const newItem: BillItemForm = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: catalogueItem.name,
      tooth: '',
      fee: catalogueItem.price,
      code: catalogueItem.code
    };
    setItems(prev => [...prev, newItem]);
    showToast(`Added ${catalogueItem.name} (${formatIndianRupees(catalogueItem.price)}) to bill`, 'info');
  };

  // Handler: Update item field
  const handleUpdateItem = (id: string, field: keyof BillItemForm, value: any) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        return {
          ...item,
          [field]: value
        };
      })
    );
  };

  // Handler: Remove item row
  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      // Keep at least one row or reset it
      setItems([{
        id: `item-${Date.now()}`,
        description: '',
        tooth: '',
        fee: ''
      }]);
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const createUpdatedInvoice = (sentToReceptionistFlag?: boolean): Invoice => {
    // 1. Patient Age & Gender with safe resilient fallbacks
    const parsedAge = typeof patientAge === 'number' ? patientAge : parseInt(String(patientAge), 10);
    const validAge = !isNaN(parsedAge) && parsedAge > 0 && parsedAge <= 130
      ? parsedAge
      : (patient.age || 32);

    const validGender = patientGender || patient.gender || 'Male';

    // 2. Treatments & Items: filter valid descriptions and sanitize fees
    let validItems = items
      .filter(item => item.description && item.description.trim().length > 0)
      .map(item => ({
        ...item,
        fee: typeof item.fee === 'number' && !isNaN(item.fee) ? item.fee : (parseFloat(String(item.fee)) || 0)
      }));

    if (validItems.length === 0) {
      const standardFee = treatmentService.getConsultationFee() || 500;
      validItems = [
        {
          id: `item-cons-${Date.now()}`,
          description: 'Comprehensive Oral Clinical Consultation',
          tooth: '',
          fee: standardFee,
          code: 'CONS-01'
        }
      ];
    }

    const calculatedSubtotal = validItems.reduce((acc, curr) => acc + (typeof curr.fee === 'number' ? curr.fee : 0), 0);
    
    // Deduce calculated discount for persistent storage
    let finalDiscount = 0;
    if (calculatedSubtotal > 0) {
      if (discountType === 'percentage') {
        const pct = typeof percentageDiscount === 'number' ? Math.max(0, Math.min(100, percentageDiscount)) : 0;
        finalDiscount = Math.min(calculatedSubtotal, Math.round((calculatedSubtotal * pct) / 100));
      } else {
        const flat = typeof manualDiscountAmount === 'number' ? Math.max(0, manualDiscountAmount) : 0;
        finalDiscount = Math.min(calculatedSubtotal, flat);
      }
    }

    const calculatedEffectiveTotal = Math.max(0, calculatedSubtotal - finalDiscount);
    const calculatedPaid = Math.min(calculatedEffectiveTotal, numericPaid);
    const calculatedBalance = Math.max(0, calculatedEffectiveTotal - calculatedPaid);

    const invoiceItems: InvoiceItem[] = validItems.map(item => ({
      id: item.id,
      description: item.description.trim(),
      tooth: item.tooth !== '' && item.tooth !== undefined ? Number(item.tooth) : undefined,
      quantity: 1,
      unitPrice: typeof item.fee === 'number' ? item.fee : 0,
      total: typeof item.fee === 'number' ? item.fee : 0,
      code: item.code
    }));

    const status = calculatedBalance === 0 ? 'paid' : calculatedPaid > 0 ? 'partial' : 'unpaid';

    return {
      id: currentInvoiceId,
      invoiceNumber: currentInvoiceNumber,
      patientId: patient.id,
      patientName: patient.name,
      patientCode: patient.code,
      patientAge: validAge,
      patientGender: validGender,
      date: appointmentDate || new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: invoiceItems,
      description: validItems.map(i => i.description).join(', '),
      diagnosis: diagnosis.trim() || undefined,
      attendingDoctor: attendingDoctor.trim() || undefined,
      appointmentId: appointment?.id || invoice?.appointmentId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      chiefComplaint: chiefComplaint.trim() || undefined,
      subtotal: calculatedSubtotal,
      discount: finalDiscount,
      discountType: discountType,
      discountValue: discountType === 'percentage' 
        ? (typeof percentageDiscount === 'number' ? percentageDiscount : 0)
        : (typeof manualDiscountAmount === 'number' ? manualDiscountAmount : 0),
      netAmount: calculatedEffectiveTotal,
      total: calculatedEffectiveTotal,
      totalAmount: calculatedEffectiveTotal,
      amountPaid: calculatedPaid,
      balanceDue: calculatedBalance,
      status: status,
      paymentMethod: invoice?.paymentMethod || (calculatedPaid > 0 ? 'Cash' : undefined),
      sentToReceptionist: true,
      isDraft: invoice?.isDraft || false
    };
  };

  // Handler: Save Changes (closes patient bill and automatically synchronizes to Receptionist desk)
  const handleSaveBill = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (isSaving) return;
    const updatedInvoice = createUpdatedInvoice();

    setIsSaving(true);
    try {
      onSave(
        updatedInvoice,
        {
          age: updatedInvoice.patientAge || 32,
          gender: updatedInvoice.patientGender || 'Male'
        },
        true
      );
    } finally {
      onBack();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6F6D69] hover:text-[#252525] transition cursor-pointer mb-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>&larr; Back to Billing Table</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8B58D]/30">
              PATIENT BILL &bull; CLINICAL INVOICE DETAIL
            </span>
            {invoice?.invoiceNumber && (
              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-mono font-bold">
                {invoice.invoiceNumber}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#252525] tracking-tight">
            {patient.name}
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Patient ID: <strong className="text-[#252525]">{patient.code}</strong> &bull; Contact: {patient.phone} &bull; Email: {patient.email}
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSaveBill} className="space-y-6">
        {/* 2. PATIENT & APPOINTMENT HEADER INFORMATION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Demographic Verification Card */}
          <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                  <User className="w-4 h-4 text-[#C8B58D]" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#252525]">Patient Information</h3>
                  <p className="text-[11px] text-[#6F6D69]">Verify core clinical demographics</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Age (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="125"
                  value={patientAge}
                  onChange={e => setPatientAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="e.g. 34"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] font-bold"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Required field for medical dosage and insurance records.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Sex / Gender <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={patientGender}
                  onChange={e => setPatientGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] font-semibold cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-2 text-[11px] text-[#6F6D69] space-y-1 border-t border-stone-100">
                <div className="flex justify-between">
                  <span>Blood Group:</span>
                  <strong className="text-[#252525]">{patient.bloodGroup || 'O+'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>File Status:</span>
                  <span className="text-emerald-700 font-bold">Verified EHR Record</span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details Card */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                  <Calendar className="w-4 h-4 text-[#C8B58D]" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#252525]">Appointment &amp; Clinical Context</h3>
                  <p className="text-[11px] text-[#6F6D69]">Relevant appointment details linked to this bill</p>
                </div>
              </div>
              {appointment && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8FA88D]/20 text-[#3B4D3A] border border-[#8FA88D]/30">
                  {appointment.status.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Appointment Date
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Appointment Time
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Attending Doctor / Dental Surgeon
                </label>
                <div className="relative">
                  <Stethoscope className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={attendingDoctor}
                    onChange={e => setAttendingDoctor(e.target.value)}
                    placeholder="e.g. Dr. Ananya Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">
                  Reason for Visit / Chief Complaint
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Sharp pain in upper right molar, tooth sensitivity"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. DIAGNOSIS SECTION */}
        <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                <FileText className="w-4 h-4 text-[#C8B58D]" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#252525]">
                  Clinical Diagnosis &amp; Notes
                </h3>
                <p className="text-[11px] text-[#6F6D69]">
                  Optional diagnostic findings and operative clinical documentation
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Optional
            </span>
          </div>

          <div>
            <textarea
              rows={3}
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="e.g., Irreversible pulpitis on tooth #16 with tender periapical region. Grade 1 calculus on mandibular anterior lingual surfaces. Prescribed endodontic treatment, antibiotic prophylaxis, and restorative crown..."
              className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-xl bg-stone-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] placeholder:text-stone-400 leading-relaxed"
            />
          </div>
        </div>

        {/* 4. TREATMENTS & BILLABLE ITEMS SECTION */}
        <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#C8B58D] mb-0.5">
                <Sparkles className="w-3 h-3" />
                <span>ITEMIZED CLINICAL PROCEDURES</span>
              </div>
              <h3 className="text-base font-extrabold text-[#252525]">
                Treatments &amp; Billable Items
              </h3>
              <p className="text-xs text-[#6F6D69]">
                Add or modify procedural treatments, tooth numbers, and tariffs for this patient's invoice.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlanSearch('');
                  setIsTreatmentModalOpen(true);
                }}
                className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 py-2 px-3.5 shadow-2xs"
                title="Open Treatment Plans to import treatments"
              >
                <Plus className="w-3.5 h-3.5 text-[#252525]" />
                <span>+ Add Treatment</span>
              </button>
            </div>
          </div>

          {/* Quick Real Treatment Plans Picker Helper */}
          <div className="p-3 rounded-xl bg-[#EDE8DE]/40 border border-[#C8B58D]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#252525] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C8B58D]" />
              <span>Quick Add From Treatment Plans:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {realTreatments.slice(0, 6).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectRealTreatment(item)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[#252525] hover:border-[#C8B58D] font-bold text-[11px] cursor-pointer transition shadow-2xs"
                  title={item.description || item.name}
                >
                  + {item.name} ({formatIndianRupees(item.price)})
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPlanSearch('');
                  setSelectedCategory('All');
                  setModalTab('catalogue');
                  setIsTreatmentModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#EDE8DE] hover:bg-[#C8B58D]/25 border border-[#C8B58D]/40 text-[#252525] font-extrabold text-[11px] cursor-pointer transition shadow-2xs flex items-center gap-1"
              >
                <span>View All ({realTreatments.length}) &rarr;</span>
              </button>
            </div>
          </div>

          {/* Interactive Dynamic Treatment Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4">Treatment / Item Description <span className="text-red-500">*</span></th>
                  <th className="py-3 px-3 w-32">Tooth # (Opt)</th>
                  <th className="py-3 px-4 w-44 text-right">Cost / Fee (₹) <span className="text-red-500">*</span></th>
                  <th className="py-3 px-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                    {/* Row Index */}
                    <td className="py-3 px-3 text-center font-bold text-[#6F6D69]">
                      {index + 1}
                    </td>

                    {/* Treatment / Item Name */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="e.g. Scaling, Root Canal, Composite Filling..."
                          className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] font-semibold"
                        />
                      </div>
                    </td>

                    {/* Tooth Number */}
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="1"
                        max="48"
                        value={item.tooth}
                        onChange={e =>
                          handleUpdateItem(
                            item.id,
                            'tooth',
                            e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          )
                        }
                        placeholder="# (e.g. 16)"
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] text-center font-bold"
                      />
                    </td>

                    {/* Cost / Fee */}
                    <td className="py-3 px-4 text-right">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1"
                          value={item.fee}
                          onChange={e =>
                            handleUpdateItem(
                              item.id,
                              'fee',
                              e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value))
                            )
                          }
                          placeholder="0"
                          className="w-full pl-6 pr-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] text-right font-black"
                        />
                      </div>
                    </td>

                    {/* Delete Row Action */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Remove Treatment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Itemized Procedures Count & Add Line Item Below Table */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#6F6D69] font-medium">
              {items.length} item{items.length === 1 ? '' : 's'} in bill
            </span>
            <button
              type="button"
              onClick={handleAddTreatment}
              className="text-xs font-bold text-[#C8B58D] hover:text-[#594723] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Line Item</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* DISCOUNT CONTROL SECTION (PERCENTAGE & FLAT AMOUNT DISCOUNT OPTIONS)     */}
          {/* Directly below Treatments Table & above Financial Ledger Card            */}
          {/* ========================================================================= */}
          <div className="bg-[#EDE8DE]/30 border border-[#C8B58D]/40 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C8B58D]/25">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#C8B58D]">
                  <BadgePercent className="w-3.5 h-3.5" />
                  <span>COURTESY &amp; BILL ADJUSTMENTS</span>
                </div>
                <h4 className="text-sm font-extrabold text-[#252525] mt-0.5">
                  Invoice Discount Options
                </h4>
                <p className="text-xs text-[#6F6D69]">
                  Apply either a percentage-based discount or a custom rupee deduction to the subtotal.
                </p>
              </div>

              {/* Mode Switcher Toggle: Percentage vs Flat Amount */}
              <div className="inline-flex items-center p-1 bg-white border border-stone-200/90 rounded-xl shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    discountType === 'percentage'
                      ? 'bg-[#C8B58D] text-[#252525] shadow-2xs'
                      : 'text-[#6F6D69] hover:text-[#252525]'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Option A: Percentage (%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiscountType('flat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    discountType === 'flat'
                      ? 'bg-[#C8B58D] text-[#252525] shadow-2xs'
                      : 'text-[#6F6D69] hover:text-[#252525]'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Option B: Flat Amount (₹)</span>
                </button>
              </div>
            </div>

            {/* Subtotal warning if 0 */}
            {subtotal <= 0 ? (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please add itemized treatments above with fees greater than ₹0 to apply a discount.</span>
              </div>
            ) : (
              <>
                {/* OPTION A: Percentage Discount */}
                {discountType === 'percentage' && (
                  <div className="space-y-3.5">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      {/* Presets */}
                      <div className="space-y-1.5 flex-1">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6F6D69]">
                          Quick Percentage Presets
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[0, 5, 10, 15, 20, 25, 50].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => handlePercentageChange(pct)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                percentageDiscount === pct
                                  ? 'bg-[#252525] text-white border-[#252525] shadow-2xs'
                                  : 'bg-white text-[#252525] border-stone-200 hover:border-[#C8B58D]'
                              }`}
                            >
                              {pct === 0 ? 'None (0%)' : `${pct}%`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Percentage Input */}
                      <div className="w-full md:w-56 space-y-1.5">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6F6D69]">
                          Discount Percentage (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={percentageDiscount}
                            onChange={e => handlePercentageChange(e.target.value)}
                            placeholder="0"
                            className="w-full pl-3 pr-8 py-2 text-xs font-black border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-stone-400 text-xs">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Real-time Percentage Breakdown */}
                    <div className="p-3 bg-white rounded-xl border border-stone-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[#6F6D69] font-medium">
                          Calculated Discount:
                        </span>
                        <span className="font-black text-emerald-700 text-sm">
                          - {formatIndianRupees(calculatedDiscount)}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          ({typeof percentageDiscount === 'number' ? percentageDiscount : 0}% of original subtotal {formatIndianRupees(subtotal)})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#252525] font-bold">
                          Effective Total: <strong className="font-black text-[#252525]">{formatIndianRupees(effectiveTotal)}</strong>
                        </span>
                        {calculatedDiscount > 0 && (
                          <button
                            type="button"
                            onClick={handleClearDiscount}
                            className="text-[11px] font-bold text-stone-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition border border-stone-200 px-2 py-0.5 rounded-lg hover:bg-red-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* OPTION B: Flat Amount Discount */}
                {discountType === 'flat' && (
                  <div className="space-y-3.5">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      {/* Presets */}
                      <div className="space-y-1.5 flex-1">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6F6D69]">
                          Quick Rupee Suggestions
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[100, 250, 500, 1000, 2000]
                            .filter(amt => amt <= subtotal)
                            .map(amt => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => handleManualDiscountChange(amt)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                  manualDiscountAmount === amt
                                    ? 'bg-[#252525] text-white border-[#252525] shadow-2xs'
                                    : 'bg-white text-[#252525] border-stone-200 hover:border-[#C8B58D]'
                                }`}
                              >
                                ₹{amt}
                              </button>
                            ))}
                          {subtotal > 0 && (
                            <button
                              type="button"
                              onClick={() => handleManualDiscountChange(subtotal)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                manualDiscountAmount === subtotal
                                  ? 'bg-[#252525] text-white border-[#252525] shadow-2xs'
                                  : 'bg-white text-[#252525] border-stone-200 hover:border-[#C8B58D]'
                              }`}
                            >
                              Full Courtesy Waive ({formatIndianRupees(subtotal)})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Manual Amount Input Field */}
                      <div className="w-full md:w-64 space-y-1.5">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6F6D69]">
                          Add Discount Manually (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-stone-400 text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={subtotal}
                            step="1"
                            value={manualDiscountAmount}
                            onChange={e => handleManualDiscountChange(e.target.value)}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-2 text-xs font-black border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Real-time Flat Calculation Breakdown */}
                    <div className="p-3 bg-white rounded-xl border border-stone-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[#6F6D69] font-medium">
                          Discount Deducted:
                        </span>
                        <span className="font-black text-emerald-700 text-sm">
                          - {formatIndianRupees(calculatedDiscount)}
                        </span>
                        {typeof manualDiscountAmount === 'number' && manualDiscountAmount >= subtotal && subtotal > 0 && (
                          <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Capped at 100% of bill (₹{subtotal.toLocaleString()})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#252525] font-bold">
                          Effective Total: <strong className="font-black text-[#252525]">{formatIndianRupees(effectiveTotal)}</strong>
                        </span>
                        {calculatedDiscount > 0 && (
                          <button
                            type="button"
                            onClick={handleClearDiscount}
                            className="text-[11px] font-bold text-stone-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition border border-stone-200 px-2 py-0.5 rounded-lg hover:bg-red-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 5-COLUMN FINANCIAL SUMMARY & LEDGER CARD                                  */}
          {/* Subtotal -> Discount Applied -> Effective Net Total -> Amount Paid -> Due */}
          {/* ========================================================================= */}
          <div className="bg-stone-50/80 rounded-2xl p-5 border border-stone-200/90 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* 1. Subtotal / Original Total */}
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6F6D69] block">
                  Subtotal (Original)
                </span>
                <p className="text-xl font-black text-[#252525] tracking-tight">
                  {formatIndianRupees(subtotal)}
                </p>
                <p className="text-[10px] text-stone-400">Sum of itemized procedures</p>
              </div>

              {/* 2. Discount Applied */}
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                    Discount Applied
                  </span>
                  {calculatedDiscount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {discountType === 'percentage' && typeof percentageDiscount === 'number'
                        ? `${percentageDiscount}% OFF`
                        : 'FLAT'}
                    </span>
                  )}
                </div>
                <p className="text-xl font-black text-emerald-700 tracking-tight">
                  {calculatedDiscount > 0 ? `- ${formatIndianRupees(calculatedDiscount)}` : '₹0'}
                </p>
                <p className="text-[10px] text-stone-400">
                  {calculatedDiscount > 0 ? 'Deducted from subtotal' : 'No discount applied'}
                </p>
              </div>

              {/* 3. Effective Total / Net Amount */}
              <div className="p-3.5 rounded-xl bg-[#EDE8DE]/50 border border-[#C8B58D]/50 shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#252525] block">
                  Net Bill Amount
                </span>
                <p className="text-xl font-black text-[#252525] tracking-tight">
                  {formatIndianRupees(effectiveTotal)}
                </p>
                <p className="text-[10px] text-[#6F6D69]">Effective Total (Subtotal - Discount)</p>
              </div>

              {/* 4. Amount Paid (Editable) */}
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Amount Paid (₹)
                </span>
                <div className="relative mt-0.5">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-emerald-600 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={amountPaid}
                    onChange={e =>
                      setAmountPaid(
                        e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value))
                      )
                    }
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-1 text-sm border border-stone-200 rounded-lg bg-emerald-50/20 text-emerald-700 font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(effectiveTotal)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Mark Full
                  </button>
                  <span className="text-stone-300">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(0)}
                    className="text-[10px] font-bold text-stone-500 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* 5. Balance Due (Calculated) */}
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                  Balance Due
                </span>
                <p className={`text-xl font-black tracking-tight ${balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatIndianRupees(balanceDue)}
                </p>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 ${
                  balanceDue === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : numericPaid > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {balanceDue === 0 ? 'STATUS: PAID IN FULL' : numericPaid > 0 ? 'STATUS: PARTIAL' : 'STATUS: PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM ACTIONS BAR */}
        <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20">
          <div className="flex items-center gap-2 text-xs text-[#6F6D69]">
            <CheckCircle2 className="w-4 h-4 text-[#8FA88D]" />
            <span>
              All charges, clinical notes, and verified patient demographics will be committed to the practice financial ledger.
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-wrap">
            {invoice?.id && onDeleteInvoice && (
              <button
                type="button"
                onClick={() => onDeleteInvoice(invoice.id)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 transition cursor-pointer flex items-center gap-1 font-bold"
                title="Delete Bill"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Bill</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="btn-secondary text-xs cursor-pointer py-2.5 px-4"
              title="Cancel and return to billing table"
            >
              Cancel
            </button>


            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveBill}
              className="btn-primary text-xs cursor-pointer flex items-center gap-2 py-2.5 px-5 disabled:opacity-50 shadow-sm"
              title="Save Changes"
            >
              <Save className="w-4 h-4 text-[#252525]" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 5. POP-UP MODAL: ADD TREATMENT FROM REAL TREATMENT PLANS */}
      {isTreatmentModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#252525]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-stone-200/80 rounded-3xl shadow-2xl w-full max-w-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden text-[#252525] flex flex-col max-h-[88vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center text-[#252525] shadow-2xs shrink-0">
                  <ClipboardList className="w-5 h-5 text-[#C8B58D]" />
                </span>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[10px] font-extrabold uppercase tracking-wider text-[#252525] border border-[#C8B58D]/20 mb-0.5">
                    <Sparkles className="w-3 h-3 text-[#C8B58D]" />
                    <span>DOCTOR DASHBOARD &bull; TREATMENT PLANS</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#252525] tracking-tight">
                    Add Treatment from Treatment Plans
                  </h2>
                  <p className="text-xs text-[#6F6D69]">
                    Select from all standardized treatment plans and tariffs to add to <strong className="text-[#252525]">{patient.name}</strong>'s bill.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={loadRealTreatments}
                  disabled={isLoadingTreatments}
                  className="w-8 h-8 rounded-xl text-[#6F6D69] hover:text-[#252525] hover:bg-[#EDE8DE] flex items-center justify-center text-sm cursor-pointer transition disabled:opacity-50"
                  title="Refresh treatment plans from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTreatments ? 'animate-spin text-[#C8B58D]' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsTreatmentModalOpen(false)}
                  className="w-8 h-8 rounded-xl text-[#6F6D69] hover:text-[#252525] hover:bg-[#EDE8DE] flex items-center justify-center text-sm cursor-pointer transition"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs (if patient has roadmaps) */}
            {patientTreatmentPlans.length > 0 && (
              <div className="flex items-center gap-2 border-b border-stone-200/70 pb-2 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setModalTab('catalogue')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'catalogue'
                      ? 'bg-[#252525] text-white shadow-2xs'
                      : 'bg-stone-100 text-[#6F6D69] hover:bg-stone-200/80 hover:text-[#252525]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Treatment Plans ({realTreatments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('roadmaps')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'roadmaps'
                      ? 'bg-[#252525] text-white shadow-2xs'
                      : 'bg-stone-100 text-[#6F6D69] hover:bg-stone-200/80 hover:text-[#252525]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C8B58D]" />
                  <span>{patient.name}'s Roadmap ({patientTreatmentPlans.length})</span>
                </button>
              </div>
            )}

            {/* Filter / Search Bar & Category Pills */}
            <div className="space-y-2.5 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={planSearch}
                  onChange={e => setPlanSearch(e.target.value)}
                  placeholder="Search treatments by name, code (e.g. RCT, CRW, D2750), specialty..."
                  className="w-full pl-9 pr-8 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8B58D] text-[#252525] placeholder:text-stone-400 font-medium"
                />
                {planSearch && (
                  <button
                    type="button"
                    onClick={() => setPlanSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Specialty / Category Filter Pills (When on Catalogue tab) */}
              {modalTab === 'catalogue' && treatmentCategories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs scrollbar-none">
                  <span className="text-[11px] font-bold text-[#6F6D69] mr-0.5 shrink-0 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-[#C8B58D]" />
                    <span>Specialty:</span>
                  </span>
                  {treatmentCategories.map(cat => {
                    const isSelected = selectedCategory === cat;
                    const count = cat === 'All'
                      ? realTreatments.length
                      : realTreatments.filter(t => t.category === cat).length;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition shrink-0 cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#252525] text-white shadow-2xs'
                            : 'bg-[#EDE8DE]/70 text-[#6F6D69] hover:bg-[#EDE8DE] hover:text-[#252525]'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Banner */}
            {treatmentFetchError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{treatmentFetchError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadRealTreatments}
                  className="btn-secondary text-xs py-1 px-2.5 font-bold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {isLoadingTreatments && realTreatments.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6F6D69] space-y-2">
                  <div className="w-6 h-6 border-2 border-[#C8B58D] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-bold">Loading real treatment plans from Doctor Dashboard...</p>
                </div>
              ) : modalTab === 'catalogue' ? (
                /* TAB 1: ALL REAL CLINIC TREATMENT PLANS */
                filteredRealTreatments.length === 0 ? (
                  <div className="py-8 px-4 text-center space-y-3 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200">
                    <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center text-[#252525] mx-auto shadow-2xs">
                      <ClipboardList className="w-6 h-6 text-[#C8B58D]" />
                    </div>
                    
                    {planSearch || selectedCategory !== 'All' ? (
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-extrabold text-[#252525]">
                          No treatment plans found matching {planSearch ? `"${planSearch}"` : `specialty "${selectedCategory}"`}
                        </h4>
                        <p className="text-xs text-[#6F6D69] max-w-sm mx-auto">
                          Try modifying your search term or clear the filter to view all available treatment plans.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanSearch('');
                            setSelectedCategory('All');
                          }}
                          className="btn-secondary text-xs py-1.5 px-3 mt-2 cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-extrabold text-[#252525]">
                          No Treatment Plans Found in Clinic Database
                        </h4>
                        <p className="text-xs text-[#6F6D69] max-w-sm mx-auto">
                          There are currently no treatment plans recorded in the clinic catalogue. You can add treatments manually to this bill.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleAddTreatment();
                              setIsTreatmentModalOpen(false);
                            }}
                            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#252525]" />
                            <span>+ Add Treatment Manually</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredRealTreatments.map(plan => {
                    const timesInBill = items.filter(
                      it => it.description.trim().toLowerCase() === plan.name.trim().toLowerCase()
                    ).length;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleSelectRealTreatment(plan)}
                        className="p-3.5 rounded-2xl border border-stone-200/80 hover:border-[#C8B58D] bg-white hover:bg-[#EDE8DE]/20 transition cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                        title="Click to add this treatment to the bill"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center text-xs font-black text-[#252525] shrink-0 shadow-2xs group-hover:bg-[#C8B58D]/30 transition">
                            <Layers className="w-4 h-4 text-[#C8B58D]" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#252525] group-hover:text-[#C8B58D] transition-colors">
                                {plan.name}
                              </span>
                              {plan.code && (
                                <span className="px-1.5 py-0.5 rounded bg-stone-100 text-[10px] font-mono font-semibold text-stone-600">
                                  {plan.code}
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE8DE]/80 text-[#252525] border border-[#C8B58D]/25">
                                {plan.category || 'General'}
                              </span>
                            </div>

                            {plan.description && (
                              <p className="text-[11px] text-[#6F6D69] mt-0.5 line-clamp-1">
                                {plan.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-[#6F6D69] block">Standard Fee</span>
                            <span className="text-xs font-black text-[#252525]">
                              {formatIndianRupees(plan.price)}
                            </span>
                          </div>

                          {timesInBill > 0 ? (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleSelectRealTreatment(plan);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              title="Click to add another instance of this treatment to the bill"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>In Bill {timesInBill > 1 ? `(${timesInBill})` : ''} +</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleSelectRealTreatment(plan);
                              }}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#252525]" />
                              <span>+ Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* TAB 2: PATIENT SPECIFIC PRESCRIBED ROADMAPS */
                displayedPlans.length === 0 ? (
                  <div className="py-8 px-4 text-center space-y-3 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200">
                    <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center text-[#252525] mx-auto shadow-2xs">
                      <ClipboardList className="w-6 h-6 text-[#C8B58D]" />
                    </div>
                    <h4 className="text-sm font-extrabold text-[#252525]">
                      No Prescribed Roadmap Procedures Found
                    </h4>
                    <p className="text-xs text-[#6F6D69] max-w-sm mx-auto">
                      Switch to "All Treatment Plans" to select treatments from the clinic master catalogue.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModalTab('catalogue')}
                      className="btn-primary text-xs py-2 px-3.5 cursor-pointer"
                    >
                      Switch to All Treatment Plans
                    </button>
                  </div>
                ) : (
                  displayedPlans.map(plan => {
                    const procedures = plan.procedures || [];
                    if (procedures.length === 0) return null;

                    return (
                      <div
                        key={plan.id}
                        className="border border-stone-200/90 rounded-2xl bg-white p-4 shadow-2xs space-y-3"
                      >
                        {/* Plan Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-black text-[#252525]">
                                {plan.title}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                  plan.status === 'in_progress'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : plan.status === 'completed'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : plan.status === 'accepted'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {plan.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6F6D69] mt-0.5">
                              {plan.phase} &bull; Dr. {plan.doctorName} &bull; {plan.dateCreated}
                            </p>
                          </div>

                          {procedures.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleImportAllFromPlan(plan)}
                              className="text-[11px] font-bold text-[#C8B58D] hover:text-[#252525] underline cursor-pointer self-start sm:self-auto shrink-0"
                            >
                              + Import All ({procedures.length})
                            </button>
                          )}
                        </div>

                        {/* Procedures List */}
                        <div className="space-y-2">
                          {procedures.map(proc => {
                            const timesInBill = items.filter(
                              it =>
                                it.description.trim().toLowerCase() === proc.name.trim().toLowerCase() &&
                                (it.tooth === proc.toothNumber || (!it.tooth && !proc.toothNumber))
                            ).length;

                            return (
                              <div
                                key={proc.id}
                                onClick={() => handleImportProcedure(proc)}
                                className="p-3 rounded-xl border border-stone-200/70 hover:border-[#C8B58D] bg-stone-50/40 hover:bg-[#EDE8DE]/20 transition cursor-pointer flex items-center justify-between gap-3 group"
                                title="Click to automatically import this treatment into the bill"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-xs font-bold text-[#252525] shrink-0 shadow-2xs">
                                    {proc.toothNumber ? `#${proc.toothNumber}` : '—'}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-[#252525] group-hover:text-[#C8B58D] transition-colors">
                                        {proc.name}
                                      </span>
                                      {proc.code && (
                                        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-[10px] font-mono font-semibold text-stone-600">
                                          {proc.code}
                                        </span>
                                      )}
                                      <span
                                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                          proc.status === 'done'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : proc.status === 'in_progress'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-stone-200 text-stone-600'
                                        }`}
                                      >
                                        {proc.status}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-[#6F6D69] block mt-0.5">
                                      Fee: <strong className="text-[#252525]">{formatIndianRupees(proc.fee)}</strong>
                                      {proc.toothNumber && ` • Tooth #${proc.toothNumber}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {timesInBill > 0 ? (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleImportProcedure(proc);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="Click to add another instance of this procedure"
                                    >
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>In Bill {timesInBill > 1 ? `(${timesInBill})` : ''} +</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleImportProcedure(proc);
                                      }}
                                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer shadow-2xs"
                                    >
                                      <Plus className="w-3 h-3 text-[#252525]" />
                                      <span>Import</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleAddTreatment();
                  setIsTreatmentModalOpen(false);
                }}
                className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5 py-2 px-3.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#C8B58D]" />
                <span>+ Add Treatment Manually</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6F6D69] hidden sm:inline">
                  {items.filter(i => i.description.trim().length > 0).length} items in bill
                </span>

                <button
                  type="button"
                  onClick={() => setIsTreatmentModalOpen(false)}
                  className="btn-primary text-xs cursor-pointer py-2 px-5 shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
