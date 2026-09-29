/**
 * src/server/routes/patientsRouter.ts — Oralix Patients API Router
 */

import { Router, Response } from 'express';
import { OralixDb, PatientRecord, AuthenticatedRequest } from '../db.ts';

const router = Router();

// Middleware: ensure authenticated
function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

/**
 * GET /api/patients
 * Patients can only view their own record.
 * Doctors, Receptionists, and Admins can view all active clinic patients.
 */
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';

  if (user.role === 'patient') {
    const all = OralixDb.getPatients(clinicId);
    const ownPatient = all.filter(
      p => (user.patientId && p.id === user.patientId) || p.userId === user.id || p.email.toLowerCase() === user.email.toLowerCase()
    );
    res.json({ success: true, patients: ownPatient });
    return;
  }

  const patients = OralixDb.getPatients(clinicId);
  res.json({ success: true, count: patients.length, patients });
});

/**
 * GET /api/patients/:id
 */
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const targetId = req.params.id;

  const patient = OralixDb.findPatientById(targetId, clinicId);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found.' });
    return;
  }

  // Ownership check for patient role
  if (user.role === 'patient') {
    const isOwner = (user.patientId && patient.id === user.patientId) || patient.userId === user.id || patient.email.toLowerCase() === user.email.toLowerCase();
    if (!isOwner) {
      res.status(403).json({ error: 'Access denied: You can only view your own patient record.' });
      return;
    }
  }

  res.json({ success: true, patient });
});

/**
 * POST /api/patients
 * Create new patient record
 */
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'doctor' && user.role !== 'receptionist' && user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Only clinical staff and administrators can create patient records.' });
    return;
  }

  const { name, age, gender, phone, email, address, bloodGroup, medicalAlerts, emergencyContact, insuranceProvider, insurancePolicyNumber } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Patient name is required.' });
    return;
  }

  const numAge = Number(age);
  if (isNaN(numAge) || numAge <= 0 || numAge > 130) {
    res.status(400).json({ error: 'Valid age is required (1-130).' });
    return;
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    res.status(400).json({ error: 'Valid phone number is required.' });
    return;
  }

  const clinicId = 'clinic-ox-main';
  const existingPatients = OralixDb.getPatients(clinicId);
  const code = `OX-${new Date().getFullYear()}-${String(existingPatients.length + 1).padStart(3, '0')}`;

  const newPatient: PatientRecord = {
    id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clinicId,
    code,
    name: name.trim(),
    age: numAge,
    gender: gender === 'Female' ? 'Female' : gender === 'Other' ? 'Other' : 'Male',
    phone: phone.trim(),
    email: email ? String(email).trim().toLowerCase() : '',
    address: address ? String(address).trim() : '',
    bloodGroup: bloodGroup ? String(bloodGroup).trim() : 'O+',
    medicalAlerts: Array.isArray(medicalAlerts) ? medicalAlerts : (medicalAlerts ? String(medicalAlerts).split(',').map(s => s.trim()) : []),
    emergencyContact: emergencyContact ? String(emergencyContact).trim() : '',
    insuranceProvider: insuranceProvider ? String(insuranceProvider).trim() : 'Self-pay',
    insurancePolicyNumber: insurancePolicyNumber ? String(insurancePolicyNumber).trim() : '',
    balanceDue: 0,
    registeredDate: new Date().toISOString().split('T')[0],
    lastVisitDate: new Date().toISOString().split('T')[0],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = OralixDb.savePatient(newPatient);

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'PATIENT_CREATE',
    entityType: 'Patient',
    entityId: saved.id,
    details: `Created patient record for ${saved.name} (${saved.code})`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, patient: saved });
});

/**
 * PUT /api/patients/:id
 */
router.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const targetId = req.params.id;

  const existing = OralixDb.findPatientById(targetId, clinicId);
  if (!existing) {
    res.status(404).json({ error: 'Patient not found.' });
    return;
  }

  // Patients can only update their own contact info
  if (user.role === 'patient') {
    const isOwner = (user.patientId && existing.id === user.patientId) || existing.userId === user.id || existing.email.toLowerCase() === user.email.toLowerCase();
    if (!isOwner) {
      res.status(403).json({ error: 'Access denied: You can only edit your own details.' });
      return;
    }
    const { phone, address, emergencyContact } = req.body;
    if (phone) existing.phone = String(phone).trim();
    if (address) existing.address = String(address).trim();
    if (emergencyContact) existing.emergencyContact = String(emergencyContact).trim();
  } else {
    // Doctors/Receptionists/Admins can update full record
    const { name, age, gender, phone, email, address, bloodGroup, medicalAlerts, emergencyContact, insuranceProvider, insurancePolicyNumber } = req.body;
    if (name) existing.name = String(name).trim();
    if (age !== undefined) existing.age = Number(age);
    if (gender) existing.gender = gender;
    if (phone) existing.phone = String(phone).trim();
    if (email !== undefined) existing.email = String(email).trim().toLowerCase();
    if (address !== undefined) existing.address = String(address).trim();
    if (bloodGroup) existing.bloodGroup = String(bloodGroup).trim();
    if (medicalAlerts !== undefined) {
      existing.medicalAlerts = Array.isArray(medicalAlerts) ? medicalAlerts : String(medicalAlerts).split(',').map(s => s.trim());
    }
    if (emergencyContact !== undefined) existing.emergencyContact = String(emergencyContact).trim();
    if (insuranceProvider !== undefined) existing.insuranceProvider = String(insuranceProvider).trim();
    if (insurancePolicyNumber !== undefined) existing.insurancePolicyNumber = String(insurancePolicyNumber).trim();
  }

  const saved = OralixDb.savePatient(existing);

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'PATIENT_UPDATE',
    entityType: 'Patient',
    entityId: saved.id,
    details: `Updated patient record for ${saved.name} (${saved.code})`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, patient: saved });
});

/**
 * DELETE /api/patients/:id
 * Archive patient record without destroying financial history
 */
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Only clinic administrators can archive patient records.' });
    return;
  }

  const clinicId = 'clinic-ox-main';
  const targetId = req.params.id;

  const existing = OralixDb.findPatientById(targetId, clinicId);
  if (!existing) {
    res.status(404).json({ error: 'Patient not found.' });
    return;
  }

  existing.status = 'archived';
  OralixDb.savePatient(existing);

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'PATIENT_ARCHIVE',
    entityType: 'Patient',
    entityId: existing.id,
    details: `Archived patient ${existing.name} (${existing.code})`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: `Patient ${existing.name} archived successfully.` });
});

export default router;
