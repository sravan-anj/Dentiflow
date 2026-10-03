import { supabase } from './supabaseClient';
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
  PaymentTransaction,
  TreatmentCatalogueItem
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
  INITIAL_STAFF,
  INITIAL_TREATMENT_CATALOGUE
} from '../data/seedData';
import { mapProfileToUser } from './authService';

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
  INVOICES: 'dentiflow_invoices_v3',
  INVENTORY: 'dentiflow_inventory_v2',
  STAFF: 'dentiflow_staff_v2',
  FINANCING_REQUESTS: 'dentiflow_financing_requests_v2',
  TRANSACTIONS: 'dentiflow_transactions_v2',
  TREATMENT_CATALOGUE: 'dentiflow_treatment_catalogue_v2',
  CONSULTATION_FEE: 'dentiflow_consultation_fee_v1'
};

// Purge obsolete invoice cache
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('dentiflow_invoices_v2');
    localStorage.removeItem('dentiflow_invoices_v1');
  }
} catch (e) {}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {}
}

/**
 * StorageService: High-performance data layer connecting Dentiflow to Supabase PostgreSQL.
 * Provides instant optimistic local caching while synchronizing all mutations to Supabase.
 */
export const StorageService = {
  // -------------------------------------------------------------
  // Bulk Fetch from Supabase PostgreSQL
  // -------------------------------------------------------------
  fetchAllFromSupabase: async (): Promise<{
    patients: Patient[];
    appointments: Appointment[];
    toothFindings: ToothFinding[];
    treatmentPlans: TreatmentPlan[];
    clinicalNotes: ClinicalNote[];
    invoices: Invoice[];
    inventory: InventoryItem[];
    staff: StaffMember[];
    queue: QueueItem[];
    users: User[];
  }> => {
    try {
      const [
        pRes,
        aptRes,
        tfRes,
        planRes,
        cnRes,
        invRes,
        itemRes,
        staffRes,
        qRes,
        uRes
      ] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('appointments').select('*').order('date', { ascending: true }),
        supabase.from('tooth_findings').select('*'),
        supabase.from('treatment_plans').select('*'),
        supabase.from('clinical_notes').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('staff').select('*'),
        supabase.from('queue').select('*'),
        supabase.from('profiles').select('*')
      ]);

      const patients: Patient[] = (pRes.data && pRes.data.length > 0)
        ? pRes.data.map((p: any) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            age: p.age,
            gender: p.gender,
            phone: p.phone,
            email: p.email || '',
            address: p.address,
            emergencyContact: p.emergency_contact,
            bloodGroup: p.blood_group,
            medicalAlerts: p.medical_alerts || [],
            dentalHistorySummary: p.dental_history_summary,
            insuranceProvider: p.insurance_provider,
            insurancePolicyNumber: p.insurance_policy_number,
            balanceDue: Number(p.balance_due) || 0,
            lastVisitDate: p.last_visit_date,
            nextAppointmentDate: p.next_appointment_date,
            registeredDate: p.registered_date,
            avatarBg: p.avatar_bg
          }))
        : StorageService.getPatients();

      const appointments: Appointment[] = (aptRes.data && aptRes.data.length > 0)
        ? aptRes.data.map((a: any) => ({
            id: a.id,
            patientId: a.patient_id,
            patientName: a.patient_name,
            doctorName: a.doctor_name,
            doctorId: a.doctor_id || 'u-doctor',
            chair: a.chair,
            date: a.date,
            time: a.time,
            durationMinutes: a.duration_minutes || 30,
            procedure: a.procedure,
            status: a.status,
            notes: a.notes,
            tokenNumber: a.token_number
          }))
        : StorageService.getAppointments();

      const toothFindings: ToothFinding[] = (tfRes.data && tfRes.data.length > 0)
        ? tfRes.data.map((tf: any) => ({
            id: tf.id,
            patientId: tf.patient_id,
            toothNumber: tf.tooth_number,
            universalNumber: tf.universal_number,
            condition: tf.condition,
            surfaces: tf.surfaces || [],
            diagnosis: tf.diagnosis,
            recommendedTreatment: tf.recommended_treatment,
            estimatedCost: Number(tf.estimated_cost) || 0,
            doctorName: tf.doctor_name,
            date: tf.date,
            notes: tf.notes
          }))
        : StorageService.getToothFindings();

      const treatmentPlans: TreatmentPlan[] = (planRes.data && planRes.data.length > 0)
        ? planRes.data.map((tp: any) => ({
            id: tp.id,
            patientId: tp.patient_id,
            patientName: tp.patient_name,
            doctorName: tp.doctor_name,
            dateCreated: tp.date_created,
            status: tp.status,
            title: tp.title,
            phase: tp.phase,
            totalCost: Number(tp.total_cost) || 0,
            discount: Number(tp.discount) || 0,
            insuranceCovered: Number(tp.insurance_covered) || 0,
            patientPortion: Number(tp.patient_portion) || 0,
            procedures: tp.procedures || [],
            notes: tp.notes
          }))
        : StorageService.getTreatmentPlans();

      const clinicalNotes: ClinicalNote[] = (cnRes.data && cnRes.data.length > 0)
        ? cnRes.data.map((cn: any) => ({
            id: cn.id,
            patientId: cn.patient_id,
            patientName: cn.patient_name,
            doctorName: cn.doctor_name,
            date: cn.date,
            chiefComplaint: cn.chief_complaint,
            subjective: cn.subjective,
            objective: cn.objective,
            assessment: cn.assessment,
            plan: cn.plan,
            vitals: cn.vitals || {},
            toothNumbers: cn.tooth_numbers || [],
            toothNumber: cn.tooth_number,
            signed: cn.signed,
            isSigned: cn.is_signed,
            signatureDate: cn.signature_date,
            prescriptions: cn.prescriptions || []
          }))
        : StorageService.getClinicalNotes();

      const invoices: Invoice[] = (invRes.data && invRes.data.length > 0)
        ? invRes.data.map((i: any) => ({
            id: i.id,
            invoiceNumber: i.invoice_number,
            patientId: i.patient_id,
            patientName: i.patient_name,
            patientCode: i.patient_code,
            date: i.date,
            dueDate: i.due_date,
            items: i.items || [],
            description: i.description,
            subtotal: Number(i.subtotal) || 0,
            tax: Number(i.tax) || 0,
            discount: Number(i.discount) || 0,
            total: Number(i.total) || 0,
            amountPaid: Number(i.amount_paid) || 0,
            balanceDue: Number(i.balance_due) || 0,
            status: i.status,
            paymentMethod: i.payment_method
          }))
        : StorageService.getInvoices();

      const inventory: InventoryItem[] = (itemRes.data && itemRes.data.length > 0)
        ? itemRes.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            brand: item.brand,
            sku: item.sku,
            currentStock: item.current_stock,
            minThreshold: item.min_threshold,
            unit: item.unit,
            costPerUnit: Number(item.cost_per_unit) || 0,
            supplier: item.supplier,
            expiryDate: item.expiry_date,
            lastRestocked: item.last_restocked,
            location: item.location,
            status: item.status
          }))
        : StorageService.getInventory();

      const staff: StaffMember[] = (staffRes.data && staffRes.data.length > 0)
        ? staffRes.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            specialization: s.specialization,
            registrationNumber: s.registration_number,
            assignedChair: s.assigned_chair,
            availability: s.availability,
            email: s.email,
            phone: s.phone,
            activePatientsToday: s.active_patients_today,
            avatarText: s.avatar_text,
            status: s.status
          }))
        : StorageService.getStaff();

      const queue: QueueItem[] = (qRes.data && qRes.data.length > 0)
        ? qRes.data.map((q: any) => ({
            id: q.id,
            tokenNumber: q.token_number,
            patientId: q.patient_id,
            patientName: q.patient_name,
            patientPhone: q.patient_phone,
            doctorName: q.doctor_name,
            chair: q.chair,
            checkInTime: q.check_in_time,
            status: q.status,
            estimatedWaitMinutes: q.estimated_wait_minutes,
            procedure: q.procedure
          }))
        : StorageService.getQueue();

      const users: User[] = (uRes.data && uRes.data.length > 0)
        ? uRes.data.map(mapProfileToUser)
        : StorageService.getUsers();

      // Synchronize to cache for offline/instant initial renders
      safeSet(STORAGE_KEYS.PATIENTS, patients);
      safeSet(STORAGE_KEYS.APPOINTMENTS, appointments);
      safeSet(STORAGE_KEYS.TOOTH_FINDINGS, toothFindings);
      safeSet(STORAGE_KEYS.TREATMENT_PLANS, treatmentPlans);
      safeSet(STORAGE_KEYS.CLINICAL_NOTES, clinicalNotes);
      safeSet(STORAGE_KEYS.INVOICES, invoices);
      safeSet(STORAGE_KEYS.INVENTORY, inventory);
      safeSet(STORAGE_KEYS.STAFF, staff);
      safeSet(STORAGE_KEYS.QUEUE, queue);
      safeSet(STORAGE_KEYS.USERS, users);

      return {
        patients,
        appointments,
        toothFindings,
        treatmentPlans,
        clinicalNotes,
        invoices,
        inventory,
        staff,
        queue,
        users
      };
    } catch (err) {
      console.error('Failed to fetch datasets from Supabase, using cache fallback', err);
      return {
        patients: StorageService.getPatients(),
        appointments: StorageService.getAppointments(),
        toothFindings: StorageService.getToothFindings(),
        treatmentPlans: StorageService.getTreatmentPlans(),
        clinicalNotes: StorageService.getClinicalNotes(),
        invoices: StorageService.getInvoices(),
        inventory: StorageService.getInventory(),
        staff: StorageService.getStaff(),
        queue: StorageService.getQueue(),
        users: StorageService.getUsers()
      };
    }
  },

  // -------------------------------------------------------------
  // Users & Current Session
  // -------------------------------------------------------------
  getUsers: (): User[] => safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS),

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

    // Sync to Supabase profiles
    supabase.from('profiles').upsert({
      id: updatedUser.id,
      oralix_id: updatedUser.oralixId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar_text: updatedUser.avatarText,
      phone: updatedUser.phone,
      specialization: updatedUser.specialization,
      patient_id: updatedUser.patientId,
      department: updatedUser.department,
      license_number: updatedUser.licenseNumber,
      bio: updatedUser.bio,
      status: updatedUser.status || 'active',
      address: updatedUser.address,
      emergency_contact: updatedUser.emergencyContact
    }).then();

    const current = StorageService.getCurrentUser();
    if (current && current.id === updatedUser.id) {
      safeSet(STORAGE_KEYS.CURRENT_USER, updatedUser);
    }
  },

  getCurrentUser: (): User | null => safeGet<User | null>(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User | null): void => safeSet(STORAGE_KEYS.CURRENT_USER, user),
  saveCurrentUser: (user: User | null): void => safeSet(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    supabase.auth.signOut().catch(() => {});
  },

  // -------------------------------------------------------------
  // Patients
  // -------------------------------------------------------------
  getPatients: (): Patient[] => safeGet<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS),

  savePatients: (patients: Patient[]): void => {
    safeSet(STORAGE_KEYS.PATIENTS, patients);
    // Asynchronously upsert to Supabase
    const rows = patients.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      address: p.address,
      emergency_contact: p.emergencyContact,
      blood_group: p.bloodGroup,
      medical_alerts: p.medicalAlerts || [],
      dental_history_summary: p.dentalHistorySummary,
      insurance_provider: p.insuranceProvider,
      insurance_policy_number: p.insurancePolicyNumber,
      balance_due: p.balanceDue,
      last_visit_date: p.lastVisitDate,
      next_appointment_date: p.nextAppointmentDate,
      registered_date: p.registeredDate,
      avatar_bg: p.avatarBg
    }));
    supabase.from('patients').upsert(rows).then();
  },

  updatePatient: (patient: Patient): void => {
    const list = StorageService.getPatients();
    const updated = list.map(p => (p.id === patient.id ? patient : p));
    StorageService.savePatients(updated);
  },

  // -------------------------------------------------------------
  // Appointments
  // -------------------------------------------------------------
  getAppointments: (): Appointment[] => safeGet<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS),

  saveAppointments: (appointments: Appointment[]): void => {
    safeSet(STORAGE_KEYS.APPOINTMENTS, appointments);
    const rows = appointments.map(a => ({
      id: a.id,
      patient_id: a.patientId,
      patient_name: a.patientName,
      doctor_name: a.doctorName,
      doctor_id: a.doctorId || 'u-doctor',
      chair: a.chair,
      date: a.date,
      time: a.time,
      duration_minutes: a.durationMinutes || 30,
      procedure: a.procedure,
      status: a.status,
      notes: a.notes,
      token_number: a.tokenNumber
    }));
    supabase.from('appointments').upsert(rows).then();
  },

  addAppointment: async (appointment: Appointment): Promise<void> => {
    const existing = StorageService.getAppointments();
    const updated = [appointment, ...existing];
    safeSet(STORAGE_KEYS.APPOINTMENTS, updated);

    await supabase.from('appointments').insert({
      id: appointment.id,
      patient_id: appointment.patientId,
      patient_name: appointment.patientName,
      doctor_name: appointment.doctorName,
      doctor_id: appointment.doctorId || 'u-doctor',
      chair: appointment.chair,
      date: appointment.date,
      time: appointment.time,
      duration_minutes: appointment.durationMinutes || 30,
      procedure: appointment.procedure,
      status: appointment.status,
      notes: appointment.notes,
      token_number: appointment.tokenNumber
    });
  },

  // -------------------------------------------------------------
  // Tooth Findings
  // -------------------------------------------------------------
  getToothFindings: (): ToothFinding[] => safeGet<ToothFinding[]>(STORAGE_KEYS.TOOTH_FINDINGS, INITIAL_TOOTH_FINDINGS),

  saveToothFindings: (findings: ToothFinding[]): void => {
    safeSet(STORAGE_KEYS.TOOTH_FINDINGS, findings);
    const rows = findings.map(tf => ({
      id: tf.id,
      patient_id: tf.patientId,
      tooth_number: tf.toothNumber,
      universal_number: tf.universalNumber,
      condition: tf.condition,
      surfaces: tf.surfaces || [],
      diagnosis: tf.diagnosis,
      recommended_treatment: tf.recommendedTreatment,
      estimated_cost: tf.estimatedCost,
      doctor_name: tf.doctorName,
      date: tf.date,
      notes: tf.notes
    }));
    supabase.from('tooth_findings').upsert(rows).then();
  },

  // -------------------------------------------------------------
  // Queue
  // -------------------------------------------------------------
  getQueue: (): QueueItem[] => safeGet<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE),

  saveQueue: (queue: QueueItem[]): void => {
    safeSet(STORAGE_KEYS.QUEUE, queue);
    const rows = queue.map(q => ({
      id: q.id,
      token_number: q.tokenNumber,
      patient_id: q.patientId,
      patient_name: q.patientName,
      patient_phone: q.patientPhone,
      doctor_name: q.doctorName,
      chair: q.chair,
      check_in_time: q.checkInTime,
      status: q.status,
      estimated_wait_minutes: q.estimatedWaitMinutes,
      procedure: q.procedure
    }));
    supabase.from('queue').upsert(rows).then();
  },

  // -------------------------------------------------------------
  // Treatment Plans
  // -------------------------------------------------------------
  getTreatmentPlans: (): TreatmentPlan[] => safeGet<TreatmentPlan[]>(STORAGE_KEYS.TREATMENT_PLANS, INITIAL_TREATMENT_PLANS),

  saveTreatmentPlans: (plans: TreatmentPlan[]): void => {
    safeSet(STORAGE_KEYS.TREATMENT_PLANS, plans);
    const rows = plans.map(tp => ({
      id: tp.id,
      patient_id: tp.patientId,
      patient_name: tp.patientName,
      doctor_name: tp.doctorName,
      date_created: tp.dateCreated,
      status: tp.status,
      title: tp.title,
      phase: tp.phase,
      total_cost: tp.totalCost,
      discount: tp.discount,
      insurance_covered: tp.insuranceCovered,
      patient_portion: tp.patientPortion,
      procedures: tp.procedures || [],
      notes: tp.notes
    }));
    supabase.from('treatment_plans').upsert(rows).then();
  },

  // -------------------------------------------------------------
  // Master Treatment Catalogue
  // -------------------------------------------------------------
  getTreatmentCatalogue: (): TreatmentCatalogueItem[] =>
    safeGet<TreatmentCatalogueItem[]>(STORAGE_KEYS.TREATMENT_CATALOGUE, INITIAL_TREATMENT_CATALOGUE),

  saveTreatmentCatalogue: (items: TreatmentCatalogueItem[]): void => {
    safeSet(STORAGE_KEYS.TREATMENT_CATALOGUE, items);
    const rows = items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category || 'General',
      description: item.description || '',
      code: item.code || '',
      updated_at: new Date().toISOString()
    }));
    supabase.from('treatment_catalogue').upsert(rows).then();
  },

  getConsultationFee: (): number => safeGet<number>(STORAGE_KEYS.CONSULTATION_FEE, 500),

  saveConsultationFee: (fee: number): void => {
    safeSet(STORAGE_KEYS.CONSULTATION_FEE, Math.max(0, Math.round(fee)));
  },

  // -------------------------------------------------------------
  // Clinical Notes
  // -------------------------------------------------------------
  getClinicalNotes: (): ClinicalNote[] => safeGet<ClinicalNote[]>(STORAGE_KEYS.CLINICAL_NOTES, INITIAL_CLINICAL_NOTES),

  saveClinicalNotes: (notes: ClinicalNote[]): void => {
    safeSet(STORAGE_KEYS.CLINICAL_NOTES, notes);
    const rows = notes.map(cn => ({
      id: cn.id,
      patient_id: cn.patientId,
      patient_name: cn.patientName,
      doctor_name: cn.doctorName,
      date: cn.date,
      chief_complaint: cn.chiefComplaint,
      subjective: cn.subjective,
      objective: cn.objective,
      assessment: cn.assessment,
      plan: cn.plan,
      vitals: cn.vitals || {},
      tooth_numbers: cn.toothNumbers || [],
      tooth_number: cn.toothNumber,
      signed: cn.signed,
      is_signed: cn.isSigned,
      signature_date: cn.signatureDate,
      prescriptions: cn.prescriptions || []
    }));
    supabase.from('clinical_notes').upsert(rows).then();
  },

  // -------------------------------------------------------------
  // Prescriptions
  // -------------------------------------------------------------
  getPrescriptions: (): Prescription[] => safeGet<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS),

  savePrescriptions: (prescriptions: Prescription[]): void => {
    safeSet(STORAGE_KEYS.PRESCRIPTIONS, prescriptions);
    const rows = prescriptions.map(rx => ({
      id: rx.id,
      patient_id: rx.patientId,
      patient_name: rx.patientName,
      patient_age: rx.patientAge,
      doctor_name: rx.doctorName,
      date: rx.date,
      diagnosis: rx.diagnosis,
      items: rx.items || [],
      instructions: rx.instructions
    }));
    supabase.from('prescriptions').upsert(rows).then();
  },

  // -------------------------------------------------------------
  // Invoices
  // -------------------------------------------------------------
  getInvoices: (): Invoice[] => {
    const list = safeGet<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_INVOICES;
  },

  saveInvoices: (invoices: Invoice[]): void => {
    safeSet(STORAGE_KEYS.INVOICES, invoices);
    const rows = invoices.map(i => ({
      id: i.id,
      invoice_number: i.invoiceNumber,
      patient_id: i.patientId,
      patient_name: i.patientName,
      patient_code: i.patientCode,
      date: i.date,
      due_date: i.dueDate,
      items: i.items || [],
      description: i.description,
      subtotal: i.subtotal,
      tax: i.tax,
      discount: i.discount,
      total: i.total || i.totalAmount,
      total_amount: i.totalAmount || i.total,
      amount_paid: i.amountPaid,
      balance_due: i.balanceDue,
      status: i.status,
      payment_method: i.paymentMethod
    }));
    supabase.from('invoices').upsert(rows).then();
  },

  deleteInvoice: (invoiceId: string): void => {
    const current = StorageService.getInvoices();
    const updated = current.filter(i => i.id !== invoiceId);
    safeSet(STORAGE_KEYS.INVOICES, updated);
    supabase.from('invoices').delete().eq('id', invoiceId).then();
  },

  // -------------------------------------------------------------
  // Inventory
  // -------------------------------------------------------------
  getInventory: (): InventoryItem[] => safeGet<InventoryItem[]>(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY),

  saveInventory: (inventory: InventoryItem[]): void => {
    safeSet(STORAGE_KEYS.INVENTORY, inventory);
    const rows = inventory.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      sku: item.sku,
      current_stock: item.currentStock || item.quantity,
      min_threshold: item.minThreshold,
      unit: item.unit,
      cost_per_unit: item.costPerUnit,
      supplier: item.supplier,
      expiry_date: item.expiryDate,
      last_restocked: item.lastRestocked,
      location: item.location,
      status: item.status
    }));
    supabase.from('inventory').upsert(rows).then();
  },

  // -------------------------------------------------------------
  // Staff
  // -------------------------------------------------------------
  getStaff: (): StaffMember[] => safeGet<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF),

  saveStaff: (staff: StaffMember[]): void => {
    safeSet(STORAGE_KEYS.STAFF, staff);
    const rows = staff.map(s => ({
      id: s.id,
      name: s.name,
      role: s.role,
      specialization: s.specialization || s.specialty,
      registration_number: s.registrationNumber || s.licenseNumber,
      assigned_chair: s.assignedChair || s.chairAssigned,
      availability: s.availability || s.schedule,
      email: s.email,
      phone: s.phone,
      active_patients_today: s.activePatientsToday,
      avatar_text: s.avatarText,
      status: s.status || 'active'
    }));
    supabase.from('staff').upsert(rows).then();
  },

  // -------------------------------------------------------------
  // Financing Requests
  // -------------------------------------------------------------
  getFinancingRequests: (): FinancingRequest[] => safeGet<FinancingRequest[]>(STORAGE_KEYS.FINANCING_REQUESTS, []),

  saveFinancingRequests: (requests: FinancingRequest[]): void => {
    safeSet(STORAGE_KEYS.FINANCING_REQUESTS, requests);
    const rows = requests.map(r => ({
      id: r.id,
      patient_id: r.patientId,
      patient_name: r.patientName,
      treatment_plan_id: r.treatmentPlanId,
      requested_amount: r.requestedAmount,
      tenure_months: r.tenureMonths,
      monthly_installment: r.monthlyInstallment,
      status: r.status,
      submitted_date: r.submittedDate,
      employment_status: r.employmentStatus,
      notes: r.notes
    }));
    supabase.from('financing_requests').upsert(rows).then();
  },

  // -------------------------------------------------------------
  // Transactions
  // -------------------------------------------------------------
  getTransactions: (): PaymentTransaction[] => safeGet<PaymentTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []),

  saveTransactions: (txs: PaymentTransaction[]): void => {
    safeSet(STORAGE_KEYS.TRANSACTIONS, txs);
    const rows = txs.map(t => ({
      id: t.id,
      invoice_id: t.invoiceId,
      invoice_number: t.invoiceNumber,
      patient_id: t.patientId,
      patient_name: t.patientName,
      amount: t.amount,
      payment_method: t.paymentMethod,
      transaction_ref: t.transactionRef,
      status: t.status,
      timestamp: t.timestamp,
      gateway_response: t.gatewayResponse || {}
    }));
    supabase.from('payment_transactions').upsert(rows).then();
  },

  addTransaction: (tx: PaymentTransaction): void => {
    const existing = StorageService.getTransactions();
    safeSet(STORAGE_KEYS.TRANSACTIONS, [tx, ...existing]);

    supabase.from('payment_transactions').insert({
      id: tx.id,
      invoice_id: tx.invoiceId,
      invoice_number: tx.invoiceNumber,
      patient_id: tx.patientId,
      patient_name: tx.patientName,
      amount: tx.amount,
      payment_method: tx.paymentMethod,
      transaction_ref: tx.transactionRef,
      status: tx.status,
      timestamp: tx.timestamp,
      gateway_response: tx.gatewayResponse || {}
    }).then();
  },

  // Reset to initial seed
  resetAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    supabase.auth.signOut().catch(() => {});
  }
};
