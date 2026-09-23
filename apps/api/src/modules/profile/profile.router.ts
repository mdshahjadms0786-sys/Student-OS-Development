import { Router, type Router as IRouter } from 'express';
import { requireAuth } from '../../middleware/auth-guard.js';
import { ProfileService } from './profile.service.js';
import { UpdateProfileRequestSchema } from '@student-os/contracts';

export const profileRouter: IRouter = Router();
const profileService = new ProfileService();

profileRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const profile = await profileService.getProfile(userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

profileRouter.patch('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = UpdateProfileRequestSchema.parse(req.body);
    const profile = await profileService.updateProfile(userId, data);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});
