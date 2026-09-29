/**
 * src/server/routes/billingRouter.ts — Oralix Billing, Payments & Collections Router
 */

import { Router, Response } from 'express';
import {
  OralixDb,
  InvoiceRecord,
  PaymentRecord,
  ReceiptRecord,
  SupportedPaymentMethod,
  AuthenticatedRequest,
} from '../db.ts';

const router = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

/**
 * GET /api/billing/invoices
 * Search & filter invoices
 */
router.get('/invoices', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const allInvoices = OralixDb.getInvoices(clinicId);

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    const pid = ownPatient?.id || user.patientId || user.id;
    const own = allInvoices.filter(i => i.patientId === pid);
    res.json({ success: true, count: own.length, invoices: own });
    return;
  }

  // Staff/Admin filters
  const { patientName, invoiceNumber, date, status, paymentMethod } = req.query;
  let filtered = allInvoices;

  if (patientName) {
    const q = String(patientName).toLowerCase();
    filtered = filtered.filter(i => i.patientName.toLowerCase().includes(q));
  }
  if (invoiceNumber) {
    const q = String(invoiceNumber).toLowerCase();
    filtered = filtered.filter(i => i.invoiceNumber.toLowerCase().includes(q));
  }
  if (date) {
    filtered = filtered.filter(i => i.date === String(date));
  }
  if (status) {
    filtered = filtered.filter(i => i.status.toUpperCase() === String(status).toUpperCase());
  }
  if (paymentMethod) {
    const payments = OralixDb.getPayments(clinicId);
    const invIdsWithMethod = new Set(
      payments.filter(p => p.paymentMethod.toLowerCase() === String(paymentMethod).toLowerCase()).map(p => p.invoiceId)
    );
    filtered = filtered.filter(i => invIdsWithMethod.has(i.id));
  }

  res.json({ success: true, count: filtered.length, invoices: filtered });
});

/**
 * GET /api/billing/invoices/:id
 */
router.get('/invoices/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const invoice = OralixDb.findInvoiceById(req.params.id, clinicId);

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found.' });
    return;
  }

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    const pid = ownPatient?.id || user.patientId || user.id;
    if (invoice.patientId !== pid) {
      res.status(403).json({ error: 'Access denied: You can only view your own invoices.' });
      return;
    }
  }

  res.json({ success: true, invoice });
});

/**
 * POST /api/billing/invoices
 * Create invoice with backend recalculation of totals & discount constraints
 */
router.post('/invoices', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'receptionist' && user.role !== 'admin' && user.role !== 'doctor') {
    res.status(403).json({ error: 'Access denied: Only clinic staff can generate invoices.' });
    return;
  }

  const clinicId = 'clinic-ox-main';
  const { patientId, items, consultationFee, discount, notes, date, dueDate } = req.body;

  if (!patientId) {
    res.status(400).json({ error: 'Patient ID is required.' });
    return;
  }

  const patient = OralixDb.findPatientById(patientId, clinicId);
  if (!patient) {
    res.status(404).json({ error: 'Target patient not found in clinic records.' });
    return;
  }

  // Validate line items
  const validItems = Array.isArray(items) && items.length > 0 ? items : [
    { id: `item-1`, description: 'Comprehensive Dental Consultation & Checkup', quantity: 1, unitPrice: 500, total: 500 }
  ];

  let itemsSubtotal = 0;
  const processedItems = validItems.map((item: any, idx: number) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const itemTotal = qty * price;
    itemsSubtotal += itemTotal;
    return {
      id: item.id || `item-${Date.now()}-${idx}`,
      description: String(item.description || 'Dental Procedure').trim(),
      code: item.code ? String(item.code).trim() : undefined,
      quantity: qty,
      unitPrice: price,
      total: itemTotal,
    };
  });

  const consultFee = Math.max(0, Number(consultationFee) || 0);
  const calculatedSubtotal = itemsSubtotal + consultFee;

  // Discount Constraints
  const disc = Number(discount) || 0;
  if (disc < 0) {
    res.status(400).json({ error: 'Discount cannot be negative.' });
    return;
  }
  if (disc > calculatedSubtotal) {
    res.status(400).json({
      error: `Discount (INR ${disc}) cannot exceed subtotal (INR ${calculatedSubtotal}).`,
    });
    return;
  }

  const clinic = OralixDb.getClinic();
  const taxPct = clinic.taxRatePct || 0;
  const taxableAmount = Math.max(0, calculatedSubtotal - disc);
  const tax = Math.round((taxableAmount * taxPct) / 100);
  const finalTotal = taxableAmount + tax;

  const allInvoices = OralixDb.getInvoices(clinicId);
  const invoiceNumber = `OX-INV-${new Date().getFullYear()}-${String(allInvoices.length + 1).padStart(4, '0')}`;

  const newInvoice: InvoiceRecord = {
    id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    invoiceNumber,
    clinicId,
    patientId: patient.id,
    patientName: patient.name,
    patientEmail: patient.email,
    patientPhone: patient.phone,
    date: date || new Date().toISOString().split('T')[0],
    dueDate: dueDate || date || new Date().toISOString().split('T')[0],
    createdBy: user.id,
    items: processedItems,
    consultationFee: consultFee,
    subtotal: calculatedSubtotal,
    discount: disc,
    tax,
    total: finalTotal,
    amountPaid: 0,
    balanceDue: finalTotal,
    status: 'UNPAID',
    notes: notes ? String(notes).trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = OralixDb.saveInvoice(newInvoice);

  // Synchronize patient's total balance due
  patient.balanceDue = (patient.balanceDue || 0) + finalTotal;
  OralixDb.savePatient(patient);

  OralixDb.addNotification({
    clinicId,
    type: 'payment',
    title: 'New Invoice Created',
    message: `Invoice ${invoiceNumber} for INR ₹${finalTotal.toLocaleString()} generated for ${patient.name}`,
    read: false,
    link: '/billing',
  });

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'INVOICE_CREATE',
    entityType: 'Invoice',
    entityId: saved.id,
    details: `Generated invoice ${invoiceNumber} with total INR ₹${finalTotal}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, invoice: saved });
});

/**
 * POST /api/billing/payments and POST /api/billing/invoices/:id/payments
 * Record payment atomically with idempotency key, receipts, and automatic email dispatch
 */
const recordPaymentHandler = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'receptionist' && user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Only front desk receptionists and administrators can record payments.' });
    return;
  }

  const clinicId = 'clinic-ox-main';
  const targetInvoiceId = req.params.id || req.body.invoiceId;
  const { amount, paymentMethod, transactionRef, idempotencyKey } = req.body;

  if (!targetInvoiceId) {
    res.status(400).json({ error: 'Invoice ID is required.' });
    return;
  }

  // Idempotency verification: prevent duplicate charging on double-click or network retry
  const cleanIdempKey = String(idempotencyKey || req.headers['x-idempotency-key'] || '').trim();
  if (cleanIdempKey) {
    const existingTx = OralixDb.findPaymentByIdempotencyKey(cleanIdempKey);
    if (existingTx) {
      const receipt = OralixDb.findReceiptByPaymentId(existingTx.id);
      res.json({
        success: true,
        idempotent: true,
        message: 'Payment already processed with this transaction token.',
        payment: existingTx,
        receipt,
      });
      return;
    }
  }

  const invoice = OralixDb.findInvoiceById(targetInvoiceId, clinicId);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found.' });
    return;
  }

  if (invoice.status === 'PAID' || invoice.balanceDue <= 0) {
    res.status(400).json({ error: 'Invoice is already fully settled. No further payment required.' });
    return;
  }

  const payAmt = Number(amount);
  if (isNaN(payAmt) || payAmt <= 0) {
    res.status(400).json({ error: 'Payment amount must be greater than zero.' });
    return;
  }

  if (payAmt > invoice.balanceDue) {
    res.status(400).json({
      error: `Payment amount (INR ₹${payAmt.toLocaleString()}) cannot exceed outstanding balance (INR ₹${invoice.balanceDue.toLocaleString()}).`,
    });
    return;
  }

  const validMethods: SupportedPaymentMethod[] = ['Cash', 'UPI', 'Card', 'Bank Transfer'];
  const method: SupportedPaymentMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'UPI';

  // 1. Record payment transaction
  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    idempotencyKey: cleanIdempKey || `auto-${Date.now()}`,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clinicId,
    patientId: invoice.patientId,
    patientName: invoice.patientName,
    amount: payAmt,
    paymentMethod: method,
    transactionRef: transactionRef ? String(transactionRef).trim() : `TXN-${Date.now()}`,
    status: 'SUCCESSFUL',
    recordedBy: user.id,
    timestamp: new Date().toISOString(),
  };

  OralixDb.savePayment(paymentRecord);

  // 2. Update invoice amountPaid and balanceDue
  const newAmountPaid = invoice.amountPaid + payAmt;
  const newBalanceDue = Math.max(0, invoice.total - newAmountPaid);
  invoice.amountPaid = newAmountPaid;
  invoice.balanceDue = newBalanceDue;
  invoice.status = newBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';
  OralixDb.saveInvoice(invoice);

  // 3. Update patient's total balance due
  const patient = OralixDb.findPatientById(invoice.patientId, clinicId);
  if (patient) {
    patient.balanceDue = Math.max(0, (patient.balanceDue || 0) - payAmt);
    OralixDb.savePatient(patient);
  }

  // 4. Generate official digital receipt
  const allReceipts = OralixDb.getReceipts(clinicId);
  const receiptNumber = `OX-RCP-${new Date().getFullYear()}-${String(allReceipts.length + 1).padStart(4, '0')}`;

  const receiptRecord: ReceiptRecord = {
    id: `rcp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    receiptNumber,
    paymentId: paymentRecord.id,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clinicId,
    patientId: invoice.patientId,
    patientName: invoice.patientName,
    patientEmail: invoice.patientEmail,
    date: new Date().toISOString().split('T')[0],
    amountReceived: payAmt,
    remainingBalance: newBalanceDue,
    paymentMethod: method,
    emailStatus: 'pending',
    createdAt: new Date().toISOString(),
  };

  OralixDb.saveReceipt(receiptRecord);

  // 5. Attempt automatic email dispatch via Resend
  let emailDeliverySuccess = false;
  let emailDeliveryError: string | undefined;

  if (invoice.patientEmail) {
    try {
      // Import the sendReceiptEmail function from server
      const { sendReceiptEmail } = await import('../../../server.ts');
      const emailResult = await sendReceiptEmail({
        invoiceNumber: invoice.invoiceNumber,
        patientName: invoice.patientName,
        patientEmail: invoice.patientEmail,
        date: receiptRecord.date,
        items: invoice.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
        consultationFee: invoice.consultationFee,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        total: invoice.total,
        amountPaid: payAmt,
        paymentMethod: method,
        paymentStatus: invoice.status === 'PAID' ? 'Fully Settled' : 'Partially Paid',
      });

      if (emailResult.delivered) {
        receiptRecord.emailStatus = 'sent';
        receiptRecord.emailSentAt = new Date().toISOString();
        emailDeliverySuccess = true;
      } else {
        receiptRecord.emailStatus = 'failed';
        receiptRecord.emailError = emailResult.error || 'Email dispatch failed';
        emailDeliveryError = receiptRecord.emailError;
      }
    } catch (err: any) {
      receiptRecord.emailStatus = 'failed';
      receiptRecord.emailError = err?.message || String(err);
      emailDeliveryError = receiptRecord.emailError;
    }
    OralixDb.saveReceipt(receiptRecord);
  }

  OralixDb.addNotification({
    clinicId,
    type: 'receipt',
    title: 'Payment Received',
    message: `Received INR ₹${payAmt.toLocaleString()} for ${invoice.invoiceNumber} (${method}). Receipt ${receiptNumber} generated.`,
    read: false,
    link: '/billing',
  });

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'PAYMENT_RECORD',
    entityType: 'Payment',
    entityId: paymentRecord.id,
    details: `Settled payment of INR ₹${payAmt} for invoice ${invoice.invoiceNumber}. Method: ${method}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    success: true,
    message: 'Payment recorded and receipt generated successfully.',
    payment: paymentRecord,
    invoice,
    receipt: receiptRecord,
    email: {
      sent: emailDeliverySuccess,
      error: emailDeliveryError,
    },
  });
};

router.post('/payments', requireAuth, recordPaymentHandler);
router.post('/invoices/:id/payments', requireAuth, recordPaymentHandler);

/**
 * GET /api/billing/receipts
 */
router.get('/receipts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const allReceipts = OralixDb.getReceipts(clinicId);

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    const pid = ownPatient?.id || user.patientId || user.id;
    const own = allReceipts.filter(r => r.patientId === pid);
    res.json({ success: true, receipts: own });
    return;
  }

  res.json({ success: true, count: allReceipts.length, receipts: allReceipts });
});

/**
 * GET /api/billing/receipts/:id
 */
router.get('/receipts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const receipt = OralixDb.findReceiptById(req.params.id, clinicId);

  if (!receipt) {
    res.status(404).json({ error: 'Receipt not found.' });
    return;
  }

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    const pid = ownPatient?.id || user.patientId || user.id;
    if (receipt.patientId !== pid) {
      res.status(403).json({ error: 'Access denied: You can only view your own receipts.' });
      return;
    }
  }

  res.json({ success: true, receipt });
});

/**
 * POST /api/billing/receipts/:id/resend
 * Resend receipt email without re-charging
 */
router.post('/receipts/:id/resend', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const clinicId = 'clinic-ox-main';
  const receipt = OralixDb.findReceiptById(req.params.id, clinicId);

  if (!receipt) {
    res.status(404).json({ error: 'Receipt not found.' });
    return;
  }

  const invoice = OralixDb.findInvoiceById(receipt.invoiceId, clinicId);
  const patientEmail = receipt.patientEmail || invoice?.patientEmail;

  if (!patientEmail) {
    res.status(400).json({ error: 'No recipient email associated with this receipt.' });
    return;
  }

  try {
    const { sendReceiptEmail } = await import('../../../server.ts');
    const result = await sendReceiptEmail({
      invoiceNumber: receipt.invoiceNumber,
      patientName: receipt.patientName,
      patientEmail,
      date: receipt.date,
      items: invoice?.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })) || [],
      consultationFee: invoice?.consultationFee || 0,
      subtotal: invoice?.subtotal || receipt.amountReceived,
      discount: invoice?.discount || 0,
      total: invoice?.total || receipt.amountReceived,
      amountPaid: receipt.amountReceived,
      paymentMethod: receipt.paymentMethod,
      paymentStatus: receipt.remainingBalance === 0 ? 'Fully Settled' : 'Partially Paid',
    });

    if (result.delivered) {
      receipt.emailStatus = 'sent';
      receipt.emailSentAt = new Date().toISOString();
      receipt.emailError = undefined;
      OralixDb.saveReceipt(receipt);
      res.json({ success: true, message: `Receipt resent to ${patientEmail}.` });
    } else {
      receipt.emailStatus = 'failed';
      receipt.emailError = result.error;
      OralixDb.saveReceipt(receipt);
      res.status(502).json({ success: false, error: result.error || 'Failed to dispatch receipt email.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error while resending receipt.' });
  }
});

/**
 * GET /api/billing/collections
 * Calculates real daily and monthly collections strictly from authentic payments
 */
router.get('/collections', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role === 'patient') {
    res.status(403).json({ error: 'Access denied: Patients cannot access clinic collection reports.' });
    return;
  }

  const clinicId = 'clinic-ox-main';
  const payments = OralixDb.getPayments(clinicId);
  const invoices = OralixDb.getInvoices(clinicId);

  // Today's Date in UTC/local
  const todayStr = new Date().toISOString().split('T')[0];

  // Daily Collections
  const todayPayments = payments.filter(p => p.status === 'SUCCESSFUL' && p.timestamp.startsWith(todayStr));
  const dailyTotal = todayPayments.reduce((acc, p) => acc + p.amount, 0);

  // Monthly Collections grouped by Month (YYYY-MM)
  const monthlyMap: Record<string, { month: string; billed: number; collected: number; paymentCount: number }> = {};

  payments.forEach(p => {
    if (p.status !== 'SUCCESSFUL') return;
    const ym = p.timestamp.substring(0, 7); // "YYYY-MM"
    if (!monthlyMap[ym]) {
      monthlyMap[ym] = { month: ym, billed: 0, collected: 0, paymentCount: 0 };
    }
    monthlyMap[ym].collected += p.amount;
    monthlyMap[ym].paymentCount += 1;
  });

  invoices.forEach(inv => {
    const ym = inv.date.substring(0, 7);
    if (!monthlyMap[ym]) {
      monthlyMap[ym] = { month: ym, billed: 0, collected: 0, paymentCount: 0 };
    }
    monthlyMap[ym].billed += inv.total;
  });

  const monthlyCollections = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  // Overall Financial Telemetry
  const totalBilled = invoices.reduce((acc, i) => acc + i.total, 0);
  const totalCollected = payments.filter(p => p.status === 'SUCCESSFUL').reduce((acc, p) => acc + p.amount, 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + i.balanceDue, 0);
  const collectionEfficiency = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  res.json({
    success: true,
    totalCollections: totalCollected,
    collectionCount: payments.length,
    dailyCollections: {
      date: todayStr,
      total: dailyTotal,
      transactionCount: todayPayments.length,
    },
    monthlyCollections,
    summary: {
      grossBilled: totalBilled,
      totalCollected,
      totalOutstanding,
      collectionEfficiencyPct: collectionEfficiency,
      invoiceCount: invoices.length,
      paymentCount: payments.length,
    },
  });
});

export default router;
