import { Router } from 'express';
import { requireAuth } from '../../middleware/auth-guard.js';
import { TasksService } from './tasks.service.js';
import { CreateTaskRequestSchema, UpdateTaskRequestSchema } from '@student-os/contracts';

export const tasksRouter = Router();
const tasksService = new TasksService();

tasksRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, priority, category, subjectId, search, from, to } = req.query;

    const tasks = await tasksService.listTasks(userId, {
      status,
      priority,
      category,
      subjectId,
      search,
      from,
      to,
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

tasksRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const task = await tasksService.getTask(req.params.id, userId);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

tasksRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = CreateTaskRequestSchema.parse(req.body);
    const task = await tasksService.createTask(userId, data);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

tasksRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = UpdateTaskRequestSchema.parse(req.body);
    const task = await tasksService.updateTask(req.params.id, userId, data);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    await tasksService.deleteTask(req.params.id, userId);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

tasksRouter.post('/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const task = await tasksService.toggleComplete(req.params.id, userId);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});
