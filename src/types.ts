export type UserRole = 'doctor' | 'admin' | 'patient';

export interface User {
  id: string;
  oralixId: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  avatarText: string;
  phone?: string;
  specialization?: string;
  patientId?: string; // If role is patient, links to patient profile
  department?: string;
  licenseNumber?: string;
  bio?: string;
  joinedDate?: string;
  createdAt?: string;
  status?: 'active' | 'on_leave' | 'inactive';
  address?: string;
  emergencyContact?: string;
}

export type ToothConditionType = 
  | 'healthy'
  | 'watch'
  | 'cavity'
  | 'filling'
  | 'crown'
  | 'root_canal'
  | 'missing'
  | 'implant';

export type ToothSurface = 'occlusal' | 'mesial' | 'distal' | 'buccal' | 'lingual';

export interface ToothFinding {
  id: string;
  patientId: string;
  toothNumber: number; // FDI notation e.g., 18-11, 21-28, 31-38, 41-48
  universalNumber?: number; // 1-32 notation
  condition: ToothConditionType;
  surfaces: ToothSurface[];
  diagnosis: string;
  recommendedTreatment?: string;
  estimatedCost?: number;
  doctorName: string;
  date: string;
  notes?: string;
}

export interface Patient {
  id: string;
  code: string; // e.g., DF-2026-001
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  medicalAlerts: string[]; // e.g. "Penicillin Allergy", "Hypertension", "Diabetic"
  dentalHistorySummary?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  balanceDue: number;
  lastVisitDate?: string;
  nextAppointmentDate?: string;
  registeredDate?: string;
  avatarBg?: string;
}

export type AppointmentStatus = 'confirmed' | 'in_chair' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorId: string;
  chair: string; // e.g., 'Chair 1 - Hygiene', 'Chair 2 - Ortho', 'Chair 3 - Surgery'
  date: string; // YYYY-MM-DD
  time: string; // e.g., "09:30 AM"
  durationMinutes: number;
  procedure: string;
  status: AppointmentStatus;
  notes?: string;
  tokenNumber?: string;
}

export type QueueStatus = 'waiting' | 'in_chair' | 'billing' | 'completed';

export interface QueueItem {
  id: string;
  tokenNumber: string; // e.g. #D-101
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  chair: string;
  checkInTime: string;
  status: QueueStatus;
  estimatedWaitMinutes: number;
  procedure: string;
}

export type PlanStatus = 'proposed' | 'accepted' | 'in_progress' | 'completed';

export interface TreatmentProcedureItem {
  id: string;
  toothNumber?: number;
  code: string; // e.g. 'D2750'
  name: string;
  fee: number;
  status: 'pending' | 'in_progress' | 'done';
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  dateCreated: string;
  status: PlanStatus;
  title: string;
  phase: string; // 'Phase 1: Relief & Emergency', 'Phase 2: Restorative', etc.
  totalCost: number;
  discount: number;
  insuranceCovered: number;
  patientPortion: number;
  procedures: TreatmentProcedureItem[];
  notes?: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  chiefComplaint?: string;
  subjective: string; // Patient complaint & history
  objective: string; // Examination findings & vitals
  assessment: string; // Diagnosis
  plan: string; // Proposed procedure
  vitals?: {
    bp?: string;
    pulse?: string;
    bloodSugar?: string;
  };
  toothNumbers?: number[];
  toothNumber?: number;
  signed?: boolean;
  isSigned?: boolean;
  prescriptions?: string[];
  signatureDate?: string;
}

export interface PrescriptionItem {
  drugName: string;
  dosage: string; // e.g. "500 mg"
  frequency: string; // e.g. "Three times daily (TID)"
  duration: string; // e.g. "5 days"
  instructions: string; // e.g. "Take after food"
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  doctorName: string;
  date: string;
  diagnosis: string;
  items: PrescriptionItem[];
  instructions: string;
}

export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'partially_paid';

export interface InvoiceItem {
  description: string;
  code?: string;
  tooth?: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-089
  patientId: string;
  patientName: string;
  patientCode?: string;
  date: string;
  dueDate: string;
  items?: InvoiceItem[];
  description?: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  totalAmount?: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentMethod?: 'QR Payment' | 'UPI' | 'Debit Card' | 'Credit Card' | 'Cash' | 'Insurance' | 'Card / POS' | 'upi' | 'card' | 'cash' | 'insurance';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  sku?: string;
  currentStock?: number;
  quantity?: number;
  minThreshold: number;
  unit: string; // 'pack', 'box', 'vial', 'cartridge', 'syringe'
  costPerUnit?: number;
  supplier: string;
  expiryDate?: string;
  lastRestocked?: string;
  location?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface StaffMember {
  id: string;
  name: string;
  role: string; // 'Chief Dental Surgeon', 'Endodontist', 'Orthodontist', etc.
  specialization?: string;
  specialty?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  assignedChair?: string;
  chairAssigned?: string;
  availability?: string;
  schedule?: string;
  email: string;
  phone: string;
  activePatientsToday?: number;
  avatarText: string;
  status?: string;
}

export type PaymentState = 'pending' | 'successful' | 'failed' | 'cancelled';

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentMethod: 'QR Payment' | 'UPI' | 'Debit Card' | 'Credit Card' | 'Cash' | 'Insurance' | 'Card / POS';
  transactionRef: string; // UTR / POS Terminal Ref / Cash Voucher # / Insurance Pre-Auth #
  status: PaymentState;
  timestamp: string;
  gatewayResponse?: {
    authorizationCode?: string;
    cardNetwork?: string; // Visa, Mastercard, RuPay, Amex
    cardLast4?: string;
    insuranceProvider?: string;
    policyNumber?: string;
    cashierName?: string;
    failureReason?: string;
  };
}

export interface FinancingRequest {
  id: string;
  patientId: string;
  patientName: string;
  treatmentPlanId?: string;
  requestedAmount: number;
  tenureMonths: 3 | 6 | 12;
  monthlyInstallment: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedDate: string;
  employmentStatus?: string;
  notes?: string;
}


