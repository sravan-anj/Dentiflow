import { hashPassword } from './authService';
import {
  Patient,
  ToothFinding,
  Appointment,
  QueueItem,
  TreatmentPlan,
  ClinicalNote,
  Prescription,
  Invoice,
  InventoryItem,
  StaffMember,
  User,
  FinancingRequest,
  PaymentTransaction
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_TOOTH_FINDINGS,
  INITIAL_APPOINTMENTS,
  INITIAL_QUEUE,
  INITIAL_TREATMENT_PLANS,
  INITIAL_CLINICAL_NOTES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_INVENTORY,
  INITIAL_STAFF
} from '../data/seedData';

const STORAGE_KEYS = {
  CURRENT_USER: 'dentiflow_current_user_v2',
  USERS: 'dentiflow_users_v2',
  PATIENTS: 'dentiflow_patients_v2',
  TOOTH_FINDINGS: 'dentiflow_tooth_findings_v2',
  APPOINTMENTS: 'dentiflow_appointments_v2',
  QUEUE: 'dentiflow_queue_v2',
  TREATMENT_PLANS: 'dentiflow_treatment_plans_v2',
  CLINICAL_NOTES: 'dentiflow_clinical_notes_v2',
  PRESCRIPTIONS: 'dentiflow_prescriptions_v2',
  INVOICES: 'dentiflow_invoices_v2',
  INVENTORY: 'dentiflow_inventory_v2',
  STAFF: 'dentiflow_staff_v2',
  FINANCING_REQUESTS: 'dentiflow_financing_requests_v2',
  TRANSACTIONS: 'dentiflow_transactions_v2'
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error('Failed to read from localStorage', key, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage', key, err);
  }
}

export const StorageService = {
  // Users list with automatic migration for oralixId & passwordHash
  getUsers: (): User[] => {
    const raw = safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let list: User[] = Array.isArray(raw) ? [...raw] : [];
    let modified = false;

    INITIAL_USERS.forEach(initUser => {
      const idx = list.findIndex(u => {
        if (!u) return false;
        if (u.id === initUser.id) return true;
        if (u.email && initUser.email && u.email.toLowerCase().trim() === initUser.email.toLowerCase().trim()) return true;
        if (u.oralixId && initUser.oralixId && u.oralixId.toLowerCase().trim() === initUser.oralixId.toLowerCase().trim()) return true;
        return false;
      });

      if (idx === -1) {
        list.push(initUser);
        modified = true;
      } else {
        // Enforce canonical properties on built-in seeded accounts
        const existing = list[idx];
        let updated = false;
        if (existing.role !== initUser.role) {
          existing.role = initUser.role;
          updated = true;
        }
        if (existing.email !== initUser.email) {
          existing.email = initUser.email;
          updated = true;
        }
        if (existing.oralixId !== initUser.oralixId) {
          existing.oralixId = initUser.oralixId;
          updated = true;
        }
        if (!existing.passwordHash || existing.passwordHash !== initUser.passwordHash) {
          existing.passwordHash = initUser.passwordHash;
          updated = true;
        }
        if (updated) modified = true;
      }
    });

    // Ensure all other registered users have oralixId & passwordHash
    const sanitized = list.map(u => {
      let updated = false;
      const copy = { ...u };
      if (!copy.oralixId) {
        copy.oralixId = generateOralixId(copy.name, copy.role, list);
        updated = true;
      }
      if (!copy.passwordHash) {
        const defaultPass = copy.role === 'doctor' ? 'doctor123' : copy.role === 'admin' ? 'admin123' : 'patient123';
        copy.passwordHash = hashPassword(defaultPass);
        updated = true;
      }
      if (updated) modified = true;
      return copy;
    });

    if (modified || sanitized.length === 0) {
      safeSet(STORAGE_KEYS.USERS, sanitized);
    }
    return sanitized;
  },
  saveUsers: (users: User[]): void => safeSet(STORAGE_KEYS.USERS, users),
  updateUser: (updatedUser: User): void => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    let updatedList: User[];
    if (index >= 0) {
      updatedList = [...users];
      updatedList[index] = updatedUser;
    } else {
      updatedList = [...users, updatedUser];
    }
    safeSet(STORAGE_KEYS.USERS, updatedList);

    // If updating current user, sync current user storage
    const current = StorageService.getCurrentUser();
    if (current && current.id === updatedUser.id) {
      safeSet(STORAGE_KEYS.CURRENT_USER, updatedUser);
    }
  },

  // Current logged in user (null by default so landing page opens first)
  getCurrentUser: (): User | null => safeGet<User | null>(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User | null): void => safeSet(STORAGE_KEYS.CURRENT_USER, user),
  saveCurrentUser: (user: User | null): void => safeSet(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: (): void => localStorage.removeItem(STORAGE_KEYS.CURRENT_USER),

  // Patients
  getPatients: (): Patient[] => {
    const loaded = safeGet<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const missing = INITIAL_PATIENTS.filter(sp => !loaded.some(p => p.id === sp.id));
    if (missing.length > 0) {
      const merged = [...loaded, ...missing];
      safeSet(STORAGE_KEYS.PATIENTS, merged);
      return merged;
    }
    return loaded;
  },
  savePatients: (patients: Patient[]): void => safeSet(STORAGE_KEYS.PATIENTS, patients),

  // Tooth Findings
  getToothFindings: (): ToothFinding[] => safeGet<ToothFinding[]>(STORAGE_KEYS.TOOTH_FINDINGS, INITIAL_TOOTH_FINDINGS),
  saveToothFindings: (findings: ToothFinding[]): void => safeSet(STORAGE_KEYS.TOOTH_FINDINGS, findings),

  // Appointments
  getAppointments: (): Appointment[] => safeGet<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS),
  saveAppointments: (appointments: Appointment[]): void => safeSet(STORAGE_KEYS.APPOINTMENTS, appointments),

  // Queue
  getQueue: (): QueueItem[] => safeGet<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE),
  saveQueue: (queue: QueueItem[]): void => safeSet(STORAGE_KEYS.QUEUE, queue),

  // Treatment Plans
  getTreatmentPlans: (): TreatmentPlan[] => safeGet<TreatmentPlan[]>(STORAGE_KEYS.TREATMENT_PLANS, INITIAL_TREATMENT_PLANS),
  saveTreatmentPlans: (plans: TreatmentPlan[]): void => safeSet(STORAGE_KEYS.TREATMENT_PLANS, plans),

  // Clinical Notes
  getClinicalNotes: (): ClinicalNote[] => safeGet<ClinicalNote[]>(STORAGE_KEYS.CLINICAL_NOTES, INITIAL_CLINICAL_NOTES),
  saveClinicalNotes: (notes: ClinicalNote[]): void => safeSet(STORAGE_KEYS.CLINICAL_NOTES, notes),

  // Prescriptions
  getPrescriptions: (): Prescription[] => safeGet<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS),
  savePrescriptions: (prescriptions: Prescription[]): void => safeSet(STORAGE_KEYS.PRESCRIPTIONS, prescriptions),

  // Invoices
  getInvoices: (): Invoice[] => {
    const loaded = safeGet<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const missing = INITIAL_INVOICES.filter(si => !loaded.some(i => i.id === si.id));
    if (missing.length > 0) {
      const merged = [...loaded, ...missing];
      safeSet(STORAGE_KEYS.INVOICES, merged);
      return merged;
    }
    return loaded;
  },
  saveInvoices: (invoices: Invoice[]): void => safeSet(STORAGE_KEYS.INVOICES, invoices),

  // Inventory
  getInventory: (): InventoryItem[] => safeGet<InventoryItem[]>(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY),
  saveInventory: (inventory: InventoryItem[]): void => safeSet(STORAGE_KEYS.INVENTORY, inventory),

  // Staff
  getStaff: (): StaffMember[] => safeGet<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF),
  saveStaff: (staff: StaffMember[]): void => safeSet(STORAGE_KEYS.STAFF, staff),

  // Financing Requests
  getFinancingRequests: (): FinancingRequest[] => safeGet<FinancingRequest[]>(STORAGE_KEYS.FINANCING_REQUESTS, []),
  saveFinancingRequests: (requests: FinancingRequest[]): void => safeSet(STORAGE_KEYS.FINANCING_REQUESTS, requests),

  // Transactions
  getTransactions: (): PaymentTransaction[] => safeGet<PaymentTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []),
  saveTransactions: (txs: PaymentTransaction[]): void => safeSet(STORAGE_KEYS.TRANSACTIONS, txs),
  addTransaction: (tx: PaymentTransaction): void => {
    const existing = StorageService.getTransactions();
    safeSet(STORAGE_KEYS.TRANSACTIONS, [tx, ...existing]);
  },

  // Reset to initial seed
  resetAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
};

