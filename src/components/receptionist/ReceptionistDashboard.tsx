import React, { useState, useMemo } from 'react';
import { Invoice, Patient } from '../../types';
import {
  Building,
  Search,
  Printer,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowLeft,
  LogOut,
  Sparkles,
  Download,
  CreditCard,
  X,
  Filter,
  Receipt,
  User,
  ShieldCheck
} from 'lucide-react';
import { downloadTaxInvoicePdfBlob } from '../../utils/pdfGenerator';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { ReceptionistPaymentModal } from './ReceptionistPaymentModal';
import { useToast } from '../common/Toast';

interface ReceptionistDashboardProps {
  invoices: Invoice[];
  patients: Patient[];
  onSaveInvoices: (invoices: Invoice[]) => void;
  onSavePatients?: (patients: Patient[]) => void;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = ({
  invoices,
  patients,
  onSaveInvoices,
  onSavePatients,
  onLogout,
  onNavigateHome
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'outstanding'>('all');
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  // Financial KPIs
  const kpis = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;

    invoices.forEach(inv => {
      const fee = Number(inv.totalAmount || inv.total || 0);
      const paid = Number(inv.amountPaid || 0);
      const balance = Number(inv.balanceDue !== undefined ? inv.balanceDue : fee - paid);
      totalBilled += fee;
      totalPaid += paid;
      totalDue += balance;
    });

    return {
      totalBilled,
      totalPaid,
      totalDue,
      count: invoices.length
    };
  }, [invoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Status filter
      if (statusFilter === 'paid' && inv.status !== 'paid') return false;
      if (statusFilter === 'outstanding' && inv.status === 'paid') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (inv.invoiceNumber || '').toLowerCase();
        const pt = (inv.patientName || '').toLowerCase();
        const desc = (inv.description || '').toLowerCase();
        return num.includes(q) || pt.includes(q) || desc.includes(q);
      }

      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  const handlePrintInvoice = (inv: Invoice) => {
    const pt = patients.find(p => p.id === inv.patientId || p.name.toLowerCase() === inv.patientName.toLowerCase());
    downloadTaxInvoicePdfBlob(inv, pt);
    showToast(`Tax Invoice PDF downloaded for ${inv.patientName} (${inv.invoiceNumber})`, 'success');
  };

  const handleCompletePayment = (invoiceId: string, amount: number, method: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const total = Number(inv.totalAmount || inv.total || 0);
    const newPaid = Number(inv.amountPaid || 0) + amount;
    const newBalance = Math.max(0, total - newPaid);
    const newStatus = newBalance === 0 ? 'paid' : 'partial';

    const updatedInvoice: Invoice = {
      ...inv,
      amountPaid: newPaid,
      balanceDue: newBalance,
      status: newStatus,
      paymentMethod: method as any
    };

    const updatedInvoices = invoices.map(i => (i.id === invoiceId ? updatedInvoice : i));
    onSaveInvoices(updatedInvoices);

    // Update patient balance
    const pt = patients.find(p => p.id === inv.patientId);
    if (pt && onSavePatients) {
      const updatedPatients = patients.map(p =>
        p.id === pt.id ? { ...p, balanceDue: Math.max(0, (p.balanceDue || 0) - amount) } : p
      );
      onSavePatients(updatedPatients);
    }

    showToast(`Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${inv.patientName} via ${method}.`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E1E1E] font-sans selection:bg-[#C8B58D]/30 flex flex-col">
      {/* Top Clinical Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E5E0D8] sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center shadow-xs">
              <Building className="w-5 h-5 text-[#C8B58D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1E1E1E]">
                  Oralix Receptionist Desk
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8FA88D]/15 text-[#3B4D3A] border border-[#8FA88D]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Clinic Front Desk Billing &bull; Real-time Itemized Receipt Ledger
              </p>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-[#EDE8DE] rounded-xl border border-stone-200 transition cursor-pointer"
              title="Return to Main Doctor / Admin Workstation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#C8B58D]" />
              <span className="hidden md:inline">Main Clinic</span>
            </button>

            {/* Receptionist Profile Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-xs">
              <div className="w-6 h-6 rounded-full bg-[#1A1A1A] text-[#C8B58D] flex items-center justify-center font-bold text-[10px]">
                RD
              </div>
              <div className="text-left leading-tight">
                <span className="font-bold text-[#1E1E1E] block text-[11px]">Desk Receptionist</span>
                <span className="text-[10px] text-stone-500 font-mono">receptionist@oralix.com</span>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
              title="Sign Out of Receptionist Desk"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Financial KPIs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Total Billed</span>
            <p className="text-2xl font-black text-[#1E1E1E] mt-1.5">
              INR ₹{kpis.totalBilled.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-semibold text-stone-500 mt-2 block">
              Across all clinic procedures
            </span>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Collected Revenue</span>
            <p className="text-2xl font-black text-emerald-600 mt-1.5">
              INR ₹{kpis.totalPaid.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-semibold text-emerald-700 mt-2 block">
              Settled payments
            </span>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Balance Due</span>
            <p className="text-2xl font-black text-amber-600 mt-1.5">
              INR ₹{kpis.totalDue.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-semibold text-amber-700 mt-2 block">
              Pending front desk collection
            </span>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Invoices Managed</span>
            <p className="text-2xl font-black text-[#1E1E1E] mt-1.5">
              {kpis.count}
            </p>
            <span className="text-[10px] font-semibold text-stone-500 mt-2 block">
              Live synchronized bills
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Invoice #, Patient Name, or Treatment..."
                className="w-full text-xs pl-10 pr-9 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-[#E5E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8B58D]/30 text-[#1E1E1E] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="inline-flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#1E1E1E] shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Bills ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('outstanding')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'outstanding'
                    ? 'bg-white text-amber-800 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-amber-800'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Outstanding</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'paid'
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Paid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Receptionist Invoices Table Card */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E0D8] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1E1E1E]">Clinic Invoice Ledger</h2>
              <p className="text-xs text-stone-500">Showing {filteredInvoices.length} of {invoices.length} generated bills</p>
            </div>
            <span className="text-[11px] font-semibold text-stone-500">
              Reception Checkout Desk
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Invoice #</th>
                  <th className="py-3.5 px-4 font-bold">Patient Name</th>
                  <th className="py-3.5 px-4 font-bold">Description / Treatment</th>
                  <th className="py-3.5 px-4 font-bold text-right">Total Fee</th>
                  <th className="py-3.5 px-4 font-bold text-right">Paid Amount</th>
                  <th className="py-3.5 px-4 font-bold text-right">Balance Due</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]/60">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 px-4 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-[#EDE8DE] flex items-center justify-center mb-3">
                          <Receipt className="w-6 h-6 text-stone-400" />
                        </div>
                        <h3 className="text-sm font-bold text-[#1E1E1E]">No Invoices Found</h3>
                        <p className="text-xs text-stone-500 mt-1">
                          No clinic bills match your search criteria. Invoices created by doctors automatically appear here in real time.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => {
                    const total = Number(inv.totalAmount || inv.total || 0);
                    const paid = Number(inv.amountPaid || 0);
                    const balance = Number(inv.balanceDue !== undefined ? inv.balanceDue : total - paid);
                    const isPaid = inv.status === 'paid' || balance === 0;

                    return (
                      <tr key={inv.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        {/* 1. Invoice # */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#1E1E1E] text-xs">
                              {inv.invoiceNumber}
                            </span>
                            {inv.date && (
                              <span className="text-[10px] text-stone-400 block font-normal">
                                {inv.date}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Patient Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#EDE8DE] text-[#252525] flex items-center justify-center font-bold text-[10px] shrink-0">
                              {inv.patientName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-[#1E1E1E] block">
                                {inv.patientName}
                              </span>
                              {inv.patientCode && (
                                <span className="text-[10px] text-stone-400">
                                  {inv.patientCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Description / Treatment */}
                        <td className="py-3.5 px-4 max-w-xs truncate text-stone-600">
                          {inv.description || (inv.items && inv.items[0]?.description) || 'General Operatory Dental Procedure'}
                        </td>

                        {/* 4. Total Fee */}
                        <td className="py-3.5 px-4 text-right font-bold text-[#1E1E1E]">
                          ₹{total.toLocaleString('en-IN')}
                        </td>

                        {/* 5. Paid Amount */}
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                          ₹{paid.toLocaleString('en-IN')}
                        </td>

                        {/* 6. Balance Due */}
                        <td className="py-3.5 px-4 text-right font-bold">
                          <span className={balance > 0 ? 'text-amber-600 font-extrabold' : 'text-stone-400'}>
                            ₹{balance.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* 7. Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : inv.status === 'partial'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isPaid ? 'PAID' : inv.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>

                        {/* 8. Actions (Print, View Details, Record Payment) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Collect Payment (if balance due) */}
                            {balance > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceForPayment(inv)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#1A1A1A] hover:bg-[#2B2823] rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Record Payment / Checkout"
                              >
                                <CreditCard className="w-3 h-3 text-[#C8B58D]" />
                                <span>Collect</span>
                              </button>
                            )}

                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForDetails(inv)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-[#EDE8DE] rounded-lg border border-stone-200 transition cursor-pointer flex items-center gap-1"
                              title="View Invoice Details"
                            >
                              <FileText className="w-3 h-3 text-[#C8B58D]" />
                              <span>Details</span>
                            </button>

                            {/* Print */}
                            <button
                              type="button"
                              onClick={() => handlePrintInvoice(inv)}
                              className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-[#EDE8DE] rounded-lg border border-stone-200 transition cursor-pointer"
                              title="Download & Print PDF"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#1E1E1E]" />
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
      </main>

      {/* Invoice Details Modal */}
      {selectedInvoiceForDetails && (
        <InvoiceDetailsModal
          invoice={selectedInvoiceForDetails}
          patient={patients.find(p => p.id === selectedInvoiceForDetails.patientId)}
          onClose={() => setSelectedInvoiceForDetails(null)}
          onRecordPayment={inv => {
            setSelectedInvoiceForPayment(inv);
          }}
        />
      )}

      {/* Front Desk Payment Modal */}
      {selectedInvoiceForPayment && (
        <ReceptionistPaymentModal
          invoice={selectedInvoiceForPayment}
          patient={patients.find(p => p.id === selectedInvoiceForPayment.patientId)}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onCompletePayment={handleCompletePayment}
        />
      )}
    </div>
  );
};
