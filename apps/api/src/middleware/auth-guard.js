import { prisma } from '@student-os/database';
import { AppError } from './error-handler.js';

export async function requireAuth(req, _res, next) {
  const userId = req.session?.userId;

  if (!userId) {
    next(new AppError('Unauthorized: Authentication required', 401));
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      // Session exists for nonexistent user -> destroy session
      req.session.destroy(() => {});
      next(new AppError('User account not found', 401));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
