import { Router, type Router as IRouter } from 'express';
import { requireAuth } from '../../middleware/auth-guard.js';
import { TimetableService } from './timetable.service.js';
import { CreateTimetableEntryRequestSchema, UpdateTimetableEntryRequestSchema } from '@student-os/contracts';

export const timetableRouter: IRouter = Router();
const timetableService = new TimetableService();

timetableRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const dayQuery = req.query.dayOfWeek;
    const dayOfWeek = dayQuery ? parseInt(dayQuery as string, 10) : undefined;
    
    if (dayOfWeek !== undefined && (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7)) {
      res.status(400).json({ success: false, message: 'Invalid dayOfWeek' });
      return;
    }
    
    const entries = await timetableService.listEntries(userId, dayOfWeek);
    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
});

timetableRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const entry = await timetableService.getEntry(req.params.id as string, userId);
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

timetableRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = CreateTimetableEntryRequestSchema.parse(req.body);
    const entry = await timetableService.createEntry(userId, data);
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

timetableRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = UpdateTimetableEntryRequestSchema.parse(req.body);
    const entry = await timetableService.updateEntry(req.params.id as string, userId, data);
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

timetableRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    await timetableService.deleteEntry(req.params.id as string, userId);
    res.json({ success: true, message: 'Timetable entry deleted successfully' });
  } catch (error) {
    next(error);
  }
});
