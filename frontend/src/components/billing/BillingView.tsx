import React, { useState, useMemo } from 'react';
import {
  Invoice,
  Patient,
  User,
  InvoiceItem,
  BillingPaymentMethod,
  BillingPaymentStatus,
  PaymentTransaction
} from '../../types';
import { useToast } from '../common/Toast';
import { StorageService } from '../../utils/storage';
import { downloadOralixDigitalReceiptPdf, downloadTaxInvoicePdfBlob } from '../../utils/pdfGenerator';
import { BillingEmailService } from '../../utils/billingEmailService';
import { STANDARD_DENTAL_SERVICES, DentalServiceOption } from '../../data/seedData';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  ShieldCheck,
  FileText,
  Receipt,
  X,
  AlertCircle,
  Mail,
  RefreshCw,
  Trash2,
  UserCheck,
  Calendar,
  Wallet,
  DollarSign,
  Send,
  Eye,
  Check,
  TrendingUp,
  Banknote,
  Smartphone,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface BillingViewProps {
  currentUser: User;
  invoices: Invoice[];
  patients: Patient[];
  onSaveInvoices: (invoices: Invoice[]) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
  onSavePatients?: (patients: Patient[]) => void;
  onOpenBooking?: () => void;
  onOpenPortal?: () => void;
  onNavigateAuth?: (mode: 'signin' | 'signup') => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  currentUser,
  invoices,
  patients,
  onSaveInvoices,
  onSelectPatient,
  onNavigateToChart,
  onSavePatients
}) => {
  const { showToast } = useToast();

  const isPatient = currentUser.role === 'patient';
  const currentPatient = isPatient
    ? patients.find(
        p =>
          (currentUser.patientId && p.id === currentUser.patientId) ||
          p.id === currentUser.id ||
          (p.email && currentUser.email && p.email.toLowerCase() === currentUser.email.toLowerCase())
      ) || StorageService.ensurePatientRecord(currentUser)
    : null;

  // View state: 'create' = new billing form, 'history' = billing history table
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');

  // Search & Filter state for History
  const [historySearchPatient, setHistorySearchPatient] = useState('');
  const [historySearchInvoice, setHistorySearchInvoice] = useState('');
  const [historySearchDate, setHistorySearchDate] = useState('');

  // --------------------------------------------------------------------------
  // BILLING FORM STATE
  // --------------------------------------------------------------------------
  // A. Patient Selection
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => {
    return patients.length > 0 ? patients[0] : null;
  });

  // B. Treatment / Service Selection
  const [selectedServiceId, setSelectedServiceId] = useState<string>(STANDARD_DENTAL_SERVICES[0].id);
  const [customServiceName, setCustomServiceName] = useState('');
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);
  const [serviceUnitPrice, setServiceUnitPrice] = useState<number>(STANDARD_DENTAL_SERVICES[0].defaultFee);
  const [billItems, setBillItems] = useState<InvoiceItem[]>([
    {
      id: `item-${Date.now()}-1`,
      description: STANDARD_DENTAL_SERVICES[0].name,
      code: STANDARD_DENTAL_SERVICES[0].code,
      quantity: 1,
      unitPrice: STANDARD_DENTAL_SERVICES[0].defaultFee,
      total: STANDARD_DENTAL_SERVICES[0].defaultFee
    }
  ]);

  // C. Charges
  const [consultationCharge, setConsultationCharge] = useState<number>(500);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // D. Payment
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<BillingPaymentStatus>('Paid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------------------------------------------------------------
  // DIGITAL RECEIPT MODAL STATE
  // --------------------------------------------------------------------------
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<Invoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  // --------------------------------------------------------------------------
  // COLLECTION SUMMARY COMPUTATIONS
  // --------------------------------------------------------------------------
  const transactions = useMemo(() => StorageService.getTransactions(), [invoices]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthPrefix = useMemo(() => todayStr.slice(0, 7), [todayStr]); // YYYY-MM

  const collectionStats = useMemo(() => {
    // 1. Today's Collection
    const todayPaid = invoices
      .filter(inv => inv.date === todayStr && (inv.status === 'paid' || inv.amountPaid > 0))
      .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

    // 2. Pending Amount
    const totalPending = invoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    // 3. Number of Transactions
    const totalTxCount = invoices.filter(inv => inv.amountPaid > 0).length;

    // 4. Monthly Collection
    const monthlyPaid = invoices
      .filter(inv => inv.date && inv.date.startsWith(currentMonthPrefix))
      .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

    return {
      todayPaid,
      totalPending,
      totalTxCount,
      monthlyPaid
    };
  }, [invoices, todayStr, currentMonthPrefix]);

  // --------------------------------------------------------------------------
  // SUB-CALCULATIONS FOR CURRENT BILL
  // --------------------------------------------------------------------------
  const treatmentServicesTotal = useMemo(() => {
    return billItems.reduce((acc, item) => acc + (item.total || 0), 0);
  }, [billItems]);

  const subtotal = useMemo(() => {
    return Math.max(0, treatmentServicesTotal + (consultationCharge || 0));
  }, [treatmentServicesTotal, consultationCharge]);

  const finalPayableAmount = useMemo(() => {
    return Math.max(0, subtotal - (discountAmount || 0));
  }, [subtotal, discountAmount]);

  // Filter patients for search dropdown
  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return patients.slice(0, 8);
    const q = patientSearchTerm.toLowerCase();
    return patients.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [patients, patientSearchTerm]);

  // Filter invoices for History Table
  const filteredHistoryInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchPatient = !historySearchPatient.trim() || inv.patientName.toLowerCase().includes(historySearchPatient.toLowerCase());
      const matchInvoice = !historySearchInvoice.trim() || inv.invoiceNumber.toLowerCase().includes(historySearchInvoice.toLowerCase());
      const matchDate = !historySearchDate || inv.date === historySearchDate;
      return matchPatient && matchInvoice && matchDate;
    });
  }, [invoices, historySearchPatient, historySearchInvoice, historySearchDate]);

  // --------------------------------------------------------------------------
  // HANDLERS FOR SERVICE SELECTION
  // --------------------------------------------------------------------------
  const handleSelectServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId === 'custom') {
      setServiceUnitPrice(0);
      setCustomServiceName('');
    } else {
      const found = STANDARD_DENTAL_SERVICES.find(s => s.id === serviceId);
      if (found) {
        setServiceUnitPrice(found.defaultFee);
        setCustomServiceName('');
      }
    }
  };

  const handleAddServiceItem = () => {
    let name = '';
    let code = 'D9999';

    if (selectedServiceId === 'custom') {
      if (!customServiceName.trim()) {
        showToast('Please enter a description for the custom service.', 'error');
        return;
      }
      name = customServiceName.trim();
    } else {
      const srv = STANDARD_DENTAL_SERVICES.find(s => s.id === selectedServiceId);
      if (!srv) return;
      name = srv.name;
      code = srv.code;
    }

    if (serviceQuantity < 1) {
      showToast('Quantity must be at least 1.', 'error');
      return;
    }

    if (serviceUnitPrice < 0) {
      showToast('Unit price cannot be negative.', 'error');
      return;
    }

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: name,
      code,
      quantity: Number(serviceQuantity),
      unitPrice: Number(serviceUnitPrice),
      total: Number(serviceQuantity) * Number(serviceUnitPrice)
    };

    setBillItems(prev => [...prev, newItem]);
    showToast(`Added: ${name}`, 'info');

    // Reset service selector inputs
    setSelectedServiceId(STANDARD_DENTAL_SERVICES[0].id);
    setServiceUnitPrice(STANDARD_DENTAL_SERVICES[0].defaultFee);
    setServiceQuantity(1);
    setCustomServiceName('');
  };

  const handleRemoveServiceItem = (itemId: string | undefined, index: number) => {
    setBillItems(prev => prev.filter((item, i) => (item.id ? item.id !== itemId : i !== index)));
  };

  // --------------------------------------------------------------------------
  // PRIMARY ACTION: RECORD PAYMENT & GENERATE RECEIPT
  // --------------------------------------------------------------------------
  const handleRecordPaymentAndGenerateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation
    if (!selectedPatient) {
      showToast('Validation Error: Patient is required.', 'error');
      return;
    }

    if (billItems.length === 0 && consultationCharge <= 0) {
      showToast('Validation Error: At least one treatment/service or consultation charge is required.', 'error');
      return;
    }

    if (discountAmount > subtotal) {
      showToast('Validation Error: Discount cannot exceed the subtotal amount.', 'error');
      return;
    }

    if (finalPayableAmount < 0) {
      showToast('Validation Error: Final payable amount cannot be negative.', 'error');
      return;
    }

    if (!paymentMethod) {
      showToast('Validation Error: Please select a payment method.', 'error');
      return;
    }

    // Prevent duplicate submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const invoiceNumber = `OX-INV-2026-0${invoices.length + 101}`;
      const isPaid = paymentStatus === 'Paid';
      const isFailed = paymentStatus === 'Failed';
      const paidAmt = isPaid ? finalPayableAmount : 0;
      const dueAmt = isPaid ? 0 : isFailed ? finalPayableAmount : finalPayableAmount;

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientCode: selectedPatient.code,
        patientEmail: selectedPatient.email,
        patientPhone: selectedPatient.phone,
        date: todayStr,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        items: [...billItems],
        consultationFee: consultationCharge,
        subtotal: subtotal,
        discount: discountAmount,
        total: finalPayableAmount,
        totalAmount: finalPayableAmount,
        amountPaid: paidAmt,
        balanceDue: dueAmt,
        status: isPaid ? 'paid' : isFailed ? 'failed' : 'pending',
        paymentMethod: paymentMethod,
        createdAt: new Date().toISOString(),
        emailSent: false,
        description: billItems.map(i => i.description).join(', ') || 'Consultation & Dental Services'
      };

      // 2. Persist Payment Transaction if Paid
      const txRef = `OX-PAY-${Date.now()}`;
      if (isPaid) {
        const tx: PaymentTransaction = {
          id: `tx-${Date.now()}`,
          invoiceId: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber,
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          amount: paidAmt,
          paymentMethod: paymentMethod as any,
          transactionRef: txRef,
          status: 'successful',
          timestamp: new Date().toISOString()
        };
        StorageService.addTransaction(tx);
      }

      // 3. Update Patient Outstanding Balance
      if (dueAmt > 0) {
        const updatedPatients = patients.map(p =>
          p.id === selectedPatient.id ? { ...p, balanceDue: (p.balanceDue || 0) + dueAmt } : p
        );
        if (onSavePatients) {
          onSavePatients(updatedPatients);
        } else {
          StorageService.savePatients(updatedPatients);
        }
      }

      showToast('Payment recorded successfully.', 'success');
      showToast('Receipt generated successfully.', 'success');

      // 4. Send Receipt Email automatically
      let emailSuccess = false;
      let emailErrorMsg: string | undefined;

      if (selectedPatient.email) {
        const emailResult = await BillingEmailService.sendReceipt({
          invoiceNumber: newInvoice.invoiceNumber,
          patientName: selectedPatient.name,
          patientEmail: selectedPatient.email,
          date: newInvoice.date,
          items: billItems,
          consultationFee: consultationCharge,
          subtotal: subtotal,
          discount: discountAmount,
          total: finalPayableAmount,
          amountPaid: paidAmt,
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus
        });

        if (emailResult.success) {
          emailSuccess = true;
          newInvoice.emailSent = true;
          newInvoice.emailSentAt = new Date().toISOString();
          showToast(`Receipt emailed successfully to ${selectedPatient.email}`, 'success');
        } else {
          emailErrorMsg = emailResult.error || 'Receipt email could not be sent.';
          newInvoice.emailSent = false;
          newInvoice.emailError = emailErrorMsg;
          showToast('Receipt email could not be sent.', 'error');
        }
      }

      // 5. Save updated invoices to state and storage
      const updatedInvoicesList = [newInvoice, ...invoices];
      onSaveInvoices(updatedInvoicesList);
      StorageService.saveInvoices(updatedInvoicesList);

      // 6. Open Digital Receipt View
      setActiveReceiptInvoice(newInvoice);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      console.error('[BillingView] Error creating bill:', err);
      showToast('An unexpected error occurred while generating receipt.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // RESEND RECEIPT EMAIL
  // --------------------------------------------------------------------------
  const handleResendReceiptEmail = async (invoice: Invoice) => {
    const patient = patients.find(p => p.id === invoice.patientId) || selectedPatient;
    const email = invoice.patientEmail || patient?.email;

    if (!email) {
      showToast('Unable to send: Patient has no registered email address.', 'error');
      return;
    }

    setIsResendingEmail(true);

    try {
      const result = await BillingEmailService.sendReceipt({
        invoiceNumber: invoice.invoiceNumber,
        patientName: invoice.patientName,
        patientEmail: email,
        date: invoice.date,
        items: invoice.items || [
          {
            description: invoice.description || 'Clinical Care Treatment',
            quantity: 1,
            unitPrice: invoice.totalAmount || invoice.total || 0,
            total: invoice.totalAmount || invoice.total || 0
          }
        ],
        consultationFee: invoice.consultationFee,
        subtotal: invoice.subtotal || invoice.totalAmount || invoice.total || 0,
        discount: invoice.discount || 0,
        total: invoice.total || invoice.totalAmount || 0,
        amountPaid: invoice.amountPaid || 0,
        paymentMethod: invoice.paymentMethod || 'UPI',
        paymentStatus: invoice.status === 'paid' ? 'Paid' : invoice.status === 'failed' ? 'Failed' : 'Pending'
      });

      if (result.success) {
        const updated = invoices.map(i =>
          i.id === invoice.id ? { ...i, emailSent: true, emailSentAt: new Date().toISOString(), emailError: undefined } : i
        );
        onSaveInvoices(updated);
        StorageService.saveInvoices(updated);

        if (activeReceiptInvoice && activeReceiptInvoice.id === invoice.id) {
          setActiveReceiptInvoice({ ...activeReceiptInvoice, emailSent: true, emailSentAt: new Date().toISOString(), emailError: undefined });
        }
        showToast('Receipt emailed successfully.', 'success');
      } else {
        const updated = invoices.map(i =>
          i.id === invoice.id ? { ...i, emailSent: false, emailError: result.error } : i
        );
        onSaveInvoices(updated);
        StorageService.saveInvoices(updated);

        if (activeReceiptInvoice && activeReceiptInvoice.id === invoice.id) {
          setActiveReceiptInvoice({ ...activeReceiptInvoice, emailSent: false, emailError: result.error });
        }
        showToast('Receipt email could not be sent.', 'error');
      }
    } catch {
      showToast('Receipt email could not be sent. Check network connection.', 'error');
    } finally {
      setIsResendingEmail(false);
    }
  };

  // --------------------------------------------------------------------------
  // DOWNLOAD RECEIPT PDF
  // --------------------------------------------------------------------------
  const handleDownloadReceiptPdf = (invoice: Invoice) => {
    const pt = patients.find(p => p.id === invoice.patientId) || selectedPatient || currentPatient;
    downloadOralixDigitalReceiptPdf(invoice, pt);
    showToast(`Downloaded Official Oralix Receipt: ${invoice.invoiceNumber}`, 'success');
  };

  // Reset bill creation form
  const handleResetBillingForm = () => {
    setBillItems([
      {
        id: `item-${Date.now()}-1`,
        description: STANDARD_DENTAL_SERVICES[0].name,
        code: STANDARD_DENTAL_SERVICES[0].code,
        quantity: 1,
        unitPrice: STANDARD_DENTAL_SERVICES[0].defaultFee,
        total: STANDARD_DENTAL_SERVICES[0].defaultFee
      }
    ]);
    setConsultationCharge(500);
    setDiscountAmount(0);
    setPaymentMethod('UPI');
    setPaymentStatus('Paid');
  };

  // --------------------------------------------------------------------------
  // PATIENT PORTAL BILLING VIEW (IF CURRENT USER IS PATIENT)
  // --------------------------------------------------------------------------
  if (isPatient && currentPatient) {
    const ptInvoices = invoices.filter(i => i.patientId === currentPatient.id);
    const ptTotalPaid = ptInvoices.reduce((a, b) => a + b.amountPaid, 0);
    const ptTotalDue = ptInvoices.reduce((a, b) => a + b.balanceDue, 0);

    return (
      <div className="space-y-6 pb-12">
        {/* Patient Billing Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-[#C8B58D]/30">
              <Sparkles className="w-3 h-3 text-[#C8B58D]" />
              <span>Oralix Patient Vault &bull; Billing &amp; Receipts</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
              My Invoices &amp; Digital Receipts
            </h1>
            <p className="text-xs text-[#6F6D69]">
              Review your treatment charges, official tax-deductible digital receipts, and payment statements.
            </p>
          </div>
        </div>

        {/* Patient Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold text-[#6F6D69] block mb-1">Total Settled</span>
            <p className="text-2xl font-black text-[#3B4D3A]">₹{ptTotalPaid.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-[#6F6D69] mt-1">Directly credited to Oralix clinic</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold text-[#6F6D69] block mb-1">Current Balance Due</span>
            <p className={`text-2xl font-black ${ptTotalDue > 0 ? 'text-[#594723]' : 'text-[#3B4D3A]'}`}>
              ₹{ptTotalDue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#6F6D69] mt-1">
              {ptTotalDue === 0 ? 'All treatments fully paid' : 'Payable at reception or via UPI'}
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold text-[#6F6D69] block mb-1">Receipts on File</span>
            <p className="text-2xl font-black text-[#252525]">{ptInvoices.length}</p>
            <p className="text-[11px] text-[#6F6D69] mt-1">Available for Section 80D tax claims</p>
          </div>
        </div>

        {/* Patient Invoices Table */}
        <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-stone-200/80 bg-[#EDE8DE]/40 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#252525]">
              Itemized Invoices &amp; Receipts ({ptInvoices.length})
            </h3>
          </div>

          {ptInvoices.length === 0 ? (
            <div className="p-8 text-center text-[#6F6D69] text-xs">
              No billing records found for your account.
            </div>
          ) : (
            <div className="divide-y divide-stone-200/80">
              {ptInvoices.map(inv => (
                <div key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#252525] bg-[#EDE8DE] px-2 py-0.5 rounded border border-[#C8B58D]/30">
                        {inv.invoiceNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        inv.status === 'paid' ? 'bg-[#8FA88D]/20 text-[#3B4D3A]' : 'bg-[#C5A66A]/20 text-[#594723]'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-[#6F6D69]">Date: {inv.date}</span>
                    </div>
                    <p className="text-xs font-bold text-[#252525]">{inv.description || 'Dental Procedure'}</p>
                    <p className="text-[11px] text-[#6F6D69]">
                      Payment Method: <span className="font-semibold text-[#252525]">{inv.paymentMethod || 'UPI'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-[#6F6D69]">Amount Paid</div>
                      <div className="text-base font-black text-[#252525]">₹{(inv.amountPaid || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <button
                      onClick={() => handleDownloadReceiptPdf(inv)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#252525] text-white hover:bg-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C8B58D]" />
                      <span>Receipt PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STAFF / RECEPTIONIST / ADMIN BILLING WORKFLOW
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* 4. COLLECTION SUMMARY AT TOP OF BILLING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Collection */}
        <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Today's Collection</span>
            <span className="p-2 rounded-xl bg-[#8FA88D]/20 text-[#3B4D3A]">
              <Banknote className="w-4 h-4 text-[#8FA88D]" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#3B4D3A]">
            ₹{collectionStats.todayPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#6F6D69] mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8FA88D] inline-block" />
            <span>Recorded today ({todayStr})</span>
          </p>
        </div>

        {/* Card 2: Pending Amount */}
        <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Pending Amount</span>
            <span className={`p-2 rounded-xl ${collectionStats.totalPending > 0 ? 'bg-[#C5A66A]/20 text-[#594723]' : 'bg-[#8FA88D]/20 text-[#3B4D3A]'}`}>
              <Clock className="w-4 h-4 text-[#C5A66A]" />
            </span>
          </div>
          <p className={`text-2xl font-black ${collectionStats.totalPending > 0 ? 'text-[#594723]' : 'text-[#252525]'}`}>
            ₹{collectionStats.totalPending.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#6F6D69] mt-1">Outstanding patient receivables</p>
        </div>

        {/* Card 3: Number of Transactions */}
        <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Transactions</span>
            <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
              <Receipt className="w-4 h-4 text-[#C8B58D]" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">{collectionStats.totalTxCount}</p>
          <p className="text-[11px] text-[#6F6D69] mt-1">Paid receipts issued on record</p>
        </div>

        {/* Card 4: Monthly Collection */}
        <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6F6D69]">Monthly Collection</span>
            <span className="p-2 rounded-xl bg-[#252525] text-white">
              <TrendingUp className="w-4 h-4 text-[#C8B58D]" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#252525]">
            ₹{collectionStats.monthlyPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#6F6D69] mt-1">Clinic ledger for {currentMonthPrefix}</p>
        </div>
      </div>

      {/* Sub-Navigation: Create Bill vs History */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3">
        <button
          onClick={() => setActiveSubTab('create')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'create'
              ? 'bg-[#252525] text-[#C8B58D] shadow-xs'
              : 'text-[#6F6D69] hover:bg-[#EDE8DE] hover:text-[#252525]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Patient Bill</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'bg-[#252525] text-[#C8B58D] shadow-xs'
              : 'text-[#6F6D69] hover:bg-[#EDE8DE] hover:text-[#252525]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Billing History &amp; Receipts ({invoices.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* VIEW A: CREATE BILL FOR RECEPTIONIST */}
      {/* ------------------------------------------------------------------- */}
      {activeSubTab === 'create' && (
        <form onSubmit={handleRecordPaymentAndGenerateReceipt} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Patient & Services & Charges (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* SECTION A: PATIENT SELECTION */}
              <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#EDE8DE] text-[#252525] flex items-center justify-center text-xs font-black">
                      A
                    </span>
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#252525]">
                      Patient Selection
                    </h2>
                  </div>
                  {selectedPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearchTerm('');
                      }}
                      className="text-[11px] font-bold text-[#6F6D69] hover:text-[#252525] transition cursor-pointer"
                    >
                      Change Patient
                    </button>
                  )}
                </div>

                {!selectedPatient ? (
                  <div className="space-y-2 relative">
                    <label className="block text-[11px] font-bold text-[#6F6D69]">
                      Search Patient by Name, Code, Phone, or Email *
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#6F6D69] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={patientSearchTerm}
                        onChange={e => {
                          setPatientSearchTerm(e.target.value);
                          setIsPatientDropdownOpen(true);
                        }}
                        onFocus={() => setIsPatientDropdownOpen(true)}
                        placeholder="Type patient name (e.g. Aravind, Vishal, Medha)..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F5F1] border border-stone-200 rounded-xl focus:outline-none focus:border-[#C8B58D] text-[#252525] shadow-2xs"
                      />
                    </div>

                    {/* Autocomplete Dropdown */}
                    {isPatientDropdownOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-stone-100">
                        {filteredPatients.length === 0 ? (
                          <div className="p-3 text-center text-xs text-[#6F6D69]">
                            No patient records match "{patientSearchTerm}".
                          </div>
                        ) : (
                          filteredPatients.map(pt => (
                            <button
                              key={pt.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(pt);
                                setIsPatientDropdownOpen(false);
                                setPatientSearchTerm('');
                              }}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-[#EDE8DE]/50 transition flex items-center justify-between text-xs cursor-pointer"
                            >
                              <div>
                                <span className="font-extrabold text-[#252525] block">{pt.name}</span>
                                <span className="text-[10px] text-[#6F6D69]">
                                  ID: {pt.code} &bull; {pt.phone} &bull; {pt.email || 'No email on record'}
                                </span>
                              </div>
                              <span className="text-[10px] font-extrabold text-[#C8B58D] bg-[#252525] px-2 py-0.5 rounded">
                                Select &rarr;
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Display Selected Patient Information Card */
                  <div className="p-4 bg-[#EDE8DE]/40 border border-[#C8B58D]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#252525] text-white flex items-center justify-center font-extrabold text-sm border border-[#C8B58D]/40 shrink-0">
                        {selectedPatient.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-[#252525]">{selectedPatient.name}</h3>
                          <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-stone-200">
                            {selectedPatient.code}
                          </span>
                        </div>
                        <p className="text-xs text-[#6F6D69]">
                          {selectedPatient.age} yrs &bull; {selectedPatient.gender} &bull; Phone: {selectedPatient.phone}
                        </p>
                        <p className="text-[11px] text-[#6F6D69] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#C8B58D]" />
                          <span>{selectedPatient.email || 'No email registered (receipt will be printable only)'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-stone-200/80 sm:pl-4 space-y-1">
                      <span className="text-[10px] font-bold text-[#6F6D69] uppercase block">Current Balance</span>
                      <span className={`text-base font-black ${selectedPatient.balanceDue > 0 ? 'text-[#594723]' : 'text-[#3B4D3A]'}`}>
                        ₹{(selectedPatient.balanceDue || 0).toLocaleString('en-IN')}
                      </span>
                      {selectedPatient.medicalAlerts && selectedPatient.medicalAlerts.length > 0 && (
                        <div className="text-[10px] text-[#8F3B34] font-bold flex items-center justify-end gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{selectedPatient.medicalAlerts[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION B: TREATMENT / SERVICE */}
              <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#EDE8DE] text-[#252525] flex items-center justify-center text-xs font-black">
                      B
                    </span>
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#252525]">
                      Treatments &amp; Services
                    </h2>
                  </div>
                  <span className="text-[11px] text-[#6F6D69]">{billItems.length} items added</span>
                </div>

                {/* Add Service Selector Form */}
                <div className="p-3.5 bg-[#F7F5F1] rounded-2xl border border-stone-200/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6F6D69] mb-1">
                        Select Dental Procedure / Service
                      </label>
                      <select
                        value={selectedServiceId}
                        onChange={e => handleSelectServiceChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-[#252525] font-semibold focus:outline-none focus:border-[#C8B58D]"
                      >
                        {STANDARD_DENTAL_SERVICES.map(srv => (
                          <option key={srv.id} value={srv.id}>
                            {srv.name} (₹{srv.defaultFee.toLocaleString('en-IN')})
                          </option>
                        ))}
                        <option value="custom">+ Other / Custom Clinical Service</option>
                      </select>
                    </div>

                    {selectedServiceId === 'custom' && (
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6F6D69] mb-1">
                          Custom Service Name *
                        </label>
                        <input
                          type="text"
                          value={customServiceName}
                          onChange={e => setCustomServiceName(e.target.value)}
                          placeholder="e.g. Suture Removal, Splinting..."
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-[#252525] focus:outline-none focus:border-[#C8B58D]"
                        />
                      </div>
                    )}

                    <div className={selectedServiceId === 'custom' ? 'sm:col-span-4' : 'sm:col-span-2'}>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6F6D69] mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={serviceQuantity}
                        onChange={e => setServiceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-[#252525] font-mono text-center font-bold focus:outline-none"
                      />
                    </div>

                    <div className={selectedServiceId === 'custom' ? 'sm:col-span-4' : 'sm:col-span-2'}>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6F6D69] mb-1">
                        Unit Price (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={serviceUnitPrice}
                        onChange={e => setServiceUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-[#252525] font-mono font-bold focus:outline-none"
                      />
                    </div>

                    <div className={selectedServiceId === 'custom' ? 'sm:col-span-4' : 'sm:col-span-2'} style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={handleAddServiceItem}
                        className="w-full py-2 bg-[#252525] text-white hover:bg-black rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-stone-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F5F1] text-[#6F6D69] font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
                      <tr>
                        <th className="py-2.5 px-3">Service / Procedure</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {billItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#6F6D69] text-xs">
                            No treatment items added yet. Select a service above to add charges.
                          </td>
                        </tr>
                      ) : (
                        billItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-stone-50/60 transition">
                            <td className="py-2.5 px-3 font-bold text-[#252525]">
                              {item.description}
                              {item.code && (
                                <span className="font-mono text-[9px] text-[#6F6D69] ml-1.5">
                                  ({item.code})
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-[#6F6D69]">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#6F6D69]">
                              ₹{item.unitPrice.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#252525]">
                              ₹{item.total.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveServiceItem(item.id, idx)}
                                title="Remove item"
                                className="p-1 text-stone-400 hover:text-[#8F3B34] transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Charges Calculation & Payment (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* SECTION C: CHARGES BREAKDOWN */}
              <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-200/60">
                  <span className="w-6 h-6 rounded-lg bg-[#EDE8DE] text-[#252525] flex items-center justify-center text-xs font-black">
                    C
                  </span>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#252525]">
                    Charges &amp; Calculations
                  </h2>
                </div>

                {/* Consultation Charge Input */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6F6D69] mb-1">
                    Consultation Charge (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={consultationCharge}
                    onChange={e => setConsultationCharge(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F5F1] border border-stone-200 rounded-xl text-[#252525] font-mono font-bold focus:outline-none focus:border-[#C8B58D]"
                  />
                  <span className="text-[10px] text-[#6F6D69] mt-0.5 block">Standard consultation fee is ₹500</span>
                </div>

                {/* Discount Input */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6F6D69] mb-1">
                    Discount Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={subtotal}
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F5F1] border border-stone-200 rounded-xl text-[#252525] font-mono font-bold focus:outline-none focus:border-[#C8B58D]"
                  />
                  {discountAmount > subtotal && (
                    <span className="text-[10px] text-[#8F3B34] font-bold mt-0.5 block">
                      Discount cannot exceed subtotal (₹{subtotal.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>

                {/* Real-time Calculation Ledger */}
                <div className="p-3.5 bg-[#EDE8DE]/40 rounded-xl border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-[#6F6D69]">
                    <span>Treatment Charges:</span>
                    <span className="font-mono font-bold text-[#252525]">₹{treatmentServicesTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#6F6D69]">
                    <span>Consultation Charge:</span>
                    <span className="font-mono font-bold text-[#252525]">₹{consultationCharge.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#252525] pt-1.5 border-t border-stone-200/60">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between font-bold text-[#3B4D3A]">
                      <span>- Discount:</span>
                      <span className="font-mono">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t-2 border-[#252525]">
                    <span className="text-xs font-black uppercase text-[#252525]">Final Amount:</span>
                    <span className="text-lg font-black text-[#252525] font-mono">
                      ₹{finalPayableAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION D: PAYMENT & PRIMARY SUBMIT */}
              <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-200/60">
                  <span className="w-6 h-6 rounded-lg bg-[#EDE8DE] text-[#252525] flex items-center justify-center text-xs font-black">
                    D
                  </span>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#252525]">
                    Payment Details
                  </h2>
                </div>

                {/* Payment Method Radio/Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6F6D69] mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'Cash', 'Card'] as BillingPaymentMethod[]).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-3 text-xs font-extrabold rounded-xl border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-[#252525] text-[#C8B58D] border-[#252525] shadow-xs'
                            : 'bg-[#F7F5F1] text-[#6F6D69] border-stone-200 hover:bg-stone-200/60'
                        }`}
                      >
                        {method === 'UPI' && <Smartphone className="w-4 h-4" />}
                        {method === 'Cash' && <Banknote className="w-4 h-4" />}
                        {method === 'Card' && <CreditCard className="w-4 h-4" />}
                        <span>{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Status Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6F6D69] mb-1.5">
                    Payment Status *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Paid', 'Pending', 'Failed'] as BillingPaymentStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setPaymentStatus(status)}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition text-center cursor-pointer ${
                          paymentStatus === status
                            ? status === 'Paid'
                              ? 'bg-[#8FA88D]/20 text-[#3B4D3A] border-[#8FA88D] font-extrabold'
                              : status === 'Pending'
                              ? 'bg-[#C5A66A]/20 text-[#594723] border-[#C5A66A] font-extrabold'
                              : 'bg-[#8F3B34]/20 text-[#8F3B34] border-[#8F3B34] font-extrabold'
                            : 'bg-white text-[#6F6D69] border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || discountAmount > subtotal}
                    className="w-full py-3 px-4 bg-[#252525] hover:bg-black text-[#C8B58D] font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#C8B58D]" />
                        <span>Recording Payment &amp; Generating Receipt...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#C8B58D]" />
                        <span>Record Payment &amp; Generate Receipt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* VIEW B: BILLING HISTORY & TRANSACTIONS TABLE */}
      {/* ------------------------------------------------------------------- */}
      {activeSubTab === 'history' && (
        <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#6F6D69] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={historySearchPatient}
                onChange={e => setHistorySearchPatient(e.target.value)}
                placeholder="Search patient name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F5F1] border border-stone-200 rounded-xl focus:outline-none focus:border-[#C8B58D] text-[#252525]"
              />
            </div>

            <div className="relative">
              <FileText className="w-4 h-4 text-[#6F6D69] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={historySearchInvoice}
                onChange={e => setHistorySearchInvoice(e.target.value)}
                placeholder="Search invoice # (e.g. OX-INV)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F5F1] border border-stone-200 rounded-xl focus:outline-none focus:border-[#C8B58D] text-[#252525]"
              />
            </div>

            <div className="relative">
              <input
                type="date"
                value={historySearchDate}
                onChange={e => setHistorySearchDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F5F1] border border-stone-200 rounded-xl focus:outline-none focus:border-[#C8B58D] text-[#252525]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border border-stone-200/80 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F1] text-[#6F6D69] font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
                <tr>
                  <th className="py-3 px-3.5">Invoice Number</th>
                  <th className="py-3 px-3.5">Patient</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Amount</th>
                  <th className="py-3 px-3.5">Payment Method</th>
                  <th className="py-3 px-3.5">Payment Status</th>
                  <th className="py-3 px-3.5">Receipt</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {filteredHistoryInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#6F6D69] text-xs">
                      No invoices found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHistoryInvoices.map(inv => {
                    const isPaid = inv.status === 'paid';
                    const isFailed = inv.status === 'failed';
                    return (
                      <tr key={inv.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-extrabold text-[#252525] bg-[#EDE8DE] px-2 py-0.5 rounded border border-[#C8B58D]/30">
                            {inv.invoiceNumber}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="font-bold text-[#252525] block">{inv.patientName}</span>
                          <span className="text-[10px] text-[#6F6D69]">{inv.patientCode || 'OX-PAT'}</span>
                        </td>

                        <td className="py-3 px-3.5 text-[#6F6D69]">{inv.date}</td>

                        <td className="py-3 px-3.5 font-mono font-black text-[#252525]">
                          ₹{(inv.total || inv.totalAmount || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-3.5 font-semibold text-[#252525]">
                          {inv.paymentMethod || 'UPI'}
                        </td>

                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isPaid
                                ? 'bg-[#8FA88D]/20 text-[#3B4D3A] border border-[#8FA88D]/40'
                                : isFailed
                                ? 'bg-[#8F3B34]/20 text-[#8F3B34] border border-[#8F3B34]/40'
                                : 'bg-[#C5A66A]/20 text-[#594723] border border-[#C5A66A]/40'
                            }`}
                          >
                            {inv.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          {inv.emailSent ? (
                            <span className="text-[10px] font-bold text-[#3B4D3A] flex items-center gap-1">
                              <span>📧 Sent</span>
                            </span>
                          ) : inv.emailError ? (
                            <span className="text-[10px] font-bold text-[#8F3B34] flex items-center gap-1">
                              <span>✗ Failed</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#6F6D69]">&bull; Not Emailed</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReceiptInvoice(inv);
                                setIsReceiptModalOpen(true);
                              }}
                              title="View Digital Receipt"
                              className="p-1.5 text-[#252525] hover:bg-[#EDE8DE] rounded-lg transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadReceiptPdf(inv)}
                              title="Download Receipt PDF"
                              className="p-1.5 text-[#252525] hover:bg-[#EDE8DE] rounded-lg transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#C8B58D]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResendReceiptEmail(inv)}
                              title="Resend Receipt Email"
                              className="p-1.5 text-[#252525] hover:bg-[#EDE8DE] rounded-lg transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. DIGITAL RECEIPT MODAL (ORALIX BRANDING) */}
      {/* ------------------------------------------------------------------- */}
      {isReceiptModalOpen && activeReceiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252525]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-stone-200/80 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 text-[#252525] relative">
            
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#C8B58D]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#6F6D69]">
                  Oralix Digital Receipt
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setActiveReceiptInvoice(null);
                }}
                className="w-8 h-8 rounded-xl text-[#6F6D69] hover:text-[#252525] hover:bg-[#EDE8DE] flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Preview Canvas */}
            <div id="oralix-digital-receipt" className="border-2 border-stone-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
              
              {/* Receipt Header Banner */}
              <div className="bg-[#252525] p-5 text-white flex items-center justify-between border-b-2 border-[#C8B58D]">
                <div>
                  <h1 className="text-xl font-black text-[#C8B58D] tracking-tight">ORALIX</h1>
                  <p className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Dental Clinic Management
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-[#3B4D3A] text-[#8FA88D] text-[10px] font-black uppercase tracking-wider border border-[#8FA88D]">
                    {activeReceiptInvoice.status === 'paid' ? '✓ Payment Paid' : activeReceiptInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-5 space-y-4">
                {/* Meta Details */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stone-100 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#6F6D69] block">
                      Patient Details
                    </span>
                    <span className="font-extrabold text-sm text-[#252525] block mt-0.5">
                      {activeReceiptInvoice.patientName}
                    </span>
                    <span className="text-[11px] text-[#6F6D69]">
                      ID: {activeReceiptInvoice.patientCode || 'OX-PAT'}
                    </span>
                    {activeReceiptInvoice.patientEmail && (
                      <span className="text-[11px] text-[#6F6D69] block">
                        {activeReceiptInvoice.patientEmail}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase text-[#6F6D69] block">
                      Invoice &amp; Receipt
                    </span>
                    <span className="font-mono font-extrabold text-[#252525] block mt-0.5">
                      {activeReceiptInvoice.invoiceNumber}
                    </span>
                    <span className="text-[11px] text-[#6F6D69] block">
                      Date: {activeReceiptInvoice.date}
                    </span>
                  </div>
                </div>

                {/* Treatment / Service Itemized Table */}
                <div className="border border-stone-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F5F1] text-[#6F6D69] font-extrabold uppercase text-[10px] border-b border-stone-200/80">
                      <tr>
                        <th className="py-2 px-3">Treatment / Service</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {activeReceiptInvoice.items && activeReceiptInvoice.items.length > 0 ? (
                        activeReceiptInvoice.items.map((it, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 text-[#252525] font-semibold">
                              {it.description}
                              {it.quantity > 1 && (
                                <span className="text-[10px] text-[#6F6D69] ml-1">
                                  (&times;{it.quantity})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#252525]">
                              ₹{it.total.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-2 px-3 text-[#252525] font-semibold">
                            {activeReceiptInvoice.description || 'Clinical Care Treatment'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#252525]">
                            ₹{(activeReceiptInvoice.totalAmount || activeReceiptInvoice.total || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}

                      {/* Consultation Fee if recorded */}
                      {activeReceiptInvoice.consultationFee && activeReceiptInvoice.consultationFee > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-[#252525] font-semibold">
                            Clinical Dental Consultation Charge
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#252525]">
                            ₹{activeReceiptInvoice.consultationFee.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal, Discount & Total Amount */}
                <div className="pt-2 border-t border-stone-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#6F6D69]">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-[#252525]">
                      ₹{(activeReceiptInvoice.subtotal || activeReceiptInvoice.totalAmount || activeReceiptInvoice.total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {(activeReceiptInvoice.discount || 0) > 0 && (
                    <div className="flex justify-between text-[#3B4D3A] font-bold">
                      <span>Discount Applied:</span>
                      <span className="font-mono">- ₹{activeReceiptInvoice.discount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-stone-200/80">
                    <span className="text-xs font-black uppercase text-[#252525]">Total Amount:</span>
                    <span className="text-xl font-black text-[#252525] font-mono">
                      ₹{(activeReceiptInvoice.total || activeReceiptInvoice.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Payment Method & Status Strip */}
                <div className="p-3 bg-[#F7F5F1] rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#6F6D69] uppercase font-bold block">Payment Method</span>
                    <span className="font-extrabold text-[#252525]">{activeReceiptInvoice.paymentMethod || 'UPI'}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#6F6D69] uppercase font-bold block">Payment Status</span>
                    <span className="font-extrabold text-[#3B4D3A] uppercase">
                      {activeReceiptInvoice.status === 'paid' ? '✓ Payment Paid' : activeReceiptInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Email Delivery Status Indicator */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  {activeReceiptInvoice.emailSent ? (
                    <div className="flex items-center gap-1.5 text-[#3B4D3A] font-bold">
                      <span>📧 Receipt Sent</span>
                      <span className="text-[11px] font-normal text-[#6F6D69]">
                        (to {activeReceiptInvoice.patientEmail})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[#8F3B34] font-semibold text-xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Receipt email could not be sent.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleResendReceiptEmail(activeReceiptInvoice)}
                    disabled={isResendingEmail}
                    className="px-3 py-1 text-xs font-extrabold bg-[#EDE8DE] hover:bg-[#C8B58D]/30 text-[#252525] rounded-lg transition cursor-pointer flex items-center gap-1 border border-[#C8B58D]/30 disabled:opacity-50"
                  >
                    {isResendingEmail ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3 text-[#C8B58D]" />
                    )}
                    <span>Resend Receipt</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80">
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setActiveReceiptInvoice(null);
                  handleResetBillingForm();
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#252525] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Create Another Bill
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-white border border-stone-200 text-[#252525] hover:bg-stone-50 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadReceiptPdf(activeReceiptInvoice)}
                  className="px-4 py-2 bg-[#252525] hover:bg-black text-[#C8B58D] rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#C8B58D]" />
                  <span>Download Receipt PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
