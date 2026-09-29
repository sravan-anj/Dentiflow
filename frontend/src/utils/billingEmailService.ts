/**
 * Oralix Dental Practice Management - Billing Digital Receipt Email Service
 * 
 * ============================================================================
 * EMAIL / RESEND INTEGRATION NOTES & CONFIGURATION
 * ============================================================================
 * The backend server (server.ts) integrates natively with the Resend SDK
 * using the official RESEND_API_KEY defined in the root .env file.
 * 
 * Required Environment Variables in .env:
 * - RESEND_API_KEY: Resend API key (e.g. re_xxxxxxx from https://resend.com/api-keys)
 * - EMAIL_FROM / MAIL_FROM: Sender identity (e.g. "Oralix <noreply@oralix.online>")
 * 
 * TODO for Production Deployment:
 * 1. Verify your custom domain (oralix.online) in your Resend Dashboard (DKIM/SPF).
 * 2. In local test environments without active DNS, Resend allows sending to the
 *    account owner's email, or falls back gracefully to local audit logging.
 */

export interface ReceiptItemPayload {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SendReceiptPayload {
  invoiceNumber: string;
  patientName: string;
  patientEmail: string;
  date: string;
  items: ReceiptItemPayload[];
  consultationFee?: number;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  paymentStatus: string;
}

export interface SendReceiptResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const BillingEmailService = {
  /**
   * Dispatches digital receipt to patient's registered email address.
   */
  sendReceipt: async (payload: SendReceiptPayload): Promise<SendReceiptResponse> => {
    if (!payload.patientEmail || !payload.patientEmail.includes('@')) {
      return {
        success: false,
        error: 'Invalid or missing patient email address.'
      };
    }

    try {
      const response = await fetch('/api/billing/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Receipt email could not be sent.'
        };
      }

      return {
        success: true,
        message: data.message || `Receipt email sent to ${payload.patientEmail}`
      };
    } catch (err: any) {
      console.warn('[BillingEmailService] API dispatch error:', err);
      return {
        success: false,
        error: err?.message || 'Receipt email could not be sent. Network or server error.'
      };
    }
  }
};
