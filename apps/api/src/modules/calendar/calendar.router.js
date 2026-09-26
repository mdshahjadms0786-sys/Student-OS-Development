import { Router } from 'express';
import { requireAuth } from '../../middleware/auth-guard.js';
import { CalendarService } from './calendar.service.js';

export const calendarRouter = Router();
const calendarService = new CalendarService();

calendarRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ success: false, message: 'Both "from" and "to" query parameters are required' });
      return;
    }

    const items = await calendarService.getCalendarItems(userId, from, to);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});
