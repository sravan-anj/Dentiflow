import React, { useState } from 'react';
import { Invoice, Patient } from '../../types';
import { X, CreditCard, QrCode, Banknote, Landmark, Wallet, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReceptionistPaymentModalProps {
  invoice: Invoice;
  patient?: Patient;
  onClose: () => void;
  onCompletePayment: (invoiceId: string, amount: number, method: string) => void;
}

export const ReceptionistPaymentModal: React.FC<ReceptionistPaymentModalProps> = ({
  invoice,
  patient,
  onClose,
  onCompletePayment
}) => {
  const balance = Number(invoice.balanceDue || 0);
  const [payAmount, setPayAmount] = useState<number>(balance);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Net Banking'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      onCompletePayment(invoice.id, payAmount, paymentMethod);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 bg-white border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4 text-[#C8B58D]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1E1E]">Record Patient Checkout</h3>
              <p className="text-[11px] text-stone-500">Invoice: {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-white border border-[#E5E0D8] rounded-xl flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Patient</span>
              <p className="text-xs font-bold text-[#1E1E1E]">{invoice.patientName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Outstanding</span>
              <p className="text-sm font-black text-amber-600">INR ₹{balance.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Settlement Amount (INR ₹)
            </label>
            <input
              type="number"
              min="1"
              max={balance}
              value={payAmount}
              onChange={e => setPayAmount(Number(e.target.value))}
              className="block w-full px-3.5 py-2.5 text-sm font-bold bg-white border border-[#E5E0D8] rounded-xl text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#C8B58D]/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                { id: 'Cash', label: 'Cash Desk', icon: Banknote },
                { id: 'Card', label: 'Card POS', icon: CreditCard },
                { id: 'Net Banking', label: 'Net Banking', icon: Landmark }
              ].map(m => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                        : 'bg-white text-stone-700 border-[#E5E0D8] hover:bg-stone-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C8B58D]' : 'text-stone-400'}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing || payAmount <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-[#1A1A1A] hover:bg-[#2B2823] active:scale-[0.99] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Recording Payment...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#C8B58D]" />
                  <span>Confirm Settlement (₹{payAmount.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
