/**
 * src/server/routes/appointmentsRouter.ts — Oralix Appointments API Router
 */

import { Router, Response } from 'express';
import { OralixDb, AppointmentRecord, AppointmentState, AuthenticatedRequest } from '../db.ts';

const router = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

// Convert "09:30 AM" or "09:30" to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  const isPm = /pm/i.test(clean);
  const isAm = /am/i.test(clean);
  const parts = clean.replace(/(am|pm)/i, '').trim().split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * GET /api/appointments
 */
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const all = OralixDb.getAppointments(clinicId);

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    const pid = ownPatient?.id || user.patientId || user.id;
    const filtered = all.filter(a => a.patientId === pid);
    res.json({ success: true, count: filtered.length, appointments: filtered });
    return;
  }

  // Doctor: can filter by their doctorId or get all
  const { date, doctorId, status } = req.query;
  let filtered = all;

  if (date) {
    filtered = filtered.filter(a => a.date === String(date));
  }
  if (doctorId) {
    filtered = filtered.filter(a => a.doctorId === String(doctorId));
  }
  if (status) {
    filtered = filtered.filter(a => a.status.toLowerCase() === String(status).toLowerCase());
  }

  res.json({ success: true, count: filtered.length, appointments: filtered });
});

/**
 * POST /api/appointments
 */
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';

  const {
    patientId,
    doctorId,
    doctorName,
    chair,
    date,
    startTime,
    endTime,
    durationMinutes,
    procedure,
    notes,
  } = req.body;

  let targetPatientId = patientId;
  let targetPatientName = '';

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    if (!ownPatient) {
      // Auto-provision patient record if missing
      const newP = OralixDb.savePatient({
        id: user.patientId || `p-${user.id}`,
        userId: user.id,
        clinicId,
        code: `OX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        name: user.name || 'New Patient',
        age: 30,
        gender: 'Other',
        phone: user.phone || '+91 90000 00000',
        email: user.email,
        medicalAlerts: [],
        balanceDue: 0,
        registeredDate: new Date().toISOString().split('T')[0],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      targetPatientId = newP.id;
      targetPatientName = newP.name;
    } else {
      targetPatientId = ownPatient.id;
      targetPatientName = ownPatient.name;
    }
  } else {
    if (!patientId) {
      res.status(400).json({ error: 'Patient ID is required.' });
      return;
    }
    const pat = OralixDb.findPatientById(patientId, clinicId);
    if (!pat) {
      res.status(404).json({ error: 'Selected patient does not exist.' });
      return;
    }
    targetPatientName = pat.name;
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required.' });
    return;
  }

  const startStr = startTime || '09:30 AM';
  const duration = Number(durationMinutes) || 45;
  const startMins = parseTimeToMinutes(startStr);
  const endMins = endTime ? parseTimeToMinutes(endTime) : startMins + duration;

  if (endMins <= startMins) {
    res.status(400).json({ error: 'Appointment end time must be after start time.' });
    return;
  }

  // Double Booking Prevention
  const targetDoctorId = doctorId || 'u-doctor';
  const targetChair = chair || 'Chair 1 - Endodontics';
  const existingApts = OralixDb.getAppointments(clinicId);

  const overlap = existingApts.find(a => {
    if (a.date !== date) return false;
    if (a.status === 'CANCELLED' || a.status === 'NO_SHOW') return false;

    const aStart = parseTimeToMinutes(a.startTime);
    const aEnd = parseTimeToMinutes(a.endTime);

    // Overlap condition: start < aEnd && end > aStart
    const timesOverlap = startMins < aEnd && endMins > aStart;
    if (!timesOverlap) return false;

    // Check same doctor or same chair
    return a.doctorId === targetDoctorId || a.chair === targetChair;
  });

  if (overlap) {
    const isDoctor = overlap.doctorId === targetDoctorId;
    res.status(409).json({
      error: `Booking Conflict: ${isDoctor ? `Doctor (${overlap.doctorName})` : `Operatory (${overlap.chair})`} already has an appointment scheduled between ${overlap.startTime} and ${overlap.endTime}.`,
    });
    return;
  }

  const tokenNumber = `#D-${Math.floor(100 + Math.random() * 900)}`;
  const newApt: AppointmentRecord = {
    id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clinicId,
    patientId: targetPatientId,
    patientName: targetPatientName,
    doctorId: targetDoctorId,
    doctorName: doctorName || 'Dr. Ananya Sharma',
    chair: targetChair,
    date,
    startTime: startStr,
    endTime: endTime || `${Math.floor(endMins / 60)}:${String(endMins % 60).padStart(2, '0')}`,
    durationMinutes: duration,
    procedure: procedure || 'General Dental Examination',
    status: (req.body.status as AppointmentState) || 'SCHEDULED',
    tokenNumber,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = OralixDb.saveAppointment(newApt);

  OralixDb.addNotification({
    clinicId,
    type: 'appointment',
    title: 'New Appointment Scheduled',
    message: `${targetPatientName} booked for ${saved.procedure} on ${date} at ${startStr}`,
    read: false,
    link: '/appointments',
  });

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'APPOINTMENT_CREATE',
    entityType: 'Appointment',
    entityId: saved.id,
    details: `Created appointment for ${targetPatientName} with ${saved.doctorName} on ${date}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, appointment: saved });
});

/**
 * PATCH /api/appointments/:id/status
 * Enforce valid state machine transitions
 */
const VALID_TRANSITIONS: Record<AppointmentState, AppointmentState[]> = {
  SCHEDULED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: ['CONFIRMED'], // only with explicit re-activation
  NO_SHOW: ['CONFIRMED'],
};

router.patch('/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const aptId = req.params.id;
  const { status } = req.body as { status: AppointmentState };

  if (!status) {
    res.status(400).json({ error: 'Status is required.' });
    return;
  }

  const all = OralixDb.getAppointments(clinicId);
  const apt = all.find(a => a.id === aptId);
  if (!apt) {
    res.status(404).json({ error: 'Appointment not found.' });
    return;
  }

  // Patients can only cancel their own appointments
  if (user.role === 'patient') {
    const isOwner = apt.patientId === user.patientId || apt.patientId === `p-${user.id}`;
    if (!isOwner) {
      res.status(403).json({ error: 'Access denied: You can only modify your own appointments.' });
      return;
    }
    if (status !== 'CANCELLED') {
      res.status(403).json({ error: 'Patients may only request cancellation.' });
      return;
    }
  }

  // Verify transition
  const current = apt.status;
  if (current === status) {
    res.json({ success: true, appointment: apt, message: `Appointment already in ${status} status.` });
    return;
  }
  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(status) && user.role !== 'admin') {
    res.status(400).json({
      error: `Invalid status transition: Cannot move appointment from ${current} directly to ${status}.`,
    });
    return;
  }

  apt.status = status;
  const saved = OralixDb.saveAppointment(apt);

  OralixDb.addNotification({
    clinicId,
    type: 'appointment',
    title: `Appointment ${status}`,
    message: `${apt.patientName}'s appointment status was updated to ${status}`,
    read: false,
    link: '/appointments',
  });

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'APPOINTMENT_STATUS_CHANGE',
    entityType: 'Appointment',
    entityId: saved.id,
    details: `Transitioned status from ${current} to ${status} for appointment ${saved.id}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, appointment: saved });
});

/**
 * DELETE /api/appointments/:id
 */
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const aptId = req.params.id;

  const all = OralixDb.getAppointments(clinicId);
  const apt = all.find(a => a.id === aptId);
  if (!apt) {
    res.status(404).json({ error: 'Appointment not found.' });
    return;
  }

  if (user.role === 'patient') {
    const isOwner = apt.patientId === user.patientId || apt.patientId === `p-${user.id}`;
    if (!isOwner) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
  }

  apt.status = 'CANCELLED';
  OralixDb.saveAppointment(apt);

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'APPOINTMENT_CANCEL',
    entityType: 'Appointment',
    entityId: apt.id,
    details: `Cancelled appointment ${apt.id} for ${apt.patientName}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: 'Appointment cancelled successfully.' });
});

export default router;
