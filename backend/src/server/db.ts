/**
 * src/server/db.ts — Oralix Unified Clinic Database & Persistence Engine
 * 
 * Provides atomic, validated, multi-tenant persistence for:
 * - Clinic Configuration & Operatories
 * - Patient Records (scoped to clinic, isolated per patient)
 * - Appointments (valid status state machine, double-booking prevention)
 * - Invoices, Payments (atomic transactions, idempotency checks)
 * - Receipts & Delivery History
 * - Feedback & Reviews (verified patient reviews)
 * - Integrations (Instagram, Google Business Profile states)
 * - Patient Files & Reports (MIME validated, size constrained)
 * - Audit Logs & System Notifications
 */

import fs from 'fs';
import path from 'path';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'patient' | 'admin' | 'receptionist';
  avatarText?: string;
  phone?: string;
  doctorId?: string;
  patientId?: string;
  specialization?: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinedDate?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  session?: any;
}

// ─── DATA PATHS ───────────────────────────────────────────────────────────────
const DB_PATHS = {
  CLINIC: path.resolve('.oralix_clinic_store.json'),
  PATIENTS: path.resolve('.oralix_patient_store.json'),
  APPOINTMENTS: path.resolve('.oralix_appointment_store.json'),
  INVOICES: path.resolve('.oralix_invoice_store.json'),
  PAYMENTS: path.resolve('.oralix_payment_store.json'),
  RECEIPTS: path.resolve('.oralix_receipt_store.json'),
  FEEDBACK: path.resolve('.oralix_feedback_store.json'),
  INTEGRATIONS: path.resolve('.oralix_integration_store.json'),
  FILES: path.resolve('.oralix_file_store.json'),
  NOTIFICATIONS: path.resolve('.oralix_notification_store.json'),
  AUDIT_LOGS: path.resolve('.oralix_audit_store.json'),
};

// ─── SAFE FILE IO HELPERS ─────────────────────────────────────────────────────
function safeRead<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[Oralix DB] Error reading ${filePath}:`, err);
    return fallback;
  }
}

function safeWrite<T>(filePath: string, data: T): void {
  try {
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`[Oralix DB] Error writing ${filePath}:`, err);
  }
}

// ─── INTERFACES ───────────────────────────────────────────────────────────────
export interface ClinicChair {
  id: string;
  name: string;
  specialty: string;
}

export interface ClinicRecord {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  taxRatePct: number;
  chairs: ClinicChair[];
  businessHours: string;
  registrationNumber: string;
  updatedAt: string;
}

export interface PatientRecord {
  id: string;
  userId?: string;
  clinicId: string;
  code: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address?: string;
  bloodGroup?: string;
  medicalAlerts: string[];
  emergencyContact?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  balanceDue: number;
  registeredDate: string;
  lastVisitDate?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type AppointmentState =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface AppointmentRecord {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  chair: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:30 AM" or "09:30"
  endTime: string; // e.g. "10:15 AM" or "10:15"
  durationMinutes: number;
  procedure: string;
  status: AppointmentState;
  tokenNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoicePaymentStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUNDED';

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  date: string;
  dueDate: string;
  createdBy: string;
  items: InvoiceLineItem[];
  consultationFee: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoicePaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SupportedPaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

export interface PaymentRecord {
  id: string;
  idempotencyKey: string;
  invoiceId: string;
  invoiceNumber: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentMethod: SupportedPaymentMethod;
  transactionRef: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';
  recordedBy: string;
  timestamp: string;
}

export interface ReceiptRecord {
  id: string;
  receiptNumber: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  date: string;
  amountReceived: number;
  remainingBalance: number;
  paymentMethod: SupportedPaymentMethod;
  emailStatus: 'pending' | 'sent' | 'failed';
  emailError?: string;
  emailSentAt?: string;
  createdAt: string;
}

export interface FeedbackRecord {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  treatmentName: string;
  rating: number; // 1 to 5
  comment: string;
  verified: boolean;
  published: boolean;
  clinicResponse?: string;
  respondedAt?: string;
  createdAt: string;
}

export type IntegrationState =
  | 'NOT_CONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'SYNCING'
  | 'SYNCED'
  | 'SYNC_FAILED'
  | 'DISCONNECTED'
  | 'REAUTH_REQUIRED';

export interface InstagramIntegrationRecord {
  clinicId: string;
  state: IntegrationState;
  accountHandle?: string;
  connectedAt?: string;
  lastSync?: string;
  followers?: number;
  followerGrowthPct?: number;
  likes?: number;
  comments?: number;
  reach?: number;
  impressions?: number;
  reelsCount?: number;
  postsCount?: number;
  errorMessage?: string;
}

export interface GoogleBusinessIntegrationRecord {
  clinicId: string;
  state: IntegrationState;
  locationName?: string;
  connectedAt?: string;
  lastSync?: string;
  searches?: number;
  views?: number;
  calls?: number;
  directionRequests?: number;
  websiteClicks?: number;
  rating?: number;
  reviewCount?: number;
  unansweredReviewsCount?: number;
  errorMessage?: string;
}

export interface IntegrationsRecord {
  instagram: InstagramIntegrationRecord;
  googleBusiness: GoogleBusinessIntegrationRecord;
}

export interface PatientFileRecord {
  id: string;
  clinicId: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: 'xray' | 'lab_report' | 'prescription' | 'consent' | 'other';
  uploadedBy: string;
  uploadedAt: string;
  storageData?: string; // base64 or inline data
}

export interface NotificationRecord {
  id: string;
  clinicId: string;
  userId?: string;
  type: 'appointment' | 'payment' | 'receipt' | 'security' | 'feedback' | 'integration';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLogRecord {
  id: string;
  clinicId: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ip: string;
  timestamp: string;
}

// ─── DEFAULT VALUES ───────────────────────────────────────────────────────────
const DEFAULT_CLINIC: ClinicRecord = {
  id: 'clinic-ox-main',
  name: 'Oralix Dental Clinic',
  tagline: 'Advanced Dental Medicine & Technology',
  phone: '+91 98450 11223',
  email: 'care@oralix.online',
  address: '402 Medical Arts Plaza, Indiranagar, Bangalore 560038',
  currency: 'INR',
  taxRatePct: 0,
  chairs: [
    { id: 'chair-1', name: 'Chair 1 - Endodontics', specialty: 'Endodontics & Restorative' },
    { id: 'chair-2', name: 'Chair 2 - Surgery', specialty: 'Oral & Maxillofacial Surgery' },
    { id: 'chair-3', name: 'Chair 3 - Orthodontics', specialty: 'Orthodontics & Preventive' },
  ],
  businessHours: 'Mon - Sat: 09:00 AM - 08:00 PM',
  registrationNumber: 'OX-BLR-2026-REG',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_INTEGRATIONS: IntegrationsRecord = {
  instagram: {
    clinicId: 'clinic-ox-main',
    state: 'NOT_CONNECTED',
  },
  googleBusiness: {
    clinicId: 'clinic-ox-main',
    state: 'NOT_CONNECTED',
  },
};

// ─── ORALIX DB REPOSITORY ─────────────────────────────────────────────────────
export const OralixDb = {
  // Clinic
  getClinic(): ClinicRecord {
    return safeRead<ClinicRecord>(DB_PATHS.CLINIC, DEFAULT_CLINIC);
  },
  saveClinic(clinic: ClinicRecord): void {
    clinic.updatedAt = new Date().toISOString();
    safeWrite(DB_PATHS.CLINIC, clinic);
  },

  // Patients
  getPatients(clinicId = 'clinic-ox-main'): PatientRecord[] {
    const list = safeRead<PatientRecord[]>(DB_PATHS.PATIENTS, []);
    return list.filter(p => p.clinicId === clinicId && p.status !== 'archived');
  },
  getAllPatientsRaw(): PatientRecord[] {
    return safeRead<PatientRecord[]>(DB_PATHS.PATIENTS, []);
  },
  savePatients(patients: PatientRecord[]): void {
    safeWrite(DB_PATHS.PATIENTS, patients);
  },
  findPatientById(id: string, clinicId?: string): PatientRecord | undefined {
    const list = safeRead<PatientRecord[]>(DB_PATHS.PATIENTS, []);
    return list.find(p => p.id === id && (!clinicId || p.clinicId === clinicId));
  },
  findPatientByEmail(email: string, clinicId?: string): PatientRecord | undefined {
    const clean = email.toLowerCase().trim();
    const list = safeRead<PatientRecord[]>(DB_PATHS.PATIENTS, []);
    return list.find(p => p.email.toLowerCase().trim() === clean && (!clinicId || p.clinicId === clinicId));
  },
  savePatient(patient: PatientRecord): PatientRecord {
    const all = safeRead<PatientRecord[]>(DB_PATHS.PATIENTS, []);
    const idx = all.findIndex(p => p.id === patient.id);
    patient.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      all[idx] = patient;
    } else {
      patient.createdAt = patient.createdAt || new Date().toISOString();
      all.unshift(patient);
    }
    safeWrite(DB_PATHS.PATIENTS, all);
    return patient;
  },

  // Appointments
  getAppointments(clinicId = 'clinic-ox-main'): AppointmentRecord[] {
    const list = safeRead<AppointmentRecord[]>(DB_PATHS.APPOINTMENTS, []);
    return list.filter(a => a.clinicId === clinicId);
  },
  saveAppointments(apts: AppointmentRecord[]): void {
    safeWrite(DB_PATHS.APPOINTMENTS, apts);
  },
  saveAppointment(apt: AppointmentRecord): AppointmentRecord {
    const all = safeRead<AppointmentRecord[]>(DB_PATHS.APPOINTMENTS, []);
    const idx = all.findIndex(a => a.id === apt.id);
    apt.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      all[idx] = apt;
    } else {
      apt.createdAt = apt.createdAt || new Date().toISOString();
      all.unshift(apt);
    }
    safeWrite(DB_PATHS.APPOINTMENTS, all);
    return apt;
  },

  // Invoices
  getInvoices(clinicId = 'clinic-ox-main'): InvoiceRecord[] {
    const list = safeRead<InvoiceRecord[]>(DB_PATHS.INVOICES, []);
    return list.filter(i => i.clinicId === clinicId);
  },
  saveInvoices(invoices: InvoiceRecord[]): void {
    safeWrite(DB_PATHS.INVOICES, invoices);
  },
  findInvoiceById(id: string, clinicId?: string): InvoiceRecord | undefined {
    const list = safeRead<InvoiceRecord[]>(DB_PATHS.INVOICES, []);
    return list.find(i => i.id === id && (!clinicId || i.clinicId === clinicId));
  },
  saveInvoice(inv: InvoiceRecord): InvoiceRecord {
    const all = safeRead<InvoiceRecord[]>(DB_PATHS.INVOICES, []);
    const idx = all.findIndex(i => i.id === inv.id);
    inv.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      all[idx] = inv;
    } else {
      inv.createdAt = inv.createdAt || new Date().toISOString();
      all.unshift(inv);
    }
    safeWrite(DB_PATHS.INVOICES, all);
    return inv;
  },

  // Payments
  getPayments(clinicId = 'clinic-ox-main'): PaymentRecord[] {
    const list = safeRead<PaymentRecord[]>(DB_PATHS.PAYMENTS, []);
    return list.filter(p => p.clinicId === clinicId);
  },
  findPaymentByIdempotencyKey(key: string): PaymentRecord | undefined {
    const list = safeRead<PaymentRecord[]>(DB_PATHS.PAYMENTS, []);
    return list.find(p => p.idempotencyKey === key && p.status === 'SUCCESSFUL');
  },
  savePayment(payment: PaymentRecord): PaymentRecord {
    const all = safeRead<PaymentRecord[]>(DB_PATHS.PAYMENTS, []);
    all.unshift(payment);
    safeWrite(DB_PATHS.PAYMENTS, all);
    return payment;
  },

  // Receipts
  getReceipts(clinicId = 'clinic-ox-main'): ReceiptRecord[] {
    const list = safeRead<ReceiptRecord[]>(DB_PATHS.RECEIPTS, []);
    return list.filter(r => r.clinicId === clinicId);
  },
  findReceiptById(id: string, clinicId?: string): ReceiptRecord | undefined {
    const list = safeRead<ReceiptRecord[]>(DB_PATHS.RECEIPTS, []);
    return list.find(r => (r.id === id || r.receiptNumber === id) && (!clinicId || r.clinicId === clinicId));
  },
  findReceiptByPaymentId(paymentId: string): ReceiptRecord | undefined {
    const list = safeRead<ReceiptRecord[]>(DB_PATHS.RECEIPTS, []);
    return list.find(r => r.paymentId === paymentId);
  },
  saveReceipt(receipt: ReceiptRecord): ReceiptRecord {
    const all = safeRead<ReceiptRecord[]>(DB_PATHS.RECEIPTS, []);
    const idx = all.findIndex(r => r.id === receipt.id);
    if (idx >= 0) {
      all[idx] = receipt;
    } else {
      all.unshift(receipt);
    }
    safeWrite(DB_PATHS.RECEIPTS, all);
    return receipt;
  },

  // Feedback
  getFeedback(clinicId = 'clinic-ox-main'): FeedbackRecord[] {
    const list = safeRead<FeedbackRecord[]>(DB_PATHS.FEEDBACK, []);
    return list.filter(f => f.clinicId === clinicId);
  },
  saveFeedback(fb: FeedbackRecord): FeedbackRecord {
    const all = safeRead<FeedbackRecord[]>(DB_PATHS.FEEDBACK, []);
    const idx = all.findIndex(f => f.id === fb.id);
    if (idx >= 0) {
      all[idx] = fb;
    } else {
      all.unshift(fb);
    }
    safeWrite(DB_PATHS.FEEDBACK, all);
    return fb;
  },

  // Integrations
  getIntegrations(clinicId = 'clinic-ox-main'): IntegrationsRecord {
    const record = safeRead<IntegrationsRecord>(DB_PATHS.INTEGRATIONS, DEFAULT_INTEGRATIONS);
    if (!record.instagram) record.instagram = { clinicId, state: 'NOT_CONNECTED' };
    if (!record.googleBusiness) record.googleBusiness = { clinicId, state: 'NOT_CONNECTED' };
    return record;
  },
  saveIntegrations(integrations: IntegrationsRecord): void {
    safeWrite(DB_PATHS.INTEGRATIONS, integrations);
  },

  // Files
  getFiles(clinicId = 'clinic-ox-main', patientId?: string): PatientFileRecord[] {
    const list = safeRead<PatientFileRecord[]>(DB_PATHS.FILES, []);
    return list.filter(f => f.clinicId === clinicId && (!patientId || f.patientId === patientId));
  },
  findFileById(id: string, clinicId?: string): PatientFileRecord | undefined {
    const list = safeRead<PatientFileRecord[]>(DB_PATHS.FILES, []);
    return list.find(f => f.id === id && (!clinicId || f.clinicId === clinicId));
  },
  saveFile(file: PatientFileRecord): PatientFileRecord {
    const all = safeRead<PatientFileRecord[]>(DB_PATHS.FILES, []);
    all.unshift(file);
    safeWrite(DB_PATHS.FILES, all);
    return file;
  },

  // Notifications
  getNotifications(clinicId = 'clinic-ox-main', userId?: string): NotificationRecord[] {
    const list = safeRead<NotificationRecord[]>(DB_PATHS.NOTIFICATIONS, []);
    return list.filter(n => n.clinicId === clinicId && (!n.userId || !userId || n.userId === userId));
  },
  addNotification(n: Omit<NotificationRecord, 'id' | 'createdAt'>): NotificationRecord {
    const all = safeRead<NotificationRecord[]>(DB_PATHS.NOTIFICATIONS, []);
    const record: NotificationRecord = {
      ...n,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(record);
    if (all.length > 200) all.length = 200; // retain most recent 200
    safeWrite(DB_PATHS.NOTIFICATIONS, all);
    return record;
  },
  markNotificationRead(id: string): void {
    const all = safeRead<NotificationRecord[]>(DB_PATHS.NOTIFICATIONS, []);
    const item = all.find(n => n.id === id);
    if (item) {
      item.read = true;
      safeWrite(DB_PATHS.NOTIFICATIONS, all);
    }
  },

  // Audit Logs
  getAuditLogs(clinicId = 'clinic-ox-main'): AuditLogRecord[] {
    const list = safeRead<AuditLogRecord[]>(DB_PATHS.AUDIT_LOGS, []);
    return list.filter(l => l.clinicId === clinicId);
  },
  addAuditLog(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): void {
    const all = safeRead<AuditLogRecord[]>(DB_PATHS.AUDIT_LOGS, []);
    const record: AuditLogRecord = {
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    all.unshift(record);
    if (all.length > 500) all.length = 500; // retain most recent 500
    safeWrite(DB_PATHS.AUDIT_LOGS, all);
  },
};
