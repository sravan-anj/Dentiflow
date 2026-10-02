import React, { useState, useEffect, useRef } from 'react';
import { Invoice, Patient, User, InvoiceStatus, PaymentTransaction, PaymentState, Appointment, TreatmentPlan } from '../../types';
import { useToast } from '../common/Toast';
import { StorageService } from '../../utils/storage';
import { downloadTaxInvoicePdfBlob } from '../../utils/pdfGenerator';
import { paymentService } from '../../utils/paymentService';
import { PatientBillView } from './PatientBillView';
import { BillingDatePickerPopover } from './BillingDatePickerPopover';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  DollarSign,
  Download,
  Sparkles,
  ShieldCheck,
  FileText,
  QrCode,
  ArrowUpRight,
  HelpCircle,
  Check,
  Receipt,
  ExternalLink,
  X,
  AlertTriangle,
  AlertCircle,
  Building,
  ShieldAlert,
  RotateCcw,
  Landmark,
  Wallet,
  Loader2,
  Send,
  ArrowRight,
  UserCheck,
  FileDown,
  Trash2,
  Calendar,
  CalendarDays,
  Filter
} from 'lucide-react';

interface BillingViewProps {
  currentUser: User;
  invoices: Invoice[];
  patients: Patient[];
  appointments?: Appointment[];
  treatmentPlans?: TreatmentPlan[];
  targetPatientId?: string | null;
  targetAppointmentId?: string | null;
  onClearTargetPatient?: () => void;
  onSaveInvoices: (invoices: Invoice[]) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
  onSavePatients?: (patients: Patient[]) => void;
  onOpenBooking?: () => void;
  onOpenPortal?: () => void;
  onNavigateAuth?: (mode: 'signin' | 'signup') => void;
}

const MockLocalQRCode: React.FC<{ amount: number; invoiceNo: string }> = ({ amount, invoiceNo }) => (
  <div className="w-44 h-44 bg-white border-2 border-stone-200 rounded-2xl mx-auto flex flex-col items-center justify-center p-3 shadow-xs relative">
    <svg viewBox="0 0 100 100" className="w-full h-full text-[#252525]" fill="currentColor">
      {/* Corner Outer Position Markers */}
      <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="11" y="11" width="14" height="14" rx="2" fill="currentColor" />

      <rect x="69" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="75" y="11" width="14" height="14" rx="2" fill="currentColor" />

      <rect x="5" y="69" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="11" y="75" width="14" height="14" rx="2" fill="currentColor" />

      {/* Internal QR Matrix Data Pattern */}
      <rect x="36" y="8" width="6" height="6" rx="1" />
      <rect x="48" y="8" width="12" height="6" rx="1" />
      <rect x="8" y="36" width="6" height="12" rx="1" />
      <rect x="20" y="36" width="6" height="6" rx="1" />
      <rect x="36" y="24" width="12" height="6" rx="1" />
      <rect x="54" y="24" width="6" height="12" rx="1" />
      <rect x="36" y="36" width="18" height="18" rx="3" fill="#C8B58D" />
      <rect x="42" y="42" width="6" height="6" fill="#252525" />
      <rect x="60" y="36" width="12" height="6" rx="1" />
      <rect x="78" y="36" width="12" height="12" rx="1" />
      <rect x="60" y="48" width="6" height="18" rx="1" />
      <rect x="72" y="54" width="18" height="6" rx="1" />
      <rect x="36" y="60" width="12" height="6" rx="1" />
      <rect x="54" y="66" width="6" height="12" rx="1" />
      <rect x="36" y="78" width="18" height="6" rx="1" />
      <rect x="60" y="78" width="12" height="12" rx="1" />
      <rect x="78" y="78" width="12" height="12" rx="1" />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="px-1.5 py-0.5 rounded bg-[#F7F5F1] text-[9px] font-black text-[#252525] border border-[#C8B58D]">
        UPI DEMO
      </span>
    </div>
  </div>
);

export type BillingDatePreset = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'all' | 'custom';
export type BillingStatusFilter = 'all' | 'paid' | 'outstanding';

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return getLocalDateString(d);
};

export const getFirstDayOfMonthString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export const parseInvoiceDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  return dateStr.split('T')[0].split(' ')[0];
};

export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = parseInvoiceDate(dateStr);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }
  return dateStr;
};

export const BillingView: React.FC<BillingViewProps> = ({
  currentUser,
  invoices,
  patients,
  appointments,
  treatmentPlans,
  targetPatientId,
  targetAppointmentId,
  onClearTargetPatient,
  onSaveInvoices,
  onSelectPatient,
  onNavigateToChart,
  onSavePatients,
  onOpenBooking = () => {},
  onOpenPortal = () => {},
  onNavigateAuth = () => {}
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI / QR' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Wallet'>('UPI / QR');
  const [lastCompletedTxId, setLastCompletedTxId] = useState<string>('');

  // Active Patient Bill Focus View State
  const [activeBillPatient, setActiveBillPatient] = useState<{
    patient: Patient;
    invoice?: Invoice | null;
    appointment?: Appointment | null;
  } | null>(null);

  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null);
  const consumedTargetKeysRef = useRef<Set<string>>(new Set());

  // Sync with target patient when navigated from external sections (e.g. Appointments)
  useEffect(() => {
    if (!targetPatientId) return;

    const targetKey = `${targetPatientId}-${targetAppointmentId || ''}`;
    if (consumedTargetKeysRef.current.has(targetKey)) {
      return;
    }
    consumedTargetKeysRef.current.add(targetKey);

    const pt =
      patients.find(p => p.id === targetPatientId) ||
      patients.find(p => p.name.toLowerCase() === targetPatientId.toLowerCase()) ||
      null;

    if (pt) {
      const existingInv =
        invoices.find(
          i => (targetAppointmentId && i.appointmentId === targetAppointmentId) || i.patientId === pt.id
        ) || null;

      const allApts = appointments || StorageService.getAppointments();
      const apt =
        allApts.find(
          a =>
            (targetAppointmentId && a.id === targetAppointmentId) ||
            a.patientId === pt.id ||
            a.patientName.toLowerCase() === pt.name.toLowerCase()
        ) || null;

      setActiveBillPatient({
        patient: pt,
        invoice: existingInv,
        appointment: apt
      });
    }

    if (onClearTargetPatient) {
      onClearTargetPatient();
    }
  }, [targetPatientId, targetAppointmentId, patients, appointments, onClearTargetPatient]);
  
  // Method-Specific Transaction Fields
  const [utrNumber, setUtrNumber] = useState(''); // UPI / QR UTR
  const [upiVpa, setUpiVpa] = useState(''); // Direct UPI VPA
  const [cardNetwork, setCardNetwork] = useState<'Visa' | 'Mastercard' | 'RuPay' | 'Amex'>('Visa');
  const [cardLast4, setCardLast4] = useState('');
  const [posAuthCode, setPosAuthCode] = useState('');
  const [cashVoucherId, setCashVoucherId] = useState('');
  const [cashierName, setCashierName] = useState('Desk Cashier - Reception');
  const [insuranceProvider, setInsuranceProvider] = useState('Star Health Dental Shield');
  const [insurancePolicyNo, setInsurancePolicyNo] = useState('');
  const [insuranceClaimAuthCode, setInsuranceClaimAuthCode] = useState('');
  
  // States & Debugging options
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('pending');

  // New Invoice Form State
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [description, setDescription] = useState('Root Canal Therapy (Tooth #16) + Crown Core');
  const [totalAmount, setTotalAmount] = useState(12500);
  const [amountPaid, setAmountPaid] = useState(5000);

  const isPatient = currentUser.role === 'patient';
  const currentPatient = isPatient
    ? patients.find(p => p.id === (currentUser.patientId || 'p-1')) || patients[0]
    : null;

  const displayedInvoices = isPatient
    ? invoices.filter(i => i.patientId === (currentUser.patientId || 'p-1'))
    : invoices;

  // Filter & Single Date State (Default: Today's Bills)
  const todayDateStr = getLocalDateString(new Date());
  const [datePreset, setDatePreset] = useState<BillingDatePreset>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [statusFilter, setStatusFilter] = useState<BillingStatusFilter>('all');

  const applyDatePreset = (preset: BillingDatePreset) => {
    setDatePreset(preset);
    const today = getLocalDateString(new Date());
    if (preset === 'today') {
      setSelectedDate(today);
    } else if (preset === 'yesterday') {
      setSelectedDate(getRelativeDateString(-1));
    } else if (preset === 'last7days' || preset === 'thisMonth' || preset === 'all') {
      setSelectedDate('');
    }
  };

  const handleSingleDateChange = (val: string) => {
    setSelectedDate(val);
    if (!val) {
      setDatePreset('all');
      return;
    }
    const today = getLocalDateString(new Date());
    const yest = getRelativeDateString(-1);
    if (val === today) {
      setDatePreset('today');
    } else if (val === yest) {
      setDatePreset('yesterday');
    } else {
      setDatePreset('custom');
    }
  };

  const resetToToday = () => {
    applyDatePreset('today');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const clearAllDateFilter = () => {
    applyDatePreset('all');
  };

  const isFilterModified =
    datePreset !== 'today' ||
    selectedDate !== todayDateStr ||
    statusFilter !== 'all' ||
    searchQuery.trim() !== '';

  const isInvoiceMatchingDate = (invDate?: string) => {
    const cleanDate = parseInvoiceDate(invDate);
    if (!cleanDate) return false;

    if (datePreset === 'all') return true;
    if (datePreset === 'last7days') {
      const today = getLocalDateString(new Date());
      const sevenDaysAgo = getRelativeDateString(-6);
      return cleanDate >= sevenDaysAgo && cleanDate <= today;
    }
    if (datePreset === 'thisMonth') {
      const today = getLocalDateString(new Date());
      const monthStart = getFirstDayOfMonthString();
      return cleanDate >= monthStart && cleanDate <= today;
    }
    if (selectedDate) {
      return cleanDate === selectedDate;
    }
    return true;
  };

  const isInvoiceMatchingStatus = (inv: Invoice) => {
    const total = Number(inv.totalAmount || inv.total || 0);
    const paid = Number(inv.amountPaid || 0);
    const due = Number(
      inv.balanceDue !== undefined && inv.balanceDue !== null
        ? inv.balanceDue
        : Math.max(0, total - paid)
    );
    const isPaid = due <= 0 || inv.status === 'paid';

    if (statusFilter === 'paid') return isPaid;
    if (statusFilter === 'outstanding') return !isPaid;
    return true; // 'all'
  };

  const dateScopedInvoices = displayedInvoices.filter(inv => isInvoiceMatchingDate(inv.date));
  const paidCountInScope = dateScopedInvoices.filter(inv => {
    const total = Number(inv.totalAmount || inv.total || 0);
    const paid = Number(inv.amountPaid || 0);
    const due = Number(
      inv.balanceDue !== undefined && inv.balanceDue !== null
        ? inv.balanceDue
        : Math.max(0, total - paid)
    );
    return due <= 0 || inv.status === 'paid';
  }).length;
  const outstandingCountInScope = dateScopedInvoices.length - paidCountInScope;

  const getDatePresetLabel = (): string => {
    switch (datePreset) {
      case 'today':
        return `Today's Bills (${formatDisplayDate(selectedDate) || 'Today'})`;
      case 'yesterday':
        return `Yesterday's Bills (${formatDisplayDate(selectedDate) || 'Yesterday'})`;
      case 'last7days':
        return 'Last 7 Days';
      case 'thisMonth':
        return 'This Month';
      case 'all':
        return 'All Historical Bills';
      case 'custom':
        return selectedDate ? formatDisplayDate(selectedDate) : 'Selected Date';
      default:
        return 'Selected Date';
    }
  };

  const filteredInvoices = isPatient
    ? displayedInvoices
    : displayedInvoices.filter(inv => {
        if (!isInvoiceMatchingDate(inv.date)) return false;
        if (!isInvoiceMatchingStatus(inv)) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const desc = inv.description || inv.items?.[0]?.description || '';
          return (
            inv.patientName.toLowerCase().includes(q) ||
            inv.invoiceNumber.toLowerCase().includes(q) ||
            desc.toLowerCase().includes(q)
          );
        }
        return true;
      });

  const totalBilled = isPatient
    ? displayedInvoices.reduce((a, b) => a + (b.totalAmount || b.total || 0), 0)
    : filteredInvoices.reduce((a, b) => a + (Number(b.totalAmount) || Number(b.total) || 0), 0);

  const totalPaid = isPatient
    ? displayedInvoices.reduce((a, b) => a + b.amountPaid, 0)
    : filteredInvoices.reduce((a, b) => a + Number(b.amountPaid || 0), 0);

  const totalDue = isPatient
    ? displayedInvoices.reduce((a, b) => a + b.balanceDue, 0)
    : filteredInvoices.reduce((a, b) => a + Number(b.balanceDue || 0), 0);

  const handleDownloadInvoicePdf = (inv: Invoice) => {
    // Security check: Patients can only download their own invoice
    if (isPatient && inv.patientId !== (currentUser.patientId || 'p-1')) {
      showToast('Unauthorized Access Blocked: You can only download your own invoices.', 'error');
      return;
    }
    const pt = patients.find(p => p.id === inv.patientId) || currentPatient;
    downloadTaxInvoicePdfBlob(inv, pt);
    showToast(`Downloaded Tax Invoice PDF: ${inv.invoiceNumber}`, 'success');
  };

  const handleDownloadAnnualStatement = () => {
    const ptInvoices = invoices.filter(i => i.patientId === (currentUser.patientId || 'p-1'));
    if (ptInvoices.length > 0) {
      downloadTaxInvoicePdfBlob(ptInvoices[0], currentPatient);
      showToast(`Downloaded Consolidated Tax Statement for ${currentPatient?.name}`, 'success');
    } else {
      showToast('No invoices found for annual statement download.', 'info');
    }
  };

  const handleOpenPatientPay = (inv: Invoice) => {
    const patientId = currentUser.patientId || 'p-1';
    // Security check: Verify invoice patientId matches authenticated patient
    if (isPatient && inv.patientId !== patientId) {
      showToast('Security Error: You can only pay your own invoices.', 'error');
      return;
    }

    const total = Number(inv.totalAmount || inv.total || 0);
    const due = Number(
      inv.balanceDue !== undefined && inv.balanceDue !== null
        ? inv.balanceDue
        : Math.max(0, total - Number(inv.amountPaid || 0))
    );

    if (!Number.isFinite(due) || due <= 0) {
      showToast('This invoice has no outstanding balance.', 'info');
      return;
    }

    // OPEN THE PAYMENT UI DIRECTLY (NO ASYNC WAITING / NO RAZORPAY BLOCKS)
    setSelectedInvoiceForPayment(inv);
    setPaymentAmount(due);

    // Reset payment fields
    setPaymentMethod('UPI / QR');
    setUtrNumber('');
    setUpiVpa('');
    setCardLast4('');
    setPosAuthCode('');
    setCashVoucherId('');
    setInsurancePolicyNo('');
    setInsuranceClaimAuthCode('');
    setSimulateFailure(false);
    setPaymentState('pending');
    setLastCompletedTxId('');
  };

  // --------------------------------------------------------------------------
  // UNIFIED DEMO PAYMENT HANDLER (UPI / QR, Credit Card, Debit Card, Net Banking, Wallet)
  // --------------------------------------------------------------------------
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const patientId = currentUser.patientId || 'p-1';
    if (isPatient && selectedInvoiceForPayment.patientId !== patientId) {
      showToast('Security Error: You can only pay your own invoices.', 'error');
      return;
    }

    const payAmt = paymentAmount > 0 ? paymentAmount : selectedInvoiceForPayment.balanceDue;
    if (payAmt <= 0) {
      showToast('Invalid payment amount.', 'error');
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const demoTxRef = `DF-DEMO-${Date.now()}`;
      const total = Number(selectedInvoiceForPayment.totalAmount || selectedInvoiceForPayment.total || 0);
      const newAmountPaid = (selectedInvoiceForPayment.amountPaid || 0) + payAmt;
      const newBalanceDue = Math.max(0, total - newAmountPaid);
      const newStatus: InvoiceStatus = newBalanceDue === 0 ? 'paid' : 'partial';

      const updatedInvoice: Invoice = {
        ...selectedInvoiceForPayment,
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
        paymentMethod: paymentMethod === 'UPI / QR' ? 'UPI' : (paymentMethod as any)
      };

      // 1. Update Invoices State in App
      const updatedInvoices = invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i);
      onSaveInvoices(updatedInvoices);

      // 2. Update Patient Balance Due
      if (onSavePatients) {
        const pt = patients.find(p => p.id === updatedInvoice.patientId);
        if (pt) {
          const updatedPatients = patients.map(p => p.id === pt.id ? { ...p, balanceDue: Math.max(0, (p.balanceDue || 0) - payAmt) } : p);
          onSavePatients(updatedPatients);
        }
      } else {
        const storedPatients = StorageService.getPatients();
        const pt = storedPatients.find(p => p.id === updatedInvoice.patientId);
        if (pt) {
          pt.balanceDue = Math.max(0, (pt.balanceDue || 0) - payAmt);
          StorageService.savePatients(storedPatients);
        }
      }

      // 3. Log Transaction
      const newTx: PaymentTransaction = {
        id: `tx-${Date.now()}`,
        invoiceId: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        patientId: updatedInvoice.patientId,
        patientName: updatedInvoice.patientName,
        amount: payAmt,
        paymentMethod: paymentMethod as any,
        transactionRef: demoTxRef,
        status: 'successful',
        timestamp: new Date().toISOString()
      };
      StorageService.addTransaction(newTx);

      // 4. Update UI State to Success
      setSelectedInvoiceForPayment(updatedInvoice);
      setLastCompletedTxId(demoTxRef);
      setIsProcessingPayment(false);
      setPaymentState('successful');
      showToast(`Payment Successful! Settled ₹${payAmt.toLocaleString()} for Invoice ${updatedInvoice.invoiceNumber}`, 'success');
    }, 750);
  };

  const handleCancelPayment = () => {
    if (selectedInvoiceForPayment) {
      const cancelTx: PaymentTransaction = {
        id: `tx-can-${Date.now()}`,
        invoiceId: selectedInvoiceForPayment.id,
        invoiceNumber: selectedInvoiceForPayment.invoiceNumber,
        patientId: selectedInvoiceForPayment.patientId,
        patientName: selectedInvoiceForPayment.patientName,
        amount: paymentAmount,
        paymentMethod: paymentMethod as any,
        transactionRef: utrNumber || posAuthCode || cashVoucherId || insuranceClaimAuthCode || 'CANCELLED',
        status: 'cancelled',
        timestamp: new Date().toISOString()
      };
      StorageService.addTransaction(cancelTx);
    }
    setSelectedInvoiceForPayment(null);
    setPaymentState('cancelled');
    showToast('Payment transaction cancelled by patient.', 'info');
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === patientId) || patients[0];
    const balance = Math.max(0, totalAmount - amountPaid);
    const status: InvoiceStatus = balance === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `DF-INV-2026-0${invoices.length + 50}`,
      patientId: patient.id,
      patientName: patient.name,
      patientCode: patient.code,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      totalAmount: Number(totalAmount),
      total: Number(totalAmount),
      amountPaid: Number(amountPaid),
      balanceDue: balance,
      status: status,
      paymentMethod: amountPaid > 0 ? 'UPI' : undefined,
      description: description,
      sentToReceptionist: true
    };

    onSaveInvoices([newInvoice, ...invoices]);
    setIsAddInvoiceModalOpen(false);
    showToast(`Created invoice ${newInvoice.invoiceNumber} for ${patient.name}`, 'success');
  };

  const handleOpenPatientBill = (inv: Invoice) => {
    const pt = patients.find(
      p => p.id === inv.patientId || p.name.toLowerCase() === inv.patientName.toLowerCase()
    ) || {
      id: inv.patientId,
      code: inv.patientCode || 'DF-2026-PAT',
      name: inv.patientName,
      age: inv.patientAge || 32,
      gender: inv.patientGender || 'Male',
      phone: '+91 98765 43210',
      email: `${inv.patientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      balanceDue: inv.balanceDue,
      allergies: [],
      medicalAlerts: []
    } as Patient;

    const allApts = appointments || StorageService.getAppointments();
    const apt = allApts.find(
      a => a.id === inv.appointmentId || a.patientId === pt.id || a.patientName.toLowerCase() === pt.name.toLowerCase()
    ) || null;

    setActiveBillPatient({
      patient: pt,
      invoice: inv,
      appointment: apt
    });
  };

  const handleSavePatientBill = (
    updatedInvoice: Invoice,
    updatedPatientData: { age: number; gender: 'Male' | 'Female' | 'Other' }
  ) => {
    // 1. Prevent sync useEffect from ever re-opening this bill
    if (targetPatientId) {
      consumedTargetKeysRef.current.add(`${targetPatientId}-${targetAppointmentId || ''}`);
      consumedTargetKeysRef.current.add(`${targetPatientId}-`);
    }
    if (activeBillPatient?.patient?.id) {
      consumedTargetKeysRef.current.add(`${activeBillPatient.patient.id}-${activeBillPatient.appointment?.id || ''}`);
      consumedTargetKeysRef.current.add(`${activeBillPatient.patient.id}-`);
    }

    // 2. Match existing invoice to update in place instead of creating duplicate bills on multiple clicks
    const existingIndex = invoices.findIndex(
      i =>
        i.id === updatedInvoice.id ||
        i.invoiceNumber === updatedInvoice.invoiceNumber ||
        (activeBillPatient?.invoice?.id && i.id === activeBillPatient.invoice.id) ||
        (updatedInvoice.appointmentId && i.appointmentId && i.appointmentId === updatedInvoice.appointmentId) ||
        (i.patientId === updatedInvoice.patientId && i.status !== 'paid' && (!i.appointmentId || i.appointmentId === updatedInvoice.appointmentId)) ||
        (i.patientId === updatedInvoice.patientId && !updatedInvoice.appointmentId) ||
        (i.patientName.trim().toLowerCase() === updatedInvoice.patientName.trim().toLowerCase() && i.status !== 'paid')
    );

    let newInvoices: Invoice[];
    let finalSavedInvoice: Invoice;

    if (existingIndex >= 0) {
      const existing = invoices[existingIndex];
      finalSavedInvoice = {
        ...updatedInvoice,
        id: existing.id,
        invoiceNumber: existing.invoiceNumber,
        sentToReceptionist: true,
        isDraft: updatedInvoice.isDraft ?? existing.isDraft ?? false
      };
      newInvoices = [...invoices];
      newInvoices[existingIndex] = finalSavedInvoice;
    } else {
      finalSavedInvoice = {
        ...updatedInvoice,
        sentToReceptionist: true
      };
      newInvoices = [finalSavedInvoice, ...invoices];
    }
    onSaveInvoices(newInvoices);

    const existingPatient = patients.find(p => p.id === updatedInvoice.patientId);
    if (existingPatient) {
      const patientTotalBalance = newInvoices
        .filter(i => i.patientId === existingPatient.id)
        .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

      const updatedPatient: Patient = {
        ...existingPatient,
        age: updatedPatientData.age,
        gender: updatedPatientData.gender,
        balanceDue: patientTotalBalance
      };

      StorageService.updatePatient(updatedPatient);
      if (onSavePatients) {
        onSavePatients(patients.map(p => (p.id === updatedPatient.id ? updatedPatient : p)));
      }
    }

    // 3. Immediately close patient bill view and return to general billing table
    setActiveBillPatient(null);
    if (onClearTargetPatient) {
      onClearTargetPatient();
    }
    setHighlightedInvoiceId(finalSavedInvoice.id);

    showToast(`Bill ${finalSavedInvoice.invoiceNumber} saved & synced with Receptionist Desk for ${finalSavedInvoice.patientName}.`, 'success');
  };

  // Doctor delete invoice handler
  const handleDeleteInvoice = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    if (window.confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber} for ${inv.patientName}? This action cannot be undone.`)) {
      const updatedInvoices = invoices.filter(i => i.id !== invoiceId);
      onSaveInvoices(updatedInvoices);
      StorageService.deleteInvoice(invoiceId);

      const pt = patients.find(p => p.id === inv.patientId);
      if (pt) {
        const newBalance = updatedInvoices
          .filter(i => i.patientId === pt.id)
          .reduce((sum, i) => sum + (i.balanceDue || 0), 0);
        const updatedPt = { ...pt, balanceDue: newBalance };
        StorageService.updatePatient(updatedPt);
        if (onSavePatients) {
          onSavePatients(patients.map(p => (p.id === updatedPt.id ? updatedPt : p)));
        }
      }

      showToast(`Invoice ${inv.invoiceNumber} deleted successfully.`, 'info');
      if (activeBillPatient?.invoice?.id === invoiceId) {
        setActiveBillPatient(null);
      }
    }
  };

  // Option 1: Save as Draft, clicking which will download the bill in PDF format
  const handleSaveAsDraft = (inv: Invoice) => {
    const pt = patients.find(p => p.id === inv.patientId) || currentPatient;
    const draftInvoice: Invoice = {
      ...inv,
      isDraft: true
    };
    const existingIdx = invoices.findIndex(i => i.id === inv.id);
    let updatedInvoices: Invoice[];
    if (existingIdx >= 0) {
      updatedInvoices = [...invoices];
      updatedInvoices[existingIdx] = draftInvoice;
    } else {
      updatedInvoices = [draftInvoice, ...invoices];
    }
    onSaveInvoices(updatedInvoices);

    downloadTaxInvoicePdfBlob(draftInvoice, pt);
    showToast(`Bill ${inv.invoiceNumber} saved as Draft & downloaded in PDF format.`, 'success');
  };


  // If focused on a specific Patient Bill, replace the main content area
  if (activeBillPatient) {
    return (
      <PatientBillView
        patient={activeBillPatient.patient}
        invoice={activeBillPatient.invoice}
        appointment={activeBillPatient.appointment}
        treatmentPlans={treatmentPlans}
        onSave={handleSavePatientBill}
        onDeleteInvoice={handleDeleteInvoice}
        onBack={() => {
          setActiveBillPatient(null);
          if (onClearTargetPatient) {
            onClearTargetPatient();
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Patient or Staff Header */}
      {isPatient && currentPatient ? (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-[#C8B58D]/30 shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#C8B58D]" />
                <span>Patient Billing &bull; Zero-Interest Healthcare Financing</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
                My Invoices &amp; Payment History
              </h1>
              <p className="text-xs text-[#6F6D69]">
                Review treatment itemized invoices, balance statements, cashless insurance pre-authorizations, and official tax-deductible receipts.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleDownloadAnnualStatement}
                className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#C8B58D]" />
                <span>Download Tax Statement</span>
              </button>
              {totalDue > 0 && (
                <button
                  onClick={() => {
                    const unpaidInv = displayedInvoices.find(i => (i.balanceDue !== undefined ? i.balanceDue : (i.totalAmount || i.total || 0) - i.amountPaid) > 0);
                    if (unpaidInv) handleOpenPatientPay(unpaidInv);
                  }}
                  className="btn-primary text-xs cursor-pointer flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>PAY NOW (₹{totalDue.toLocaleString()})</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6F6D69]">Total Invoiced</span>
                <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-[#252525]">₹{totalBilled.toLocaleString()}</p>
              <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">Across all dental visits</p>
            </div>

            <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6F6D69]">Total Paid to Date</span>
                <span className="p-2 rounded-xl bg-[#8FA88D]/20 text-[#3B4D3A]">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA88D]" />
                </span>
              </div>
              <p className="text-2xl font-black text-[#3B4D3A]">₹{totalPaid.toLocaleString()}</p>
              <p className="text-[11px] text-[#3B4D3A] font-semibold mt-1">Receipts available for download</p>
            </div>

            <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6F6D69]">Current Balance Due</span>
                <span className={`p-2 rounded-xl ${totalDue > 0 ? 'bg-[#C5A66A]/20 text-[#594723]' : 'bg-[#8FA88D]/20 text-[#3B4D3A]'}`}>
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <p className={`text-2xl font-black ${totalDue > 0 ? 'text-[#594723]' : 'text-[#252525]'}`}>
                ₹{totalDue.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">
                {totalDue === 0 ? 'All accounts fully settled' : 'Payable via QR, UPI, Debit/Credit Cards'}
              </p>
            </div>

            <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6F6D69]">Supported Methods</span>
                <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                  <CreditCard className="w-4 h-4 text-[#C8B58D]" />
                </span>
              </div>
              <p className="text-xs font-black text-[#252525]">QR, UPI, Debit Card, Credit Card</p>
              <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">Instant GST dental tax receipts</p>
            </div>
          </div>

          {/* Invoices List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6F6D69]">
                Itemized Invoices ({displayedInvoices.length})
              </h2>
              <span className="text-xs text-[#999690]">Section 80D eligible medical bills</span>
            </div>

            {displayedInvoices.length === 0 ? (
              <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-8 text-center shadow-xs">
                <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[#252525]">No Invoices on Record</h3>
                <p className="text-xs text-[#6F6D69] mt-1 max-w-sm mx-auto">
                  Invoices will be automatically compiled and dispatched here after clinical treatments or consultations.
                </p>
              </div>
            ) : (
              displayedInvoices.map(inv => {
                const total = inv.totalAmount || inv.total || 0;
                const due = inv.balanceDue !== undefined && inv.balanceDue !== null ? inv.balanceDue : Math.max(0, total - inv.amountPaid);
                return (
                  <div
                    key={inv.id}
                    className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#252525] bg-[#EDE8DE] px-2 py-0.5 rounded-md border border-[#C8B58D]/30">
                            {inv.invoiceNumber}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            inv.status === 'paid'
                              ? 'bg-[#8FA88D]/20 text-[#3B4D3A] border border-[#8FA88D]/30'
                              : inv.status === 'partial' || inv.status === 'partially_paid'
                              ? 'bg-[#C5A66A]/20 text-[#594723] border border-[#C5A66A]/30'
                              : 'bg-[#B97870]/20 text-[#632924] border border-[#B97870]/30'
                          }`}>
                            {inv.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-[#999690]">Date: {inv.date}</span>
                        </div>

                        <h3 className="text-base font-extrabold text-[#252525]">
                          {inv.description || inv.items?.[0]?.description || 'Comprehensive Dental Care Procedure'}
                        </h3>

                        <p className="text-xs text-[#6F6D69]">
                          Due by {inv.dueDate} &bull; Payment mode:{' '}
                          <span className="font-semibold text-[#252525]">
                            {inv.paymentMethod || 'Online / Clinic Desk'}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-[#999690]">Total Invoiced</div>
                          <div className="text-lg font-black text-[#252525]">₹{total.toLocaleString()}</div>
                          <div className="text-xs text-[#6F6D69]">
                            Paid: <span className="font-bold text-[#3B4D3A]">₹{inv.amountPaid.toLocaleString()}</span>
                            {due > 0 && (
                              <span className="ml-1 text-[#594723] font-bold">
                                (Due: ₹{due.toLocaleString()})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleDownloadInvoicePdf(inv)}
                            className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-[#C8B58D]" />
                            <span>Download Tax Invoice</span>
                          </button>

                          {due > 0 && (
                            <button
                              onClick={() => handleOpenPatientPay(inv)}
                              className="btn-primary text-xs cursor-pointer flex items-center gap-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Pay Balance</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Patient Insurance Guidance Card */}
          <div className="bg-[#EDE8DE]/60 border border-stone-200/80 rounded-2xl p-5 shadow-xs text-xs text-[#252525]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525] shrink-0 border border-[#C8B58D]/30">
                <ShieldCheck className="w-5 h-5 text-[#C8B58D]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#252525] text-sm">Insurance Claims &amp; Tax Deductions</h4>
                <p className="leading-relaxed text-[#6F6D69]">
                  All receipts issued by Oralix carry clinic GSTIN, practitioner dental registration numbers (IDA/DCI), and procedure classifications suitable for Section 80D Income Tax deduction and private dental insurance reimbursement.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Staff / Admin Billing Header & Table */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8B58D]">
                FINANCIAL LEDGER &bull; INVOICING
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#252525]">
                Billing &amp; Payments
              </h1>
              <p className="text-xs text-[#6F6D69]">
                Manage dental itemized invoices, insurance claims, and real-time receipts.
              </p>
            </div>

            <button
              onClick={() => setIsAddInvoiceModalOpen(true)}
              className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          </div>

          {/* Financial KPIs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Financial Overview
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE8DE] text-[#252525] border border-[#C8B58D]/40 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C8B58D]" />
                  <span>{getDatePresetLabel()}</span>
                </span>
                {statusFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                    {statusFilter === 'paid' ? 'Paid Bills' : 'Outstanding Bills'}
                  </span>
                )}
              </div>
              {isFilterModified && (
                <button
                  type="button"
                  onClick={resetToToday}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Today's Bills</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
                <div className="text-xs font-semibold text-gray-500">Total Billed</div>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  INR ₹{totalBilled.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  From {filteredInvoices.length} {filteredInvoices.length === 1 ? 'treatment' : 'treatments'} ({getDatePresetLabel()})
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
                <div className="text-xs font-semibold text-gray-500">Collected Revenue</div>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  INR ₹{totalPaid.toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Directly credited ({getDatePresetLabel()})
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
                <div className="text-xs font-semibold text-gray-500">Outstanding Balance Due</div>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  INR ₹{totalDue.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Pending settlement ({getDatePresetLabel()})
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar: Placement directly above Invoice Table & alongside/beneath search */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3.5 relative z-20">
            {/* Row 1: Search Bar + Payment Settlement Status Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by invoice number, patient, or treatment..."
                  className="w-full text-xs pl-9 pr-8 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C8B58D] text-gray-800 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Payment Settlement Status Tabs */}
              <div className="inline-flex items-center p-1 bg-stone-100 rounded-lg border border-stone-200 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'all'
                      ? 'bg-white text-[#252525] shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>All Statuses</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === 'all' ? 'bg-[#252525] text-white' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {dateScopedInvoices.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('paid')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'paid'
                      ? 'bg-white text-emerald-800 shadow-xs font-bold ring-1 ring-emerald-500/20'
                      : 'text-stone-600 hover:text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === 'paid' ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span>Paid Bills</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {paidCountInScope}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('outstanding')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'outstanding'
                      ? 'bg-white text-amber-800 shadow-xs font-bold ring-1 ring-amber-500/20'
                      : 'text-stone-600 hover:text-amber-700'
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 ${statusFilter === 'outstanding' ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span>Remaining / Outstanding</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === 'outstanding' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {outstandingCountInScope}
                  </span>
                </button>
              </div>
            </div>

            {/* Row 2: Date Presets & Custom Date Range Pickers */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2.5 border-t border-gray-100 relative z-20">
              {/* Quick Period Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase text-stone-400 mr-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C8B58D]" /> Period:
                </span>

                {/* Preset: Today's Bills */}
                <button
                  type="button"
                  onClick={() => applyDatePreset('today')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    datePreset === 'today'
                      ? 'bg-[#252525] text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${datePreset === 'today' ? 'bg-[#C8B58D]' : 'bg-stone-400'}`} />
                  <span>Today's Bills</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyDatePreset('yesterday')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                    datePreset === 'yesterday'
                      ? 'bg-[#252525] text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  Yesterday
                </button>

                <button
                  type="button"
                  onClick={() => applyDatePreset('last7days')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                    datePreset === 'last7days'
                      ? 'bg-[#252525] text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  Last 7 Days
                </button>

                <button
                  type="button"
                  onClick={() => applyDatePreset('thisMonth')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                    datePreset === 'thisMonth'
                      ? 'bg-[#252525] text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  This Month
                </button>

                {/* View All Bills / All Dates Option */}
                <button
                  type="button"
                  onClick={() => applyDatePreset('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                    datePreset === 'all'
                      ? 'bg-[#252525] text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  All Dates / View All Bills
                </button>
              </div>

              {/* Single Date Picker Control & Reset */}
              <div className="flex items-center justify-end gap-2.5 flex-wrap relative z-30 date-filter-group">
                {(selectedDate !== todayDateStr || datePreset !== 'today') && (
                  <button
                    type="button"
                    onClick={resetToToday}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2B2823] bg-[#F0EDE6] hover:bg-[#E5E0D8] border border-[#E5E0D8] hover:border-[#D5CFC5] rounded-full shadow-2xs transition-all duration-200 ease-in-out animate-in fade-in cursor-pointer select-none"
                    title="Reset to default Today's Bills view"
                  >
                    <RotateCcw className="w-3 h-3 text-[#C8B58D]" />
                    <span>Reset to Today</span>
                  </button>
                )}

                <BillingDatePickerPopover
                  value={selectedDate}
                  onChange={handleSingleDateChange}
                  onClear={clearAllDateFilter}
                />
              </div>
            </div>

            {/* Scope Summary Strip */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>Showing</span>
                <span className="font-bold text-gray-800">{filteredInvoices.length}</span>
                <span>of</span>
                <span className="font-bold text-gray-800">{displayedInvoices.length}</span>
                <span>total bills</span>
                <span className="text-stone-300">&bull;</span>
                <span>Scope:</span>
                <span className="font-semibold text-stone-700">{getDatePresetLabel()}</span>
                {statusFilter !== 'all' && (
                  <>
                    <span className="text-stone-300">&bull;</span>
                    <span>Status:</span>
                    <span className="font-semibold text-stone-700">
                      {statusFilter === 'paid' ? 'Paid Bills' : 'Remaining / Outstanding'}
                    </span>
                  </>
                )}
                {searchQuery && (
                  <>
                    <span className="text-stone-300">&bull;</span>
                    <span>Search:</span>
                    <span className="font-semibold text-stone-700">"{searchQuery}"</span>
                  </>
                )}
              </div>

              {datePreset === 'today' && !isFilterModified && (
                <div className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-[#3B4D3A] bg-[#8FA88D]/15 px-2 py-0.5 rounded-full border border-[#8FA88D]/30">
                  <Check className="w-2.5 h-2.5 text-[#3B4D3A]" /> Default View Active
                </div>
              )}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden relative z-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Total Fee</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3 text-stone-400">
                            <Receipt className="w-6 h-6 text-stone-400" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-800">No Invoices Found</h3>
                          <p className="text-xs text-gray-500 mt-1 max-w-sm">
                            {datePreset === 'today'
                              ? "No invoices match today's date with the current filters. You can view all historical bills or reset to today."
                              : datePreset === 'yesterday'
                              ? "No invoices match yesterday's date with the current filters. You can view all historical bills or reset to today."
                              : selectedDate
                              ? `No invoices match the selected date (${formatDisplayDate(selectedDate)}) with the current filters. You can view all historical bills or reset to today.`
                              : "No invoices match the selected date filter and payment status."}
                          </p>
                          <div className="mt-4 flex items-center gap-2">
                            {datePreset !== 'all' && (
                              <button
                                type="button"
                                onClick={clearAllDateFilter}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
                              >
                                View All Historical Bills
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={resetToToday}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#252525] hover:bg-[#3D3B37] rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-[#C8B58D]" />
                              <span>Reset to Today's Bills</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr
                        key={inv.id}
                        className={`transition ${
                          highlightedInvoiceId === inv.id
                            ? 'bg-[#EDE8DE]/40 ring-1 ring-[#C8B58D] font-medium'
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">{inv.invoiceNumber}</span>
                            {highlightedInvoiceId === inv.id && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-[#8FA88D]/25 text-[#3B4D3A] border border-[#8FA88D]/30">
                                SAVED
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block">{inv.date}</span>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenPatientBill(inv)}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer inline-flex items-center gap-1.5 group"
                            title={`Click to open detailed bill for ${inv.patientName}`}
                          >
                            <span>{inv.patientName}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity text-blue-500" />
                          </button>
                          {inv.patientCode && (
                            <span className="text-[10px] text-gray-400 block font-mono">
                              {inv.patientCode}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-[200px]">
                          <span className="font-medium text-gray-700 truncate block">
                            {inv.description || inv.items?.[0]?.description || 'Dental Procedure'}
                          </span>
                          {inv.paymentMethod && (
                            <span className="text-[10px] text-gray-400 uppercase">
                              Via {inv.paymentMethod}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-bold text-gray-900">
                          <div>₹{(inv.totalAmount || inv.total || 0).toLocaleString()}</div>
                          {inv.discount && inv.discount > 0 ? (
                            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                              <span className="line-through text-stone-400">₹{(inv.subtotal || ((inv.totalAmount || inv.total || 0) + inv.discount)).toLocaleString()}</span>
                              <span>(-₹{inv.discount.toLocaleString()})</span>
                            </div>
                          ) : null}
                        </td>

                        <td className="py-3 px-4 text-emerald-600 font-bold">
                          ₹{inv.amountPaid.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 font-bold text-amber-600">
                          ₹{inv.balanceDue.toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'partial' || inv.status === 'partially_paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {inv.status === 'partial' ? 'PARTIAL' : inv.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {inv.sentToReceptionist && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#8FA88D]/25 text-[#3B4D3A] border border-[#8FA88D]/30 inline-flex items-center gap-1">
                                <Check className="w-2.5 h-2.5 text-[#3B4D3A]" /> Reception
                              </span>
                            )}
                            {inv.isDraft && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                                DRAFT
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">


                            {/* Save as Draft (Downloads PDF format) */}
                            <button
                              type="button"
                              onClick={() => handleSaveAsDraft(inv)}
                              className="px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:text-[#252525] bg-stone-100 hover:bg-[#EDE8DE] border border-stone-200 rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Save as Draft & Download PDF"
                            >
                              <Download className="w-3 h-3 text-[#C8B58D]" />
                              <span>Save as Draft</span>
                            </button>

                            {/* Doctor Delete Bill Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Verified Real Payment Modal (Small, Centered Modal matching Appointment Booking UI) */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252525]/60 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl border border-stone-200/80 rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 relative overflow-hidden text-[#252525] flex flex-col max-h-[90vh]">
            
            {/* Top Studio Header matching Booking Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center text-[#252525] shadow-2xs">
                  <CreditCard className="w-4 h-4 text-[#C8B58D]" />
                </span>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[10px] font-extrabold uppercase tracking-wider text-[#252525] border border-[#C8B58D]/20 mb-0.5">
                    <Sparkles className="w-3 h-3 text-[#C8B58D]" />
                    <span>Oralix Patient Checkout</span>
                  </div>
                  <h2 className="text-base font-extrabold text-[#252525] tracking-tight">
                    Pay Balance
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCancelPayment}
                className="w-8 h-8 rounded-xl text-[#6F6D69] hover:text-[#252525] hover:bg-[#EDE8DE] flex items-center justify-center text-sm cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Compact Invoice Statement Summary Box */}
              <div className="p-3.5 bg-[#EDE8DE]/40 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#252525]">
                  <span className="font-mono bg-[#EDE8DE] px-2 py-0.5 rounded border border-[#C8B58D]/30">
                    {selectedInvoiceForPayment.invoiceNumber}
                  </span>
                  <span className="text-[11px] text-[#6F6D69]">Date: {selectedInvoiceForPayment.date}</span>
                </div>
                
                <div className="flex items-baseline justify-between pt-1 border-t border-stone-200/60">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6F6D69] block">
                      Outstanding Balance
                    </span>
                    <span className="text-2xl font-black text-[#594723]">
                      ₹{selectedInvoiceForPayment.balanceDue.toLocaleString()}
                    </span>
                  </div>
                  {selectedInvoiceForPayment.amountPaid > 0 && (
                    <div className="text-right text-[11px] text-[#3B4D3A] font-semibold">
                      Paid: ₹{selectedInvoiceForPayment.amountPaid.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {paymentState === 'successful' ? (
                <div className="py-4 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-200">
                      Payment Successful
                    </span>
                    <h3 className="text-lg font-extrabold text-[#252525]">₹{paymentAmount.toLocaleString()} Settled</h3>
                    <p className="text-xs text-[#6F6D69]">
                      Invoice balance updated to ₹0 in Oralix records.
                    </p>
                  </div>

                  <div className="p-3 bg-[#EDE8DE]/40 rounded-xl border border-stone-200/80 text-xs space-y-1.5 text-left">
                    <div className="flex justify-between">
                      <span className="text-[#6F6D69]">Invoice:</span>
                      <span className="font-bold font-mono">{selectedInvoiceForPayment.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6F6D69]">Payment ID:</span>
                      <span className="font-bold font-mono">{lastCompletedTxId || `DF-DEMO-${Date.now()}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6F6D69]">Method:</span>
                      <span className="font-bold">{paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6F6D69]">Status:</span>
                      <span className="font-extrabold text-emerald-600 uppercase">PAID</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedInvoiceForPayment(null);
                      setPaymentState('pending');
                    }}
                    className="btn-primary w-full text-xs font-extrabold py-2.5 cursor-pointer"
                  >
                    Return to Invoices &amp; Receipts
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6F6D69] mb-2">
                      Choose Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['UPI / QR', 'Credit Card', 'Net Banking', 'Wallet'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            paymentMethod === m
                              ? 'bg-[#EDE8DE] border-[#C8B58D] text-[#252525] shadow-2xs font-extrabold'
                              : 'bg-white border-stone-200 text-[#6F6D69] hover:bg-stone-50'
                          }`}
                        >
                          {m === 'UPI / QR' && <QrCode className="w-3.5 h-3.5 text-[#C8B58D]" />}
                          {m === 'Credit Card' && <CreditCard className="w-3.5 h-3.5 text-[#252525]" />}
                          {m === 'Net Banking' && <Landmark className="w-3.5 h-3.5 text-[#252525]" />}
                          {m === 'Wallet' && <Wallet className="w-3.5 h-3.5 text-[#C8B58D]" />}
                          <span>{m}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* METHOD 1: LOCAL INLINE SVG MOCK QR CODE */}
                  {paymentMethod === 'UPI / QR' && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200/80 text-center space-y-2">
                      <div className="w-36 h-36 mx-auto">
                        <MockLocalQRCode amount={paymentAmount} invoiceNo={selectedInvoiceForPayment.invoiceNumber} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-mono font-bold text-[#252525]">
                          VPA: oralix.care@hdfcbank
                        </p>
                        <p className="text-[11px] font-extrabold text-[#3B4D3A]">
                          Amount: ₹{paymentAmount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-[#6F6D69]">
                          Scan with GPay, PhonePe, Paytm or BHIM
                        </p>
                      </div>
                    </div>
                  )}

                  {/* METHOD 2: CREDIT CARD */}
                  {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200/80 space-y-2 text-left">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6F6D69] mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          defaultValue={currentPatient?.name || 'Patient Cardholder'}
                          required
                          className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white text-[#252525]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-[#6F6D69] mb-1">
                            Card Number
                          </label>
                          <input
                            type="text"
                            maxLength={19}
                            defaultValue="4532 •••• •••• 8849"
                            required
                            className="w-full px-2 py-1.5 text-xs border border-stone-200 rounded-lg font-mono text-[#252525]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <label className="block text-[10px] font-bold text-[#6F6D69] mb-1">
                              Expiry
                            </label>
                            <input
                              type="text"
                              defaultValue="12/28"
                              required
                              className="w-full px-1 py-1.5 text-xs border border-stone-200 rounded-lg font-mono text-center text-[#252525]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#6F6D69] mb-1">
                              CVV
                            </label>
                            <input
                              type="password"
                              maxLength={3}
                              defaultValue="884"
                              required
                              className="w-full px-1 py-1.5 text-xs border border-stone-200 rounded-lg font-mono text-center text-[#252525]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* METHOD 3: NET BANKING */}
                  {paymentMethod === 'Net Banking' && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200/80 space-y-2 text-left">
                      <label className="block text-[10px] font-bold text-[#6F6D69] mb-1">
                        Select Preferred Bank
                      </label>
                      <select className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white font-semibold text-[#252525]">
                        <option value="hdfc">HDFC Bank NetBanking</option>
                        <option value="icici">ICICI Bank Internet Banking</option>
                        <option value="sbi">State Bank of India (SBI)</option>
                        <option value="axis">Axis Bank Retail Banking</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                        <option value="pnb">Punjab National Bank</option>
                      </select>
                    </div>
                  )}

                  {/* METHOD 4: WALLET */}
                  {paymentMethod === 'Wallet' && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200/80 space-y-2 text-left">
                      <label className="block text-[10px] font-bold text-[#6F6D69] mb-1">
                        Select Digital Wallet
                      </label>
                      <select className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white font-semibold text-[#252525]">
                        <option value="phonepe">PhonePe Wallet</option>
                        <option value="gpay">Google Pay</option>
                        <option value="paytm">Paytm Wallet</option>
                        <option value="amazon">Amazon Pay Balance</option>
                        <option value="mobikwik">MobiKwik Wallet</option>
                      </select>
                    </div>
                  )}

                  {/* Submit Action */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200/80">
                    <button
                      type="button"
                      onClick={handleCancelPayment}
                      disabled={isProcessingPayment}
                      className="btn-secondary text-xs cursor-pointer px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="btn-primary text-xs cursor-pointer flex items-center justify-center gap-1.5 px-5 py-2 min-w-[130px]"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Pay ₹{paymentAmount.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal for Staff */}
      {isAddInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Create New Invoice</h2>
              <button
                onClick={() => setIsAddInvoiceModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Patient *
                </label>
                <select
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
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
                  Itemized Treatments / Description *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={e => setTotalAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Initial Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs cursor-pointer"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
