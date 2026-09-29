/**
 * src/server/routes/feedbackRouter.ts — Oralix Feedback & Reviews Router
 */

import { Router, Response } from 'express';
import { OralixDb, FeedbackRecord, AuthenticatedRequest } from '../db.ts';

const router = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

/**
 * GET /api/feedback/public
 * Unauthenticated: returns published verified reviews for public landing page
 */
router.get('/public', (_req, res: Response) => {
  const clinicId = 'clinic-ox-main';
  const all = OralixDb.getFeedback(clinicId);
  const published = all.filter(f => f.published);
  res.json({ success: true, reviews: published });
});

/**
 * GET /api/feedback
 * Authenticated: list feedback for clinic or patient
 */
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const all = OralixDb.getFeedback(clinicId);

  if (user.role === 'patient') {
    const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
    const pid = ownPatient?.id || user.patientId || user.id;
    const own = all.filter(f => f.patientId === pid);
    res.json({ success: true, feedback: own });
    return;
  }

  res.json({ success: true, count: all.length, feedback: all });
});

/**
 * POST /api/feedback
 * Submit new feedback
 */
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const { rating, comment, treatmentName, doctorName } = req.body;

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    return;
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
    res.status(400).json({ error: 'Comment must be at least 5 characters long.' });
    return;
  }

  const ownPatient = OralixDb.findPatientByEmail(user.email, clinicId);
  const patientId = ownPatient?.id || user.patientId || user.id;
  const patientName = user.name || ownPatient?.name || 'Patient';

  const newFeedback: FeedbackRecord = {
    id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clinicId,
    patientId,
    patientName,
    doctorName: doctorName || 'Dr. Ananya Sharma',
    treatmentName: treatmentName || 'Clinical Consultation',
    rating: numRating,
    comment: comment.trim(),
    verified: true,
    published: true,
    createdAt: new Date().toISOString(),
  };

  const saved = OralixDb.saveFeedback(newFeedback);

  OralixDb.addNotification({
    clinicId,
    type: 'feedback',
    title: 'New Patient Feedback Submitted',
    message: `${patientName} rated their visit ${numRating}/5: "${comment.slice(0, 50)}..."`,
    read: false,
    link: '/feedback',
  });

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'FEEDBACK_SUBMIT',
    entityType: 'Feedback',
    entityId: saved.id,
    details: `Submitted rating ${numRating}/5 for ${saved.treatmentName}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, message: 'Thank you for your feedback!', feedback: saved });
});

/**
 * POST /api/feedback/:id/respond
 * Doctor or Admin responds to feedback
 */
router.post('/:id/respond', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'doctor' && user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Only clinicians and clinic administrators can reply to feedback.' });
    return;
  }

  const clinicId = 'clinic-ox-main';
  const fbId = req.params.id;
  const { response } = req.body;

  if (!response || typeof response !== 'string' || !response.trim()) {
    res.status(400).json({ error: 'Response text is required.' });
    return;
  }

  const all = OralixDb.getFeedback(clinicId);
  const fb = all.find(f => f.id === fbId);
  if (!fb) {
    res.status(404).json({ error: 'Feedback record not found.' });
    return;
  }

  fb.clinicResponse = response.trim();
  fb.respondedAt = new Date().toISOString();
  OralixDb.saveFeedback(fb);

  OralixDb.addAuditLog({
    clinicId,
    userId: user.id,
    userEmail: user.email,
    action: 'FEEDBACK_RESPOND',
    entityType: 'Feedback',
    entityId: fb.id,
    details: `Replied to feedback from ${fb.patientName}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: 'Clinic response recorded.', feedback: fb });
});

export default router;
