import { prisma } from '@student-os/database';

export class DashboardService {
  async getSummary(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get current day of week (1 = Monday, 7 = Sunday)
    const now = new Date();
    // getDay() returns 0 for Sunday, 1 for Monday
    let currentDay = now.getDay();
    if (currentDay === 0) currentDay = 7;

    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const todayClasses = await prisma.timetableEntry.findMany({
      where: {
        userId,
        dayOfWeek: currentDay,
      },
      include: { subject: true },
      orderBy: { startTime: 'asc' },
    });

    const subjectsCount = await prisma.subject.count({
      where: { userId },
    });

    // Find next class today
    const nextClass = todayClasses.find((c) => c.startTime > currentTimeStr) || null;

    // Simple profile completion logic
    let profileCompletionStatus = 0;
    if (user.name) profileCompletionStatus += 20;
    if (user.profile) {
      profileCompletionStatus += 20;
      if (user.profile.program) profileCompletionStatus += 20;
      if (user.profile.semester) profileCompletionStatus += 20;
      if (user.profile.academicYear) profileCompletionStatus += 20;
    }

    // Phase 2: Tasks & Notifications integration
    const pendingTasksCount = await prisma.task.count({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
    });

    const upcomingTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      include: { subject: true },
      orderBy: { dueAt: 'asc' },
      take: 4,
    });

    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    // Determine greeting
    const hour = now.getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';

    return {
      greeting,
      userName: user.name,
      todayClassesCount: todayClasses.length,
      todayClasses,
      totalSubjectsCount: subjectsCount,
      nextClass,
      profileCompletionStatus,
      pendingTasksCount,
      upcomingTasks,
      unreadNotificationsCount,
    };
  }
}
