import { prisma, type NotificationType } from '@student-os/database';
import type { UpdateNotificationPreferenceRequest } from '@student-os/contracts';
import { AppError } from '../../middleware/error-handler.js';

const DEFAULT_TYPES: NotificationType[] = [
  'CLASS',
  'ASSIGNMENT',
  'EXAM',
  'ATTENDANCE',
  'TASK',
  'SUMMARY',
  'SYSTEM',
];

export class NotificationsService {
  async listNotifications(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async getPreferences(userId: string) {
    const existing = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    if (existing.length < DEFAULT_TYPES.length) {
      // Seed missing default preferences
      const existingTypes = new Set(existing.map((p) => p.type));
      const toCreate = DEFAULT_TYPES.filter((t) => !existingTypes.has(t));

      for (const type of toCreate) {
        const timingMinutes = type === 'ASSIGNMENT' || type === 'TASK' ? 1440 : 30; // 1 day for tasks/assignments, 30 min for classes
        await prisma.notificationPreference.upsert({
          where: {
            userId_type: {
              userId,
              type,
            },
          },
          update: {},
          create: {
            userId,
            type,
            enabled: true,
            timingMinutes,
          },
        });
      }

      return prisma.notificationPreference.findMany({
        where: { userId },
        orderBy: { type: 'asc' },
      });
    }

    return existing;
  }

  async updatePreference(userId: string, data: UpdateNotificationPreferenceRequest) {
    return prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId,
          type: data.type as NotificationType,
        },
      },
      update: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.timingMinutes !== undefined && { timingMinutes: data.timingMinutes }),
      },
      create: {
        userId,
        type: data.type as NotificationType,
        enabled: data.enabled ?? true,
        timingMinutes: data.timingMinutes ?? 30,
      },
    });
  }

  async createTaskReminder(userId: string, task: { id: string; title: string; dueAt: Date; category: string }) {
    const type: NotificationType = task.category === 'ASSIGNMENT' ? 'ASSIGNMENT' : 'TASK';

    // Check if preference enabled
    const pref = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });

    if (pref && !pref.enabled) {
      return;
    }

    const timingMinutes = pref?.timingMinutes ?? 1440;
    const scheduledAt = new Date(task.dueAt.getTime() - timingMinutes * 60000);

    // Prevent duplicate reminders for the same task
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        relatedEntity: task.id,
        type,
      },
    });

    if (existing) {
      return;
    }

    await prisma.notification.create({
      data: {
        userId,
        type,
        title: `Reminder: ${task.title}`,
        message: `Task is due at ${task.dueAt.toLocaleDateString()} ${task.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        scheduledAt: scheduledAt > new Date() ? scheduledAt : new Date(),
        relatedEntity: task.id,
      },
    });
  }
}
