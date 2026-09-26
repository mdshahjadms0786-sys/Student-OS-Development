import { Router, type Router as IRouter } from 'express';
import { requireAuth } from '../../middleware/auth-guard.js';
import { NotificationsService } from './notifications.service.js';
import { UpdateNotificationPreferenceRequestSchema } from '@student-os/contracts';

export const notificationsRouter: IRouter = Router();
const notificationsService = new NotificationsService();

notificationsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationsService.listNotifications(userId, unreadOnly);
    const unreadCount = await notificationsService.getUnreadCount(userId);
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
});

notificationsRouter.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const notification = await notificationsService.markAsRead(req.params.id as string, userId);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

notificationsRouter.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    await notificationsService.markAllAsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export const notificationPreferencesRouter: IRouter = Router();

notificationPreferencesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const preferences = await notificationsService.getPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    next(error);
  }
});

notificationPreferencesRouter.patch('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = UpdateNotificationPreferenceRequestSchema.parse(req.body);
    const preference = await notificationsService.updatePreference(userId, data);
    res.json({ success: true, data: preference });
  } catch (error) {
    next(error);
  }
});
