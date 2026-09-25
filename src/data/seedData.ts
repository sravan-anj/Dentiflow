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
  User
} from '../types';
import { hashPassword } from '../utils/authService';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-doctor',
    oralixId: 'dr.ananya@oralix.com',
    name: 'Dr. Ananya Sharma',
    email: 'doctor@gmail.com',
    role: 'doctor',
    passwordHash: hashPassword('doctor123'),
    avatarText: 'DR',
    specialization: 'Endodontics & Restorative',
    phone: '+91 98450 11223',
    status: 'active',
    createdAt: '2026-01-15'
  },
  {
    id: 'u-patient',
    oralixId: 'aravind@oralix.com',
    name: 'Aravind Kumar',
    email: 'patient@gmail.com',
    role: 'patient',
    passwordHash: hashPassword('patient123'),
    avatarText: 'AK',
    patientId: 'p-1',
    phone: '+91 98765 43210',
    status: 'active',
    createdAt: '2026-02-01'
  },
  {
    id: 'u-admin',
    oralixId: 'admin@oralix.com',
    name: 'Clinic Administrator',
    email: 'admin@gmail.com',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
    avatarText: 'AD',
    phone: '+91 99000 88776',
    status: 'active',
    createdAt: '2026-01-01'
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p-1',
    code: 'DF-2026-001',
    name: 'Aravind Kumar',
    age: 34,
    gender: 'Male',
    phone: '+91 98765 43210',
    email: 'aravind.k@example.com',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bangalore',
    emergencyContact: 'Deepa Kumar (Spouse) - +91 98765 43211',
    bloodGroup: 'B+',
    medicalAlerts: ['Penicillin Allergy', 'Mild Asthmatic'],
    dentalHistorySummary: 'History of sensitivity on right molars; past root canal on 46.',
    insuranceProvider: 'Star Health Dental Shield',
    insurancePolicyNumber: 'SH-DNT-88921',
    balanceDue: 13000,
    lastVisitDate: '2026-09-12',
    nextAppointmentDate: '2026-09-19'
  },
  {
    id: 'p-2',
    code: 'DF-2026-002',
    name: 'Vishal Rao',
    age: 28,
    gender: 'Male',
    phone: '+91 98112 34567',
    email: 'vishal.rao@example.com',
    address: '12th Main, Indiranagar, Bangalore',
    emergencyContact: 'Suman Rao (Father) - +91 98112 34568',
    bloodGroup: 'O+',
    medicalAlerts: ['No Known Drug Allergies'],
    dentalHistorySummary: 'Orthodontic retainer check; minor interproximal plaque accumulation.',
    insuranceProvider: 'HDFC ERGO Health',
    insurancePolicyNumber: 'HDF-90182-DEN',
    balanceDue: 0,
    lastVisitDate: '2026-09-15',
    nextAppointmentDate: '2026-09-22'
  },
  {
    id: 'p-3',
    code: 'DF-2026-003',
    name: 'Medha Nair',
    age: 42,
    gender: 'Female',
    phone: '+91 99450 78912',
    email: 'medha.nair@example.com',
    address: 'Prestige Ozone, Whitefield, Bangalore',
    emergencyContact: 'Rohan Nair (Husband) - +91 99450 78913',
    bloodGroup: 'A+',
    medicalAlerts: ['Hypertension (managed on Amlodipine 5mg)'],
    dentalHistorySummary: 'Deep pocketing around 36 and 37; crowns placed 2 years ago.',
    insuranceProvider: 'ICICI Lombard Care',
    insurancePolicyNumber: 'IC-MED-44120',
    balanceDue: 12500,
    lastVisitDate: '2026-09-08',
    nextAppointmentDate: '2026-09-19'
  },
  {
    id: 'p-4',
    code: 'DF-2026-004',
    name: 'Lokesh Iyer',
    age: 51,
    gender: 'Male',
    phone: '+91 97312 90123',
    email: 'lokesh.iyer@example.com',
    address: 'Jayanagar 4th Block, Bangalore',
    emergencyContact: 'Vani Iyer (Spouse) - +91 97312 90124',
    bloodGroup: 'AB+',
    medicalAlerts: ['Type II Diabetes (HbA1c 6.8)', 'Aspirin Therapy'],
    dentalHistorySummary: 'Missing teeth 18, 28, 38; recurrent food lodgement lower left.',
    insuranceProvider: 'Care Health Insurance',
    insurancePolicyNumber: 'CHI-DEN-65510',
    balanceDue: 8200,
    lastVisitDate: '2026-09-01',
    nextAppointmentDate: '2026-09-20'
  },
  {
    id: 'p-5',
    code: 'DF-2026-005',
    name: 'Ashwini Goud',
    age: 24,
    gender: 'Female',
    phone: '+91 98860 12345',
    email: 'ashwini.goud@example.com',
    address: 'Koramangala 5th Block, Bangalore',
    emergencyContact: 'Sunil Goud (Brother) - +91 98860 12346',
    bloodGroup: 'O-',
    medicalAlerts: ['Latex Sensitivity'],
    dentalHistorySummary: 'Invisalign clear aligner treatment underway; tracking refinement scan.',
    insuranceProvider: 'Max Bupa Health',
    insurancePolicyNumber: 'MB-DENT-11239',
    balanceDue: 24500,
    lastVisitDate: '2026-09-18',
    nextAppointmentDate: '2026-09-25'
  }
];

export const INITIAL_TOOTH_FINDINGS: ToothFinding[] = [
  {
    id: 'tf-1',
    patientId: 'p-1',
    toothNumber: 16,
    universalNumber: 3,
    condition: 'cavity',
    surfaces: ['occlusal', 'mesial'],
    diagnosis: 'Deep occlusal caries with percussion sensitivity. Pulp involvement suspected.',
    recommendedTreatment: 'Single-sitting RCT with Zirconia Crown',
    estimatedCost: 15500,
    doctorName: 'Dr. Ananya Sharma',
    date: '2026-09-12'
  },
  {
    id: 'tf-2',
    patientId: 'p-1',
    toothNumber: 21,
    universalNumber: 9,
    condition: 'filling',
    surfaces: ['mesial'],
    diagnosis: 'Class III Composite restoration intact and well-adapted.',
    recommendedTreatment: 'Annual observation',
    estimatedCost: 0,
    doctorName: 'Dr. Ananya Sharma',
    date: '2026-09-12'
  },
  {
    id: 'tf-3',
    patientId: 'p-1',
    toothNumber: 46,
    universalNumber: 30,
    condition: 'root_canal',
    surfaces: ['occlusal'],
    diagnosis: 'Obturated root canal with porcelain-fused-to-metal (PFM) crown.',
    recommendedTreatment: 'Marginal integrity intact',
    estimatedCost: 0,
    doctorName: 'Dr. Ananya Sharma',
    date: '2026-08-10'
  },
  {
    id: 'tf-4',
    patientId: 'p-1',
    toothNumber: 18,
    universalNumber: 1,
    condition: 'missing',
    surfaces: [],
    diagnosis: 'Surgically extracted due to third molar impaction.',
    recommendedTreatment: 'Healed socket',
    estimatedCost: 0,
    doctorName: 'Dr. Vikram Mehta',
    date: '2025-11-20'
  },
  {
    id: 'tf-5',
    patientId: 'p-1',
    toothNumber: 26,
    universalNumber: 14,
    condition: 'watch',
    surfaces: ['occlusal'],
    diagnosis: 'Incipient enamel demineralization in central fissure pit.',
    recommendedTreatment: 'Fluoride varnish & sealant application',
    estimatedCost: 1800,
    doctorName: 'Dr. Ananya Sharma',
    date: '2026-09-12'
  },
  {
    id: 'tf-6',
    patientId: 'p-1',
    toothNumber: 36,
    universalNumber: 19,
    condition: 'crown',
    surfaces: ['occlusal', 'buccal', 'lingual'],
    diagnosis: 'Monolithic Zirconia crown in good occlusion.',
    recommendedTreatment: 'Routine hygiene maintenance',
    estimatedCost: 0,
    doctorName: 'Dr. Priya Sen',
    date: '2026-03-14'
  },
  {
    id: 'tf-7',
    patientId: 'p-1',
    toothNumber: 24,
    universalNumber: 12,
    condition: 'implant',
    surfaces: ['occlusal'],
    diagnosis: 'Titanium dental implant fixture with screw-retained ceramic crown.',
    recommendedTreatment: 'Stable peri-implant bone levels',
    estimatedCost: 0,
    doctorName: 'Dr. Vikram Mehta',
    date: '2025-06-22'
  },
  {
    id: 'tf-8',
    patientId: 'p-1',
    toothNumber: 48,
    universalNumber: 32,
    condition: 'watch',
    surfaces: [],
    diagnosis: 'Mesioangular partially erupted third molar with mild operculitis.',
    recommendedTreatment: 'Operculectomy or surgical disimpaction',
    estimatedCost: 6500,
    doctorName: 'Dr. Vikram Mehta',
    date: '2026-09-12'
  },

  // Patient 3 - Medha Nair
  {
    id: 'tf-9',
    patientId: 'p-3',
    toothNumber: 36,
    universalNumber: 19,
    condition: 'cavity',
    surfaces: ['distal', 'occlusal'],
    diagnosis: 'Secondary caries underneath distal margin of existing restoration.',
    recommendedTreatment: 'Crown removal and endodontic re-treatment',
    estimatedCost: 18000,
    doctorName: 'Dr. Ananya Sharma',
    date: '2026-09-08'
  },
  {
    id: 'tf-10',
    patientId: 'p-3',
    toothNumber: 11,
    universalNumber: 8,
    condition: 'crown',
    surfaces: ['buccal', 'lingual'],
    diagnosis: 'E-max aesthetic veneer restoration in anterior sextant.',
    recommendedTreatment: 'Polishing and shade matching check',
    estimatedCost: 0,
    doctorName: 'Dr. Priya Sen',
    date: '2026-01-15'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'p-1',
    patientName: 'Aravind Kumar',
    doctorName: 'Dr. Ananya Sharma',
    doctorId: 'u-doctor',
    chair: 'Chair 1 - Endodontics',
    date: '2026-09-19',
    time: '10:00 AM',
    durationMinutes: 45,
    procedure: 'Tooth #16 Root Canal Preparation',
    status: 'in_chair',
    tokenNumber: '#D-101',
    notes: 'Penicillin allergy noted; use Clindamycin if antibiotic required.'
  },
  {
    id: 'apt-2',
    patientId: 'p-3',
    patientName: 'Medha Nair',
    doctorName: 'Dr. Vikram Mehta',
    doctorId: 'u-vikram',
    chair: 'Chair 2 - Surgery',
    date: '2026-09-19',
    time: '11:00 AM',
    durationMinutes: 60,
    procedure: 'Crown Margin Evaluation & Re-treatment Consultation',
    status: 'confirmed',
    tokenNumber: '#D-102',
    notes: 'Hypertensive; check BP prior to local anesthetic administration.'
  },
  {
    id: 'apt-3',
    patientId: 'p-2',
    patientName: 'Vishal Rao',
    doctorName: 'Dr. Priya Sen',
    doctorId: 'u-priya',
    chair: 'Chair 3 - Aesthetics & Hygiene',
    date: '2026-09-19',
    time: '11:30 AM',
    durationMinutes: 30,
    procedure: 'Full Mouth Ultrasonic Scaling & Polish',
    status: 'confirmed',
    tokenNumber: '#D-103',
    notes: 'Routine 6-month preventive recall.'
  },
  {
    id: 'apt-4',
    patientId: 'p-4',
    patientName: 'Lokesh Iyer',
    doctorName: 'Dr. Vikram Mehta',
    doctorId: 'u-vikram',
    chair: 'Chair 2 - Surgery',
    date: '2026-09-19',
    time: '02:00 PM',
    durationMinutes: 45,
    procedure: 'Tooth #48 Surgical Disimpaction Workup',
    status: 'confirmed',
    tokenNumber: '#D-104',
    notes: 'Diabetic; morning blood glucose was 118 mg/dL.'
  },
  {
    id: 'apt-5',
    patientId: 'p-5',
    patientName: 'Ashwini Goud',
    doctorName: 'Dr. Priya Sen',
    doctorId: 'u-priya',
    chair: 'Chair 3 - Aesthetics & Hygiene',
    date: '2026-09-19',
    time: '03:15 PM',
    durationMinutes: 30,
    procedure: 'Aligner Tray #14 Delivery & Attachments Check',
    status: 'confirmed',
    tokenNumber: '#D-105',
    notes: 'Check compliance with wear timer.'
  },
  {
    id: 'apt-6',
    patientId: 'p-1',
    patientName: 'Aravind Kumar',
    doctorName: 'Dr. Ananya Sharma',
    doctorId: 'u-doctor',
    chair: 'Chair 1 - Endodontics',
    date: '2026-09-12',
    time: '04:00 PM',
    durationMinutes: 45,
    procedure: 'Initial Emergency Diagnostic & Pulp Testing',
    status: 'completed',
    tokenNumber: '#D-092'
  }
];

export const INITIAL_QUEUE: QueueItem[] = [
  {
    id: 'q-1',
    tokenNumber: '#D-101',
    patientId: 'p-1',
    patientName: 'Aravind Kumar',
    patientPhone: '+91 98765 43210',
    doctorName: 'Dr. Ananya Sharma',
    chair: 'Chair 1',
    checkInTime: '09:50 AM',
    status: 'in_chair',
    estimatedWaitMinutes: 0,
    procedure: 'Tooth #16 Root Canal'
  },
  {
    id: 'q-2',
    tokenNumber: '#D-102',
    patientId: 'p-3',
    patientName: 'Medha Nair',
    patientPhone: '+91 99450 78912',
    doctorName: 'Dr. Vikram Mehta',
    chair: 'Chair 2',
    checkInTime: '10:45 AM',
    status: 'waiting',
    estimatedWaitMinutes: 15,
    procedure: 'Evaluation & Re-treatment'
  },
  {
    id: 'q-3',
    tokenNumber: '#D-103',
    patientId: 'p-2',
    patientName: 'Vishal Rao',
    patientPhone: '+91 98112 34567',
    doctorName: 'Dr. Priya Sen',
    chair: 'Chair 3',
    checkInTime: '11:10 AM',
    status: 'waiting',
    estimatedWaitMinutes: 20,
    procedure: 'Ultrasonic Scaling'
  }
];

export const INITIAL_TREATMENT_PLANS: TreatmentPlan[] = [
  {
    id: 'plan-1',
    patientId: 'p-1',
    patientName: 'Aravind Kumar',
    doctorName: 'Dr. Ananya Sharma',
    dateCreated: '2026-09-12',
    status: 'in_progress',
    title: 'Maxillary Right Quadrant Comprehensive Rehabilitation',
    phase: 'Phase 1: Relief & Endodontic Care',
    totalCost: 23800,
    discount: 2000,
    insuranceCovered: 12000,
    patientPortion: 9800,
    notes: 'Prioritize pain alleviation on #16. Post-core and Zirconia crown after root canal obturation.',
    procedures: [
      {
        id: 'proc-1',
        toothNumber: 16,
        code: 'D3330',
        name: 'Molar Endodontic Therapy (Root Canal)',
        fee: 9500,
        status: 'in_progress'
      },
      {
        id: 'proc-2',
        toothNumber: 16,
        code: 'D2950',
        name: 'Core Buildup & Fiber Post',
        fee: 3800,
        status: 'pending'
      },
      {
        id: 'proc-3',
        toothNumber: 16,
        code: 'D2740',
        name: 'Monolithic Zirconia Crown',
        fee: 8500,
        status: 'pending'
      },
      {
        id: 'proc-4',
        toothNumber: 26,
        code: 'D1351',
        name: 'Preventive Pit & Fissure Sealant',
        fee: 2000,
        status: 'pending'
      }
    ]
  },
  {
    id: 'plan-2',
    patientId: 'p-3',
    patientName: 'Medha Nair',
    doctorName: 'Dr. Vikram Mehta',
    dateCreated: '2026-09-08',
    status: 'proposed',
    title: 'Mandibular Left Sector Crown Margin Restoration',
    phase: 'Phase 2: Restorative Revision',
    totalCost: 19500,
    discount: 1500,
    insuranceCovered: 10000,
    patientPortion: 8000,
    notes: 'Address distal recurrent caries on tooth #36.',
    procedures: [
      {
        id: 'proc-5',
        toothNumber: 36,
        code: 'D2980',
        name: 'Crown Removal & Caries Excavation',
        fee: 3000,
        status: 'pending'
      },
      {
        id: 'proc-6',
        toothNumber: 36,
        code: 'D3348',
        name: 'Retreatment of Previous Root Canal',
        fee: 7500,
        status: 'pending'
      },
      {
        id: 'proc-7',
        toothNumber: 36,
        code: 'D2750',
        name: 'Crown Porcelain-Fused-to-High Noble Metal',
        fee: 9000,
        status: 'pending'
      }
    ]
  }
];

export const INITIAL_CLINICAL_NOTES: ClinicalNote[] = [
  {
    id: 'cn-1',
    patientId: 'p-1',
    patientName: 'Aravind Kumar',
    doctorName: 'Dr. Ananya Sharma',
    date: '2026-09-12',
    subjective: 'Patient reports severe throbbing pain in upper right quadrant for 3 days, exacerbated by cold and lying down at night.',
    objective: 'Tooth #16 exhibits deep disto-occlusal cavitated lesion. Positive response to percussion; lingering cold sensation (>30s). Periapical radiograph indicates early PDL widening on mesiobuccal root.',
    assessment: 'Symptomatic Irreversible Pulpitis with Symptomatic Apical Periodontitis (#16).',
    plan: 'Initiated root canal therapy. Local anesthesia administered (Lignocaine 2% with 1:80k Epi). Access cavity prepared, working lengths established (MB: 21mm, DB: 20.5mm, P: 22mm). Canal biomechanical prep up to size 25/04. Calcium hydroxide paste placed as intracanal medicament. Cavit temporary dressing.',
    vitals: {
      bp: '122/80 mmHg',
      pulse: '74 bpm',
      bloodSugar: '104 mg/dL'
    },
    toothNumbers: [16],
    signed: true,
    signatureDate: '2026-09-12 17:30'
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-1',
    patientId: 'p-1',
    patientName: 'Aravind Kumar',
    patientAge: 34,
    doctorName: 'Dr. Ananya Sharma',
    date: '2026-09-12',
    diagnosis: 'Acute Periapical Periodontitis & Post-Endodontic Instrumentation',
    items: [
      {
        drugName: 'Amoxicillin + Potassium Clavulanate (Augmentin)',
        dosage: '625 mg Tablet',
        frequency: 'Twice daily (BD)',
        duration: '5 days',
        instructions: 'Take immediately after meals'
      },
      {
        drugName: 'Aceclofenac + Paracetamol (Zerodol-P)',
        dosage: '100mg / 325mg',
        frequency: 'Twice daily (BD) SOS for pain',
        duration: '3 days',
        instructions: 'Take with full glass of water after food'
      },
      {
        drugName: 'Chlorhexidine Gluconate 0.2% Oral Rinse',
        dosage: '10 ml',
        frequency: 'Twice daily (BD)',
        duration: '7 days',
        instructions: 'Swish vigorously for 60 seconds, do not rinse with water for 30 mins'
      }
    ],
    instructions: 'Avoid biting on the right side while temporary dressing is in place. Contact clinic immediately if facial swelling or fever develops.'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'DF-INV-2026-042',
    patientId: 'p-1',
    patientName: 'Aravind Kumar',
    patientCode: 'DF-2026-001',
    date: '2026-09-12',
    dueDate: '2026-09-26',
    items: [
      {
        description: 'Comprehensive Oral Evaluation (D0150)',
        code: 'D0150',
        quantity: 1,
        unitPrice: 800,
        total: 800
      },
      {
        description: 'Digital Intraoral Periapical X-Ray (RVG)',
        code: 'D0220',
        quantity: 2,
        unitPrice: 350,
        total: 700
      },
      {
        description: 'Molar Root Canal Therapy - Part 1 (D3330)',
        code: 'D3330',
        tooth: 16,
        quantity: 1,
        unitPrice: 5000,
        total: 5000
      }
    ],
    subtotal: 6500,
    tax: 0,
    discount: 500,
    total: 6000,
    amountPaid: 1500,
    balanceDue: 4500,
    status: 'partial',
    paymentMethod: 'UPI'
  },
  {
    id: 'inv-4',
    invoiceNumber: 'DF-INV-2026-045',
    patientId: 'p-1',
    patientName: 'Aravind Kumar',
    patientCode: 'DF-2026-001',
    date: '2026-09-18',
    dueDate: '2026-10-02',
    items: [
      {
        description: 'Monolithic Zirconia Crown - Tooth #16 (D2740)',
        code: 'D2740',
        tooth: 16,
        quantity: 1,
        unitPrice: 8500,
        total: 8500
      },
      {
        description: 'Core Buildup & Fiber Post Placement (D2950)',
        code: 'D2950',
        tooth: 16,
        quantity: 1,
        unitPrice: 3800,
        total: 3800
      }
    ],
    subtotal: 12300,
    tax: 0,
    discount: 800,
    total: 11500,
    amountPaid: 3000,
    balanceDue: 8500,
    status: 'partial',
    paymentMethod: 'Card / POS'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'DF-INV-2026-039',
    patientId: 'p-2',
    patientName: 'Vishal Rao',
    patientCode: 'DF-2026-002',
    date: '2026-09-10',
    dueDate: '2026-09-10',
    items: [
      {
        description: 'Preventive Dental Prophylaxis & Scaling (D1110)',
        code: 'D1110',
        quantity: 1,
        unitPrice: 2200,
        total: 2200
      },
      {
        description: 'Fluoride Topical Gel Application (D1206)',
        code: 'D1206',
        quantity: 1,
        unitPrice: 800,
        total: 800
      }
    ],
    subtotal: 3000,
    tax: 0,
    discount: 0,
    total: 3000,
    amountPaid: 3000,
    balanceDue: 0,
    status: 'paid',
    paymentMethod: 'Card / POS'
  },
  {
    id: 'inv-3',
    invoiceNumber: 'DF-INV-2026-041',
    patientId: 'p-3',
    patientName: 'Medha Nair',
    patientCode: 'DF-2026-003',
    date: '2026-09-08',
    dueDate: '2026-09-22',
    items: [
      {
        description: 'Consultation & Clinical Photography',
        code: 'D0140',
        quantity: 1,
        unitPrice: 1000,
        total: 1000
      },
      {
        description: 'OPG Panoramic Dental Radiograph',
        code: 'D0330',
        quantity: 1,
        unitPrice: 1500,
        total: 1500
      },
      {
        description: 'Crown Removal & Diagnostic Exploration',
        code: 'D2980',
        tooth: 36,
        quantity: 1,
        unitPrice: 10000,
        total: 10000
      }
    ],
    subtotal: 12500,
    tax: 0,
    discount: 0,
    total: 12500,
    amountPaid: 0,
    balanceDue: 12500,
    status: 'unpaid'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-item-1',
    name: 'Filtek Z350 XT Composite Syringe (Shade A2)',
    category: 'Restorative',
    brand: '3M ESPE',
    sku: '3M-FLT-A2',
    currentStock: 4,
    minThreshold: 8,
    unit: 'syringe',
    costPerUnit: 1850,
    supplier: 'DentalDepot India Ltd.',
    expiryDate: '2027-08-30',
    location: 'Cabinet 2, Drawer B'
  },
  {
    id: 'inv-item-2',
    name: 'Lignocaine 2% with Adrenaline 1:80,000 Carpules',
    category: 'Anesthesia',
    brand: 'Septodont (Xylocaine)',
    sku: 'SEP-LIG-80K',
    currentStock: 18,
    minThreshold: 50,
    unit: 'cartridge',
    costPerUnit: 38,
    supplier: 'MedLife Surgical Distributors',
    expiryDate: '2027-02-15',
    location: 'Refrigerated Locker 1'
  },
  {
    id: 'inv-item-3',
    name: 'Nitrile Examination Gloves - Powder Free (Medium)',
    category: 'Personal Protective',
    brand: 'Kimberly-Clark Professional',
    sku: 'KC-GLV-MD',
    currentStock: 12,
    minThreshold: 10,
    unit: 'box (100 pcs)',
    costPerUnit: 490,
    supplier: 'SafeHealth Solutions',
    expiryDate: '2028-12-01',
    location: 'Stock Room Rack 1'
  },
  {
    id: 'inv-item-4',
    name: 'Self-Sealing Sterilization Pouches (3.5" x 9")',
    category: 'Sterilization',
    brand: 'Crosstex',
    sku: 'CTX-PCH-9',
    currentStock: 350,
    minThreshold: 200,
    unit: 'pack',
    costPerUnit: 4,
    supplier: 'SafeHealth Solutions',
    expiryDate: '2029-06-30',
    location: 'Sterilization Area Shelf 3'
  },
  {
    id: 'inv-item-5',
    name: 'ProTaper Gold Rotary Endodontic Files (Assorted 25mm)',
    category: 'Endodontics',
    brand: 'Dentsply Sirona',
    sku: 'DEN-PTG-25',
    currentStock: 3,
    minThreshold: 6,
    unit: 'pack (6 files)',
    costPerUnit: 2400,
    supplier: 'DentalDepot India Ltd.',
    expiryDate: '2029-10-15',
    location: 'Endo Tray Unit 1'
  },
  {
    id: 'inv-item-6',
    name: 'Kromopan Dust-Free Color Changing Alginate',
    category: 'Impression',
    brand: 'Lascod Italy',
    sku: 'LAS-KRM-450',
    currentStock: 9,
    minThreshold: 5,
    unit: 'pack (450g)',
    costPerUnit: 680,
    supplier: 'MedLife Surgical Distributors',
    expiryDate: '2027-11-20',
    location: 'Prostho Cart Lower'
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Dr. Ananya Sharma',
    role: 'Chief Dental Surgeon',
    specialization: 'Endodontics & Restorative Dentistry (MDS)',
    registrationNumber: 'KDC-18921-A',
    assignedChair: 'Chair 1 - Endodontics',
    availability: 'Mon - Sat (09:00 AM - 05:30 PM)',
    email: 'ananya.sharma@oralix.clinic',
    phone: '+91 98450 11223',
    activePatientsToday: 6,
    avatarText: 'AS'
  },
  {
    id: 'staff-2',
    name: 'Dr. Vikram Mehta',
    role: 'Consultant Oral & Maxillofacial Surgeon',
    specialization: 'Implantology & Surgical Extractions (MDS, FIBOMS)',
    registrationNumber: 'KDC-14209-B',
    assignedChair: 'Chair 2 - Surgery',
    availability: 'Tue, Thu, Sat (10:00 AM - 06:00 PM)',
    email: 'vikram.mehta@oralix.clinic',
    phone: '+91 98450 44556',
    activePatientsToday: 4,
    avatarText: 'VM'
  },
  {
    id: 'staff-3',
    name: 'Dr. Priya Sen',
    role: 'Aesthetic Dentist & Orthodontic Associate',
    specialization: 'Clear Aligners & Cosmetic Veneers (BDS, PGD Ortho)',
    registrationNumber: 'KDC-22019-C',
    assignedChair: 'Chair 3 - Aesthetics & Hygiene',
    availability: 'Mon - Fri (10:30 AM - 07:00 PM)',
    email: 'priya.sen@oralix.clinic',
    phone: '+91 98450 77889',
    activePatientsToday: 5,
    avatarText: 'PS'
  },
  {
    id: 'staff-4',
    name: 'Kavita Sundaram',
    role: 'Lead Registered Dental Hygienist & Practice Supervisor',
    specialization: 'Periodontal Prophylaxis & Sterilization Protocols (RDH)',
    registrationNumber: 'DHC-0912',
    assignedChair: 'Sterilization & Operatory Desk',
    availability: 'Mon - Sat (08:30 AM - 05:00 PM)',
    email: 'kavita.s@oralix.clinic',
    phone: '+91 98450 99001',
    activePatientsToday: 8,
    avatarText: 'KS'
  }
];
