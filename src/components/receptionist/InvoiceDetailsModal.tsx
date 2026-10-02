import React from 'react';
import { Invoice, Patient } from '../../types';
import { X, Printer, Download, User, Calendar, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { downloadTaxInvoicePdfBlob } from '../../utils/pdfGenerator';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  patient?: Patient;
  onClose: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoice,
  patient,
  onClose,
  onRecordPayment
}) => {
  const effectivePatient: Patient = patient || {
    id: invoice.patientId,
    code: invoice.patientCode || 'PAT-001',
    name: invoice.patientName,
    age: invoice.patientAge || 30,
    gender: invoice.patientGender || 'Male',
    phone: '+91 98765 43210',
    email: `${invoice.patientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    balanceDue: invoice.balanceDue,
    medicalAlerts: []
  };

  const handlePrint = () => {
    downloadTaxInvoicePdfBlob(invoice, effectivePatient);
  };

  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [
        {
          id: 'item-1',
          description: invoice.description || 'Comprehensive Dental Care & Operatory Procedure',
          quantity: 1,
          unitPrice: invoice.totalAmount || invoice.total || 0,
          total: invoice.totalAmount || invoice.total || 0
        }
      ];

  const totalFee = Number(invoice.totalAmount || invoice.total || 0);
  const paidAmt = Number(invoice.amountPaid || 0);
  const balance = Number(invoice.balanceDue || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-[#C8B58D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1E1E1E]">Invoice Details</h3>
                <span className="font-mono text-xs font-bold text-[#1E1E1E] px-2 py-0.5 rounded bg-stone-100 border border-stone-200">
                  {invoice.invoiceNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : invoice.status === 'partial'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Issued on {invoice.date || 'Today'} &bull; Attending: {invoice.attendingDoctor || 'Primary Dental Practitioner'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#1E1E1E]">
          {/* Patient Card Banner */}
          <div className="p-4 bg-white rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EDE8DE] text-[#252525] flex items-center justify-center font-bold text-xs shrink-0">
                {effectivePatient.name.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Patient</span>
                <h4 className="text-sm font-bold text-[#1E1E1E]">{effectivePatient.name}</h4>
                <p className="text-[11px] text-stone-500">
                  {effectivePatient.age} yrs &bull; {effectivePatient.gender} &bull; Code: {effectivePatient.code}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Balance Due</span>
              <p className={`text-base font-extrabold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                INR ₹{balance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Itemized Procedures Table */}
          <div className="bg-white rounded-xl border border-[#E5E0D8] overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-stone-50/75 border-b border-[#E5E0D8] font-bold text-[11px] text-stone-500 uppercase tracking-wider">
              Itemized Clinical Procedures
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 text-stone-500 bg-stone-50/40 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Tooth</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Fee (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-stone-50/50">
                    <td className="py-2.5 px-4 text-stone-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#1E1E1E]">{item.description}</td>
                    <td className="py-2.5 px-4 text-stone-500">{item.tooth ? `#${item.tooth}` : '-'}</td>
                    <td className="py-2.5 px-4 text-center text-stone-600">{item.quantity || 1}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-[#1E1E1E]">
                      ₹{(item.total || item.unitPrice || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="p-4 bg-stone-50/50 border-t border-[#E5E0D8] space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal Fee</span>
                <span className="font-semibold">₹{totalFee.toLocaleString('en-IN')}</span>
              </div>
              {invoice.discount ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Applied Discount</span>
                  <span className="font-semibold">- ₹{Number(invoice.discount).toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-stone-600">
                <span>Amount Paid</span>
                <span className="font-semibold text-emerald-600">₹{paidAmt.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1E1E1E] pt-2 border-t border-stone-200">
                <span>Balance Due</span>
                <span className={balance > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  INR ₹{balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E5E0D8] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#252525] bg-[#EDE8DE] hover:bg-[#E3DCce] border border-[#C8B58D]/40 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#C8B58D]" />
              <span>Download / Print PDF</span>
            </button>

            {balance > 0 && onRecordPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1A1A1A] hover:bg-[#2B2823] rounded-xl transition shadow-sm cursor-pointer"
              >
                <span>Collect Payment</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
