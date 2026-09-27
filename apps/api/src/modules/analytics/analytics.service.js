import { prisma } from "@student-os/database";

export class AnalyticsService {
  async getAttendanceAnalytics(userId) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });
    const target = profile?.targetAttendance ?? 75.0;

    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        attendanceRecords: true,
      },
      orderBy: { name: "asc" },
    });

    let totalAttended = 0;
    let totalAbsent = 0;
    let totalExcused = 0;
    let totalCancelled = 0;

    const subjectData = subjects.map((sub) => {
      const records = sub.attendanceRecords || [];
      const present = records.filter((r) => r.status === "PRESENT").length;
      const absent = records.filter((r) => r.status === "ABSENT").length;
      const excused = records.filter((r) => r.status === "EXCUSED").length;
      const cancelled = records.filter((r) => r.status === "CANCELLED").length;
      const total = present + absent;

      totalAttended += present;
      totalAbsent += absent;
      totalExcused += excused;
      totalCancelled += cancelled;

      const percentage =
        total > 0 ? Number(((present / total) * 100).toFixed(1)) : null;

      return {
        subjectId: sub.id,
        code: sub.code,
        name: sub.name,
        color: sub.color || "#3b82f6",
        attended: present,
        absent,
        excused,
        cancelled,
        total,
        percentage,
        target,
        isBelowTarget: percentage !== null && percentage < target,
        hasData: total > 0,
      };
    });

    const totalValidClasses = totalAttended + totalAbsent;
    const overallPercentage =
      totalValidClasses > 0
        ? Number(((totalAttended / totalValidClasses) * 100).toFixed(1))
        : null;

    return {
      target,
      overallPercentage,
      totalAttended,
      totalAbsent,
      totalExcused,
      totalCancelled,
      totalClasses: totalValidClasses,
      isBelowTarget: overallPercentage !== null && overallPercentage < target,
      hasData: totalValidClasses > 0,
      subjects: subjectData,
      statusDistribution: [
        { name: "Present", count: totalAttended, color: "#10b981" },
        { name: "Absent", count: totalAbsent, color: "#ef4444" },
        { name: "Excused", count: totalExcused, color: "#f59e0b" },
        { name: "Cancelled", count: totalCancelled, color: "#6b7280" },
      ].filter((s) => s.count > 0),
    };
  }

  async getTaskAnalytics(userId) {
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { subject: true },
    });

    const now = new Date();
    let completed = 0;
    let inProgress = 0;
    let todo = 0;
    let overdue = 0;

    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    const categoryCounts = {
      ASSIGNMENT: 0,
      PROJECT: 0,
      STUDY: 0,
      REVISION: 0,
      OTHER: 0,
    };

    for (const task of tasks) {
      if (task.status === "COMPLETED") {
        completed++;
      } else if (new Date(task.dueAt) < now) {
        overdue++;
      } else if (task.status === "IN_PROGRESS") {
        inProgress++;
      } else {
        todo++;
      }

      if (priorityCounts[task.priority] !== undefined) {
        priorityCounts[task.priority]++;
      }
      if (categoryCounts[task.category] !== undefined) {
        categoryCounts[task.category]++;
      }
    }

    const total = tasks.length;
    const completionRate =
      total > 0 ? Number(((completed / total) * 100).toFixed(1)) : null;

    return {
      total,
      completed,
      pending: todo + inProgress,
      overdue,
      completionRate,
      hasData: total > 0,
      statusDistribution: [
        { name: "Completed", value: completed, color: "#10b981" },
        { name: "In Progress", value: inProgress, color: "#3b82f6" },
        { name: "To Do", value: todo, color: "#94a3b8" },
        { name: "Overdue", value: overdue, color: "#ef4444" },
      ],
      priorityDistribution: Object.entries(priorityCounts).map(
        ([priority, count]) => ({
          priority,
          count,
        }),
      ),
      categoryDistribution: Object.entries(categoryCounts).map(
        ([category, count]) => ({
          category,
          count,
        }),
      ),
    };
  }

  async getStudyHoursAnalytics(userId, days = 7) {
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (days - 1),
      0,
      0,
      0,
      0,
    );

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: startDate },
      },
      include: { subject: true },
      orderBy: { startedAt: "asc" },
    });

    // Generate daily breakdown for past `days`
    const dailyMap = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      const label = `${weekday} (${monthShort} ${d.getDate()})`;
      dailyMap.set(dateKey, { date: dateKey, label, minutes: 0, hours: 0 });
    }

    let totalMinutes = 0;
    const subjectMinutes = new Map();

    for (const session of sessions) {
      const sDate = new Date(session.startedAt);
      const sYear = sDate.getFullYear();
      const sMonth = String(sDate.getMonth() + 1).padStart(2, "0");
      const sDay = String(sDate.getDate()).padStart(2, "0");
      const dateKey = `${sYear}-${sMonth}-${sDay}`;
      const mins = session.durationMinutes || 0;
      totalMinutes += mins;

      if (dailyMap.has(dateKey)) {
        const item = dailyMap.get(dateKey);
        item.minutes += mins;
        item.hours = Number((item.minutes / 60).toFixed(1));
      }

      const subName = session.subject?.name || "General Study";
      subjectMinutes.set(subName, (subjectMinutes.get(subName) || 0) + mins);
    }

    const dailyBreakdown = Array.from(dailyMap.values());
    const totalHours = Number((totalMinutes / 60).toFixed(1));
    const averageDailyHours = Number((totalHours / days).toFixed(1));

    return {
      totalMinutes,
      totalHours,
      averageDailyHours,
      days,
      hasData: totalMinutes > 0,
      dailyBreakdown,
      subjectBreakdown: Array.from(subjectMinutes.entries()).map(
        ([name, mins]) => ({
          name,
          hours: Number((mins / 60).toFixed(1)),
          minutes: mins,
        }),
      ),
    };
  }

  async logStudySession(userId, data) {
    const session = await prisma.studySession.create({
      data: {
        userId,
        subjectId: data.subjectId || null,
        durationMinutes: data.durationMinutes,
        startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
      },
      include: { subject: true },
    });
    return session;
  }

  async getExamAnalytics(userId) {
    const exams = await prisma.exam.findMany({
      where: { userId },
      include: { subject: true },
      orderBy: { examAt: "asc" },
    });

    const total = exams.length;
    let totalProgress = 0;
    let upcomingCount = 0;
    let ongoingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const examList = exams.map((exam) => {
      totalProgress += exam.preparationProgress;
      if (exam.status === "UPCOMING") upcomingCount++;
      else if (exam.status === "ONGOING") ongoingCount++;
      else if (exam.status === "COMPLETED") completedCount++;
      else if (exam.status === "CANCELLED") cancelledCount++;

      const daysRemaining = Math.ceil(
        (new Date(exam.examAt).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        id: exam.id,
        title: exam.title,
        subjectName: exam.subject?.name || "General",
        color: exam.subject?.color || "#3b82f6",
        examAt: exam.examAt.toISOString(),
        daysRemaining,
        preparationProgress: exam.preparationProgress,
        status: exam.status,
      };
    });

    const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;

    return {
      total,
      upcomingCount,
      ongoingCount,
      completedCount,
      cancelledCount,
      averageProgress,
      hasData: total > 0,
      exams: examList,
    };
  }

  async getAcademicPerformanceAnalytics(userId) {
    // In accordance with Product Integrity Rules & 11_ANALYTICS_CHARTS.pdf:
    // "Academic performance: historical trend when valid marks data exists.
    // Charts must use real application data only. Never display fabricated academic statistics as real data."
    // Since grading/marks entries are not yet part of the model, we strictly return hasData: false.
    return {
      hasData: false,
      message:
        "No official marks or grade data recorded yet. Record semester exam results to view performance trends.",
      trends: [],
    };
  }
}
