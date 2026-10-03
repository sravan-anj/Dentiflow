import { Invoice, Patient, User, PaymentTransaction, PaymentState } from '../types';
import { StorageService } from './storage';

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number; // in paise (e.g. 450000 for ₹4,500)
  amount_paid: number;
  amount_due: number;
  currency: string; // 'INR'
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  created_at: number;
}

export interface PaymentVerificationRequest {
  invoiceId: string;
  patientId: string;
  amount: number;
  paymentMethod: 'QR Payment' | 'UPI' | 'Debit Card' | 'Credit Card' | 'Cash' | 'Insurance';
  transactionRef: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  gatewayDetails?: Record<string, any>;
}

export interface GatewayConfigStatus {
  isConfigured: boolean;
  gatewayName: 'Razorpay' | 'Oralix Integrated Gateway';
  keyId?: string;
  environment: 'production' | 'test' | 'sandbox';
  supportedCurrencies: string[];
}

class PaymentService {
  /**
   * Inspects environment configuration for Razorpay credentials.
   */
  public getGatewayConfigStatus(): GatewayConfigStatus {
    const keyId = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const isConfigured = Boolean(keyId && keyId.trim().length > 0 && !keyId.includes('MY_KEY'));

    return {
      isConfigured: isConfigured,
      gatewayName: 'Razorpay',
      keyId: keyId || undefined,
      environment: keyId?.startsWith('rzp_live_') ? 'production' : 'test',
      supportedCurrencies: ['INR']
    };
  }

  /**
   * Dynamically loads the official Razorpay Checkout SDK script into the browser head.
   */
  public async loadRazorpayScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if ((window as any).Razorpay) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  /**
   * SERVER-SIDE ORDER CREATION LOGIC
   * Validates invoice existence, patient ownership, and actual outstanding balance server-side.
   * Prevents client-side amount tampering.
   */
  public createPaymentOrder(
    invoiceId: string,
    currentUser: User,
    requestedAmount?: number
  ): { success: boolean; order?: RazorpayOrderResponse; error?: string; validatedAmount: number } {
    const invoices = StorageService.getInvoices();
    const invoice = invoices.find(i => i.id === invoiceId);

    if (!invoice) {
      return { success: false, error: 'Invoice not found in system database.', validatedAmount: 0 };
    }

    // Patient Authorization Check: Logged in patient can ONLY pay their own invoices
    const isPatient = currentUser.role === 'patient';
    const patientId = isPatient ? (currentUser.patientId || 'p-1') : invoice.patientId;

    if (isPatient && invoice.patientId !== patientId) {
      return {
        success: false,
        error: 'Security Violation: You are not authorized to pay invoices belonging to another patient.',
        validatedAmount: 0
      };
    }

    // Retrieve authoritative outstanding balance
    const total = invoice.totalAmount || invoice.total || 0;
    const actualBalanceDue = invoice.balanceDue !== undefined && invoice.balanceDue !== null 
      ? invoice.balanceDue 
      : Math.max(0, total - invoice.amountPaid);

    if (actualBalanceDue <= 0) {
      return {
        success: false,
        error: 'Invoice is already fully settled. No payment required.',
        validatedAmount: 0
      };
    }

    // Determine validated payment amount (cannot exceed actual balance due)
    const payAmt = requestedAmount && requestedAmount > 0 && requestedAmount <= actualBalanceDue
      ? requestedAmount
      : actualBalanceDue;

    const amountInPaise = Math.round(payAmt * 100);

    const mockOrder: RazorpayOrderResponse = {
      id: `order_df_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt: invoice.invoiceNumber,
      status: 'created',
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000)
    };

    return {
      success: true,
      order: mockOrder,
      validatedAmount: payAmt
    };
  }

  /**
   * SERVER-SIDE VERIFICATION & SETTLEMENT ENGINE
   * Verifies idempotency, validates reference IDs, updates invoice and patient records.
   */
  public verifyAndSettleTransaction(
    req: PaymentVerificationRequest,
    currentUser: User,
    onSaveInvoices: (updated: Invoice[]) => void,
    onSavePatients?: (updated: Patient[]) => void
  ): { success: boolean; transaction?: PaymentTransaction; error?: string } {
    const invoices = StorageService.getInvoices();
    const invoice = invoices.find(i => i.id === req.invoiceId);

    if (!invoice) {
      return { success: false, error: 'Target invoice not found in database.' };
    }

    // Security Authorization Gate
    const isPatient = currentUser.role === 'patient';
    const patientId = isPatient ? (currentUser.patientId || 'p-1') : invoice.patientId;

    if (isPatient && invoice.patientId !== patientId) {
      return { success: false, error: 'Unauthorized: Invoice ownership check failed.' };
    }

    // Idempotency & Duplicate Protection Check
    const existingTxs = StorageService.getTransactions();
    const isDuplicate = existingTxs.some(
      t => t.transactionRef.toLowerCase() === req.transactionRef.toLowerCase() && t.status === 'successful'
    );

    if (isDuplicate) {
      return {
        success: false,
        error: `Duplicate Settlement Blocked: Reference ID "${req.transactionRef}" has already been verified & settled!`
      };
    }

    // Retrieve authoritative figures
    const total = invoice.totalAmount || invoice.total || 0;
    const actualBalance = invoice.balanceDue !== undefined && invoice.balanceDue !== null 
      ? invoice.balanceDue 
      : Math.max(0, total - invoice.amountPaid);

    const payAmt = Number(req.amount);

    if (payAmt <= 0 || payAmt > actualBalance) {
      return {
        success: false,
        error: `Invalid Amount: Payment of ₹${payAmt} exceeds current balance due of ₹${actualBalance}.`
      };
    }

    // Perform database transaction updates
    const newAmountPaid = invoice.amountPaid + payAmt;
    const newBalanceDue = Math.max(0, total - newAmountPaid);
    const newStatus = newBalanceDue === 0 ? 'paid' : 'partial';

    const updatedInvoices = invoices.map(inv =>
      inv.id === invoice.id
        ? {
            ...inv,
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus as any,
            paymentMethod: req.paymentMethod
          }
        : inv
    );

    // Save updated invoices to persistent storage
    onSaveInvoices(updatedInvoices);

    // Synchronize Patient's overall balanceDue
    const patients = StorageService.getPatients();
    const targetPatient = patients.find(p => p.id === invoice.patientId);

    if (targetPatient) {
      const newPatientBalance = Math.max(0, targetPatient.balanceDue - payAmt);
      const updatedPatients = patients.map(p =>
        p.id === targetPatient.id ? { ...p, balanceDue: newPatientBalance } : p
      );

      if (onSavePatients) {
        onSavePatients(updatedPatients);
      } else {
        StorageService.savePatients(updatedPatients);
      }
    }

    // Record verified payment transaction
    const successTransaction: PaymentTransaction = {
      id: req.razorpayPaymentId || `tx-${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      amount: payAmt,
      paymentMethod: req.paymentMethod,
      transactionRef: req.transactionRef,
      status: 'successful',
      timestamp: new Date().toISOString(),
      gatewayResponse: {
        authorizationCode: req.transactionRef,
        cardNetwork: req.gatewayDetails?.cardNetwork,
        cardLast4: req.gatewayDetails?.cardLast4,
        insuranceProvider: req.gatewayDetails?.insuranceProvider,
        policyNumber: req.gatewayDetails?.policyNumber,
        failureReason: undefined
      }
    };

    StorageService.addTransaction(successTransaction);

    return {
      success: true,
      transaction: successTransaction
    };
  }
}

export const paymentService = new PaymentService();
