import { prisma } from "@student-os/database";
import { AppError } from "../../middleware/error-handler.js";

const DEFAULT_TYPES = [
  "CLASS",
  "ASSIGNMENT",
  "EXAM",
  "ATTENDANCE",
  "TASK",
  "SUMMARY",
  "SYSTEM",
];

export class NotificationsService {
  async listNotifications(userId, unreadOnly = false) {
    const where = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      take: 50,
    });
  }

  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async markAsRead(id, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    if (notification.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId) {
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

  async getPreferences(userId) {
    const existing = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    if (existing.length < DEFAULT_TYPES.length) {
      // Seed missing default preferences
      const existingTypes = new Set(existing.map((p) => p.type));
      const toCreate = DEFAULT_TYPES.filter((t) => !existingTypes.has(t));

      for (const type of toCreate) {
        const timingMinutes =
          type === "ASSIGNMENT" || type === "TASK" ? 1440 : 30; // 1 day for tasks/assignments, 30 min for classes
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
        orderBy: { type: "asc" },
      });
    }

    return existing;
  }

  async updatePreference(userId, data) {
    return prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId,
          type: data.type,
        },
      },
      update: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.timingMinutes !== undefined && {
          timingMinutes: data.timingMinutes,
        }),
      },
      create: {
        userId,
        type: data.type,
        enabled: data.enabled ?? true,
        timingMinutes: data.timingMinutes ?? 30,
      },
    });
  }

  async createTaskReminder(userId, task) {
    const type = task.category === "ASSIGNMENT" ? "ASSIGNMENT" : "TASK";

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
        message: `Task is due at ${task.dueAt.toLocaleDateString()} ${task.dueAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        scheduledAt: scheduledAt > new Date() ? scheduledAt : new Date(),
        relatedEntity: task.id,
      },
    });
  }

  async createExamReminder(userId, exam) {
    const pref = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId,
          type: "EXAM",
        },
      },
    });

    if (pref && !pref.enabled) {
      return;
    }

    const timingMinutes = pref?.timingMinutes ?? 1440; // Default 1 day
    const examDate = new Date(exam.examAt);
    const scheduledAt = new Date(examDate.getTime() - timingMinutes * 60000);

    // Prevent duplicate reminders for the same exam
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        relatedEntity: exam.id,
        type: "EXAM",
      },
    });

    if (existing) {
      return;
    }

    const subName = exam.subject?.name ? ` for ${exam.subject.name}` : "";
    await prisma.notification.create({
      data: {
        userId,
        type: "EXAM",
        title: `Upcoming Exam: ${exam.title}`,
        message: `Exam${subName} is scheduled on ${examDate.toLocaleDateString()} at ${examDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.${exam.room ? ` Room: ${exam.room}` : ""}`,
        scheduledAt: scheduledAt > new Date() ? scheduledAt : new Date(),
        relatedEntity: exam.id,
      },
    });
  }

  async createAttendanceWarning(userId, subject, percentage, target) {
    const pref = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId,
          type: "ATTENDANCE",
        },
      },
    });

    if (pref && !pref.enabled) {
      return;
    }

    // Check if warning already sent in the last 24 hours for this subject
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        relatedEntity: subject.id,
        type: "ATTENDANCE",
        createdAt: { gte: oneDayAgo },
      },
    });

    if (existing) {
      return;
    }

    await prisma.notification.create({
      data: {
        userId,
        type: "ATTENDANCE",
        title: `Low Attendance Warning: ${subject.name}`,
        message: `Your current attendance is ${percentage}%, which is below the target threshold of ${target}%. Attend upcoming classes to improve your attendance.`,
        scheduledAt: new Date(),
        relatedEntity: subject.id,
      },
    });
  }
}
