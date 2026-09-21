import { Router, type Router as IRouter } from 'express';
import { RegisterRequestSchema, LoginRequestSchema } from '@student-os/contracts';
import { authService } from './auth.service.js';
import { requireAuth } from '../../middleware/auth-guard.js';

export const authRouter: IRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    const validatedData = RegisterRequestSchema.parse(req.body);
    const user = await authService.register(validatedData);

    // Establish session
    req.session.userId = user.id;
    req.session.role = user.role;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const validatedData = LoginRequestSchema.parse(req.body);
    const user = await authService.login(validatedData);

    // Establish session
    req.session.userId = user.id;
    req.session.role = user.role;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie('student_os_sid');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.session.userId!;
    const user = await authService.getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});
