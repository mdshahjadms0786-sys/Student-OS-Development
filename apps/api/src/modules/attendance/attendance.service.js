import { prisma } from "@student-os/database";
import { AppError } from "../../middleware/error-handler.js";
import { NotificationsService } from "../notifications/notifications.service.js";

export class AttendanceService {
  constructor() {
    this.notificationsService = new NotificationsService();
  }

  calculateStats(attended, total, target = 75.0) {
    if (total <= 0) {
      return {
        attended: 0,
        total: 0,
        percentage: null,
        formattedPercentage: "N/A",
        target,
        isBelowTarget: false,
        classesNeeded: 0,
        safeAbsences: 0,
        hasRecords: false,
      };
    }

    const percentage = Number(((attended / total) * 100).toFixed(1));
    const isBelowTarget = percentage < target;

    let classesNeeded = 0;
    let safeAbsences = 0;

    if (isBelowTarget) {
      // (attended + x) / (total + x) >= target / 100
      // 100 * attended + 100 * x >= target * total + target * x
      // (100 - target) * x >= target * total - 100 * attended
      if (target < 100) {
        classesNeeded = Math.max(
          0,
          Math.ceil((target * total - 100 * attended) / (100 - target)),
        );
      } else {
        classesNeeded = 1;
      }
    } else {
      // attended / (total + y) >= target / 100
      // 100 * attended >= target * total + target * y
      // target * y <= 100 * attended - target * total
      if (target > 0) {
        safeAbsences = Math.max(
          0,
          Math.floor((100 * attended - target * total) / target),
        );
      }
    }

    return {
      attended,
      total,
      percentage,
      formattedPercentage: `${percentage}%`,
      target,
      isBelowTarget,
      classesNeeded,
      safeAbsences,
      hasRecords: true,
    };
  }

  async getTargetAttendance(userId) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });
    return profile?.targetAttendance ?? 75.0;
  }

  async getOverallAttendance(userId) {
    const target = await this.getTargetAttendance(userId);

    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        attendanceRecords: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    let totalAttended = 0;
    let totalClasses = 0;

    const subjectStats = subjects.map((subject) => {
      const records = subject.attendanceRecords || [];
      const presentCount = records.filter((r) => r.status === "PRESENT").length;
      const absentCount = records.filter((r) => r.status === "ABSENT").length;
      const excusedCount = records.filter((r) => r.status === "EXCUSED").length;
      const cancelledCount = records.filter(
        (r) => r.status === "CANCELLED",
      ).length;

      const subTotal = presentCount + absentCount;
      totalAttended += presentCount;
      totalClasses += subTotal;

      const stats = this.calculateStats(presentCount, subTotal, target);

      return {
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        color: subject.color || "#3b82f6",
        credits: subject.credits,
        facultyName: subject.facultyName,
        attended: presentCount,
        absent: absentCount,
        excused: excusedCount,
        cancelled: cancelledCount,
        total: subTotal,
        percentage: stats.percentage,
        formattedPercentage: stats.formattedPercentage,
        target: stats.target,
        isBelowTarget: stats.isBelowTarget,
        classesNeeded: stats.classesNeeded,
        safeAbsences: stats.safeAbsences,
        hasRecords: stats.hasRecords,
        recentRecords: records.slice(0, 5),
      };
    });

    const overallStats = this.calculateStats(
      totalAttended,
      totalClasses,
      target,
    );

    return {
      overall: {
        totalAttended,
        totalClasses,
        percentage: overallStats.percentage,
        formattedPercentage: overallStats.formattedPercentage,
        target,
        isBelowTarget: overallStats.isBelowTarget,
        classesNeeded: overallStats.classesNeeded,
        safeAbsences: overallStats.safeAbsences,
        hasRecords: overallStats.hasRecords,
      },
      subjects: subjectStats,
    };
  }

  async getSubjectAttendance(userId, subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
      include: {
        attendanceRecords: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!subject) {
      throw new AppError("Subject not found or does not belong to user", 404);
    }

    const target = await this.getTargetAttendance(userId);
    const records = subject.attendanceRecords;
    const presentCount = records.filter((r) => r.status === "PRESENT").length;
    const absentCount = records.filter((r) => r.status === "ABSENT").length;
    const excusedCount = records.filter((r) => r.status === "EXCUSED").length;
    const cancelledCount = records.filter(
      (r) => r.status === "CANCELLED",
    ).length;
    const total = presentCount + absentCount;

    const stats = this.calculateStats(presentCount, total, target);

    return {
      subject: {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        color: subject.color,
        credits: subject.credits,
        facultyName: subject.facultyName,
      },
      stats: {
        attended: presentCount,
        absent: absentCount,
        excused: excusedCount,
        cancelled: cancelledCount,
        total,
        percentage: stats.percentage,
        formattedPercentage: stats.formattedPercentage,
        target: stats.target,
        isBelowTarget: stats.isBelowTarget,
        classesNeeded: stats.classesNeeded,
        safeAbsences: stats.safeAbsences,
        hasRecords: stats.hasRecords,
      },
      records,
    };
  }

  async recordAttendance(userId, data) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, userId },
    });

    if (!subject) {
      throw new AppError("Subject not found or does not belong to user", 404);
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        userId,
        subjectId: data.subjectId,
        date: data.date ? new Date(data.date) : new Date(),
        status: data.status || "PRESENT",
        remarks: data.remarks || null,
      },
      include: { subject: true },
    });

    // Check if attendance is below target and dispatch warning if necessary
    try {
      const subjectStats = await this.getSubjectAttendance(
        userId,
        data.subjectId,
      );
      if (subjectStats.stats.isBelowTarget && subjectStats.stats.hasRecords) {
        await this.notificationsService.createAttendanceWarning(
          userId,
          subject,
          subjectStats.stats.percentage,
          subjectStats.stats.target,
        );
      }
    } catch {
      // Don't fail record creation if notification fails
    }

    return record;
  }

  async batchUpdateAttendance(userId, data) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, userId },
    });

    if (!subject) {
      throw new AppError("Subject not found or does not belong to user", 404);
    }

    if (data.attended > data.total) {
      throw new AppError("Attended classes cannot exceed total classes", 400);
    }

    // Clear existing records for this subject and bulk seed the aggregate
    await prisma.attendanceRecord.deleteMany({
      where: { subjectId: data.subjectId, userId },
    });

    const now = new Date();
    const recordsToCreate = [];

    for (let i = 0; i < data.attended; i++) {
      const d = new Date(now.getTime() - (data.total - i) * 86400000);
      recordsToCreate.push({
        userId,
        subjectId: data.subjectId,
        date: d,
        status: "PRESENT",
        remarks: "Batch logged session",
      });
    }

    const absentCount = data.total - data.attended;
    for (let i = 0; i < absentCount; i++) {
      const d = new Date(now.getTime() - (absentCount - i) * 43200000);
      recordsToCreate.push({
        userId,
        subjectId: data.subjectId,
        date: d,
        status: "ABSENT",
        remarks: "Batch logged session",
      });
    }

    if (recordsToCreate.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: recordsToCreate,
      });
    }

    return this.getSubjectAttendance(userId, data.subjectId);
  }

  async updateAttendanceRecord(id, userId, data) {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: { subject: true },
    });

    if (!record) {
      throw new AppError("Attendance record not found", 404);
    }

    if (record.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.date !== undefined) updateData.date = new Date(data.date);

    return prisma.attendanceRecord.update({
      where: { id },
      data: updateData,
      include: { subject: true },
    });
  }

  async deleteAttendanceRecord(id, userId) {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new AppError("Attendance record not found", 404);
    }

    if (record.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    await prisma.attendanceRecord.delete({
      where: { id },
    });

    return { id };
  }
}
