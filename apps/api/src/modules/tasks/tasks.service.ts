import { prisma, type Priority, type TaskCategory, type TaskStatus } from '@student-os/database';
import type { CreateTaskRequest, UpdateTaskRequest } from '@student-os/contracts';
import { AppError } from '../../middleware/error-handler.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export class TasksService {
  private notificationsService = new NotificationsService();

  async listTasks(
    userId: string,
    filters?: {
      status?: string;
      priority?: string;
      category?: string;
      subjectId?: string;
      search?: string;
      from?: string;
      to?: string;
    }
  ) {
    const where: any = { userId };

    if (filters?.status) {
      if (filters.status === 'OVERDUE') {
        where.status = { in: ['TODO', 'IN_PROGRESS'] };
        where.dueAt = { lt: new Date() };
      } else {
        where.status = filters.status;
      }
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters?.search) {
      where.title = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    if (filters?.from || filters?.to) {
      where.dueAt = {};
      if (filters.from) {
        where.dueAt.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.dueAt.lte = new Date(filters.to);
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { subject: true },
      orderBy: { dueAt: 'asc' },
    });

    const now = new Date();
    // Dynamically mark overdue tasks if status is TODO or IN_PROGRESS and dueAt < now
    return tasks.map((task) => {
      if (
        (task.status === 'TODO' || task.status === 'IN_PROGRESS') &&
        new Date(task.dueAt) < now
      ) {
        return { ...task, isOverdue: true };
      }
      return { ...task, isOverdue: false };
    });
  }

  async getTask(id: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { subject: true },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    return task;
  }

  async createTask(userId: string, data: CreateTaskRequest) {
    if (data.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: data.subjectId, userId },
      });
      if (!subject) {
        throw new AppError('Subject not found or does not belong to user', 400);
      }
    }

    const dueAtDate = new Date(data.dueAt);
    if (isNaN(dueAtDate.getTime())) {
      throw new AppError('Invalid due date', 400);
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? null,
        dueAt: dueAtDate,
        priority: (data.priority as Priority) ?? 'MEDIUM',
        category: (data.category as TaskCategory) ?? 'ASSIGNMENT',
        status: (data.status as TaskStatus) ?? 'TODO',
        subjectId: data.subjectId ?? null,
      },
      include: { subject: true },
    });

    // Schedule notification/reminder if due date is in the future
    try {
      await this.notificationsService.createTaskReminder(userId, task);
    } catch {
      // Don't fail task creation if reminder creation fails
    }

    return task;
  }

  async updateTask(id: string, userId: string, data: UpdateTaskRequest) {
    await this.getTask(id, userId);

    if (data.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: data.subjectId, userId },
      });
      if (!subject) {
        throw new AppError('Subject not found or does not belong to user', 400);
      }
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;
    if (data.dueAt !== undefined) {
      const d = new Date(data.dueAt);
      if (isNaN(d.getTime())) {
        throw new AppError('Invalid due date', 400);
      }
      updateData.dueAt = d;
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED') {
        updateData.completedAt = data.completedAt ? new Date(data.completedAt) : new Date();
      } else {
        updateData.completedAt = null;
      }
    } else if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { subject: true },
    });

    return updatedTask;
  }

  async deleteTask(id: string, userId: string) {
    await this.getTask(id, userId);

    // Remove any reminders for this task
    await prisma.notification.deleteMany({
      where: {
        userId,
        relatedEntity: id,
      },
    });

    await prisma.task.delete({
      where: { id },
    });
  }

  async toggleComplete(id: string, userId: string) {
    const task = await this.getTask(id, userId);
    const isCompleted = task.status === 'COMPLETED';

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: isCompleted ? 'TODO' : 'COMPLETED',
        completedAt: isCompleted ? null : new Date(),
      },
      include: { subject: true },
    });

    return updated;
  }
}
