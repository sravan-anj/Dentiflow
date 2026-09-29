/**
 * src/server/routes/settingsRouter.ts — Oralix Settings & User Administration API
 */

import { Router, Response } from 'express';
import { OralixDb, AuthenticatedRequest } from '../db.ts';
import { loadUserStore, saveUserStore, ServerUser, pbkdf2Hash, loadPwStore, savePwStore } from '../../../server.ts';

const router = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

/**
 * GET /api/settings/clinic
 */
router.get('/clinic', requireAuth, (_req, res: Response) => {
  const clinic = OralixDb.getClinic();
  res.json({ success: true, clinic });
});

/**
 * PUT /api/settings/clinic
 */
router.put('/clinic', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Only clinic administrators can modify practice settings.' });
    return;
  }

  const { name, tagline, phone, email, address, chairs, businessHours, registrationNumber, taxRatePct } = req.body;
  const clinic = OralixDb.getClinic();

  if (name) clinic.name = String(name).trim();
  if (tagline !== undefined) clinic.tagline = String(tagline).trim();
  if (phone) clinic.phone = String(phone).trim();
  if (email) clinic.email = String(email).trim().toLowerCase();
  if (address) clinic.address = String(address).trim();
  if (Array.isArray(chairs)) clinic.chairs = chairs;
  if (businessHours) clinic.businessHours = String(businessHours).trim();
  if (registrationNumber) clinic.registrationNumber = String(registrationNumber).trim();
  if (taxRatePct !== undefined) clinic.taxRatePct = Number(taxRatePct) || 0;

  OralixDb.saveClinic(clinic);

  OralixDb.addAuditLog({
    clinicId: clinic.id,
    userId: user.id,
    userEmail: user.email,
    action: 'CLINIC_SETTINGS_UPDATE',
    entityType: 'Clinic',
    entityId: clinic.id,
    details: `Updated clinic configuration: ${clinic.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: 'Practice settings updated.', clinic });
});

/**
 * GET /api/settings/users
 */
router.get('/users', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const users = loadUserStore();
  res.json({ success: true, count: users.length, users });
});

/**
 * POST /api/settings/users
 * Admin creates staff or receptionist
 */
router.post('/users', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Only clinic administrators can provision user accounts.' });
    return;
  }

  const { name, email, password, role, phone, specialization, doctorId } = req.body;

  if (!email || !password || !name || !role) {
    res.status(400).json({ error: 'Name, email, password, and role are required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const users = loadUserStore();

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const newUserId = `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newUser: ServerUser = {
    id: newUserId,
    name: String(name).trim(),
    email: cleanEmail,
    role: role,
    avatarText: name.slice(0, 2).toUpperCase(),
    phone: phone ? String(phone).trim() : undefined,
    specialization: specialization ? String(specialization).trim() : undefined,
    doctorId: doctorId ? String(doctorId).trim() : undefined,
    status: 'active',
    joinedDate: new Date().toISOString().split('T')[0],
  };

  users.push(newUser);
  saveUserStore(users);

  // Hash password
  const pwStore = loadPwStore();
  const pwRecord = await pbkdf2Hash(password);
  pwStore.push({
    userId: newUserId,
    salt: pwRecord.salt,
    hash: pwRecord.hash,
    iterations: pwRecord.iterations,
  });
  savePwStore(pwStore);

  OralixDb.addAuditLog({
    clinicId: 'clinic-ox-main',
    userId: user.id,
    userEmail: user.email,
    action: 'USER_CREATE',
    entityType: 'User',
    entityId: newUserId,
    details: `Admin created user account ${newUser.email} with role ${newUser.role}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, message: 'User created successfully.', user: newUser });
});

/**
 * PATCH /api/settings/users/:id/status
 */
router.patch('/users/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const targetId = req.params.id;
  const { status } = req.body;

  if (!status || !['active', 'inactive', 'on_leave'].includes(status)) {
    res.status(400).json({ error: 'Valid status required (active, inactive, on_leave).' });
    return;
  }

  const users = loadUserStore();
  const targetUser = users.find(u => u.id === targetId);
  if (!targetUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  targetUser.status = status;
  saveUserStore(users);

  OralixDb.addAuditLog({
    clinicId: 'clinic-ox-main',
    userId: user.id,
    userEmail: user.email,
    action: 'USER_STATUS_CHANGE',
    entityType: 'User',
    entityId: targetId,
    details: `Changed status of ${targetUser.email} to ${status}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: `Account status updated to ${status}.`, user: targetUser });
});

/**
 * GET /api/settings/audit-logs
 */
router.get('/audit-logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const logs = OralixDb.getAuditLogs('clinic-ox-main');
  res.json({ success: true, count: logs.length, logs });
});

export default router;
