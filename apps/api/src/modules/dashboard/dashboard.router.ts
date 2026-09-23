import { Router, type Router as IRouter } from 'express';
import { requireAuth } from '../../middleware/auth-guard.js';
import { DashboardService } from './dashboard.service.js';

export const dashboardRouter: IRouter = Router();
const dashboardService = new DashboardService();

dashboardRouter.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const summary = await dashboardService.getSummary(userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});
