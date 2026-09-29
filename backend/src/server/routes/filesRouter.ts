/**
 * src/server/routes/filesRouter.ts — Oralix Secure Document & Report Upload Engine
 */

import { Router, Response } from 'express';
import { OralixDb, PatientFileRecord, AuthenticatedRequest } from '../db.ts';

const router = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/files
 * Patient: views own files
 * Doctor/Receptionist/Admin: views clinic files or specific patient files
 */
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const { patientId } = req.query;

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    const pid = ownPatient?.id || user.patientId || user.id;
    const files = OralixDb.getFiles(clinicId, pid);
    res.json({ success: true, count: files.length, files });
    return;
  }

  const files = OralixDb.getFiles(clinicId, patientId ? String(patientId) : undefined);
  res.json({ success: true, count: files.length, files });
});

/**
 * POST /api/files/upload
 * Upload document / clinical report
 */
router.post('/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const { patientId, fileName, fileType, fileSize, category, fileData } = req.body;

  let targetPatientId = patientId;
  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    targetPatientId = ownPatient?.id || user.patientId || user.id;
  }

  if (!targetPatientId) {
    res.status(400).json({ error: 'Patient ID is required.' });
    return;
  }

  if (!fileName || typeof fileName !== 'string') {
    res.status(400).json({ error: 'File name is required.' });
    return;
  }

  // File type validation
  const cleanMime = String(fileType || '').toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.includes(cleanMime)) {
    res.status(400).json({
      error: `Invalid file type "${cleanMime}". Allowed types: JPEG, PNG, WebP, PDF.`,
    });
    return;
  }

  // File size validation
  const size = Number(fileSize);
  if (isNaN(size) || size <= 0 || size > MAX_FILE_SIZE_BYTES) {
    res.status(400).json({
      error: `File size exceeds the 10MB limit. Current size: ${(size / (1024 * 1024)).toFixed(2)} MB`,
    });
    return;
  }

  const newFile: PatientFileRecord = {
    id: `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clinicId,
    patientId: targetPatientId,
    fileName: fileName.replace(/[^a-zA-Z0-9._-]/g, '_'),
    fileType: cleanMime,
    fileSize: size,
    category: category || 'lab_report',
    uploadedBy: user.name || user.email,
    uploadedAt: new Date().toISOString(),
    storageData: fileData || undefined,
  };

  const saved = OralixDb.saveFile(newFile);

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'FILE_UPLOAD',
    entityType: 'Document',
    entityId: saved.id,
    details: `Uploaded ${saved.fileName} (${(saved.fileSize / 1024).toFixed(1)} KB) for patient ${targetPatientId}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, message: 'Document uploaded securely.', file: saved });
});

/**
 * GET /api/files/:id
 * Secure access verification: cross-patient download blocked
 */
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const fileId = req.params.id;

  const file = OralixDb.findFileById(fileId, clinicId);
  if (!file) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    const pid = ownPatient?.id || user.patientId || user.id;
    if (file.patientId !== pid) {
      res.status(403).json({ error: 'Access denied: You cannot view files belonging to another patient.' });
      return;
    }
  }

  res.json({ success: true, file });
});

export default router;
