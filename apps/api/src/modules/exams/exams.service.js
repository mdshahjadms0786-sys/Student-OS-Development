import { prisma } from "@student-os/database";
import { AppError } from "../../middleware/error-handler.js";
import { NotificationsService } from "../notifications/notifications.service.js";

export class ExamsService {
  constructor() {
    this.notificationsService = new NotificationsService();
  }

  calculateDaysRemaining(examAt) {
    const now = new Date();
    const target = new Date(examAt);
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  enrichExam(exam) {
    const daysRemaining = this.calculateDaysRemaining(exam.examAt);
    const isPast = new Date(exam.examAt) < new Date();
    return {
      ...exam,
      daysRemaining,
      isPast,
    };
  }

  async listExams(userId, filters = {}) {
    const where = { userId };

    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.upcomingOnly) {
      where.examAt = { gte: new Date() };
      where.status = { not: "COMPLETED" };
    }

    const exams = await prisma.exam.findMany({
      where,
      include: { subject: true },
      orderBy: { examAt: "asc" },
    });

    return exams.map((exam) => this.enrichExam(exam));
  }

  async getExam(id, userId) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { subject: true },
    });

    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    if (exam.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    return this.enrichExam(exam);
  }

  async createExam(userId, data) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, userId },
    });

    if (!subject) {
      throw new AppError("Subject not found or does not belong to user", 400);
    }

    const examAtDate = new Date(data.examAt);
    if (isNaN(examAtDate.getTime())) {
      throw new AppError("Invalid exam date and time", 400);
    }

    const exam = await prisma.exam.create({
      data: {
        userId,
        subjectId: data.subjectId,
        title: data.title,
        examAt: examAtDate,
        room: data.room || null,
        syllabus: data.syllabus || null,
        preparationProgress: data.preparationProgress ?? 0,
        status: data.status || "UPCOMING",
      },
      include: { subject: true },
    });

    // Schedule notification reminder if exam is in the future
    try {
      await this.notificationsService.createExamReminder(userId, exam);
    } catch {
      // Don't fail exam creation if notification scheduling fails
    }

    return this.enrichExam(exam);
  }

  async updateExam(id, userId, data) {
    const existing = await prisma.exam.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Exam not found", 404);
    }

    if (existing.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    if (data.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: data.subjectId, userId },
      });
      if (!subject) {
        throw new AppError("Subject not found or does not belong to user", 400);
      }
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;
    if (data.room !== undefined) updateData.room = data.room;
    if (data.syllabus !== undefined) updateData.syllabus = data.syllabus;
    if (data.preparationProgress !== undefined)
      updateData.preparationProgress = data.preparationProgress;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.examAt !== undefined) {
      const d = new Date(data.examAt);
      if (isNaN(d.getTime())) {
        throw new AppError("Invalid exam date and time", 400);
      }
      updateData.examAt = d;
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: { subject: true },
    });

    return this.enrichExam(updated);
  }

  async deleteExam(id, userId) {
    const existing = await prisma.exam.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Exam not found", 404);
    }

    if (existing.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // Clean up any associated notifications
    await prisma.notification.deleteMany({
      where: {
        userId,
        relatedEntity: id,
      },
    });

    await prisma.exam.delete({
      where: { id },
    });

    return { id };
  }
}
