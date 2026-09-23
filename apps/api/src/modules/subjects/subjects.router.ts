import { Router, type Router as IRouter } from 'express';
import { requireAuth } from '../../middleware/auth-guard.js';
import { SubjectsService } from './subjects.service.js';
import { CreateSubjectRequestSchema, UpdateSubjectRequestSchema } from '@student-os/contracts';

export const subjectsRouter: IRouter = Router();
const subjectsService = new SubjectsService();

subjectsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const subjects = await subjectsService.listSubjects(userId);
    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
});

subjectsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const subject = await subjectsService.getSubject(req.params.id as string, userId);
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
});

subjectsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = CreateSubjectRequestSchema.parse(req.body);
    const subject = await subjectsService.createSubject(userId, data);
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
});

subjectsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = UpdateSubjectRequestSchema.parse(req.body);
    const subject = await subjectsService.updateSubject(req.params.id as string, userId, data);
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
});

subjectsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    await subjectsService.deleteSubject(req.params.id as string, userId);
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
});
