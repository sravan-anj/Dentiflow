/**
 * src/server/routes/notificationsRouter.ts — Oralix Event Notifications API
 */

import { Router, Response } from 'express';
import { OralixDb, AuthenticatedRequest } from '../db.ts';

const router = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

/**
 * GET /api/notifications
 */
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const clinicId = 'clinic-ox-main';
  const list = OralixDb.getNotifications(clinicId, user.id);
  const unreadCount = list.filter(n => !n.read).length;
  res.json({ success: true, count: list.length, unreadCount, notifications: list });
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifId = req.params.id;
  OralixDb.markNotificationRead(notifId);
  res.json({ success: true, message: 'Notification marked as read.' });
});

export default router;
