import { prisma } from "@student-os/database";

export class DashboardService {
  async getSummary(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get current day of week (1 = Monday, 7 = Sunday)
    const now = new Date();
    // getDay() returns 0 for Sunday, 1 for Monday
    let currentDay = now.getDay();
    if (currentDay === 0) currentDay = 7;

    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const todayClasses = await prisma.timetableEntry.findMany({
      where: {
        userId,
        dayOfWeek: currentDay,
      },
      include: { subject: true },
      orderBy: { startTime: "asc" },
    });

    const subjectsCount = await prisma.subject.count({
      where: { userId },
    });

    // Find next class today
    const nextClass =
      todayClasses.find((c) => c.startTime > currentTimeStr) || null;

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
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
    });

    const upcomingTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      include: { subject: true },
      orderBy: { dueAt: "asc" },
      take: 4,
    });

    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    // Phase 3: Upcoming Exams
    const upcomingExamsRaw = await prisma.exam.findMany({
      where: {
        userId,
        examAt: { gte: now },
        status: { not: "COMPLETED" },
      },
      include: { subject: true },
      orderBy: { examAt: "asc" },
      take: 3,
    });

    const upcomingExams = upcomingExamsRaw.map((exam) => ({
      ...exam,
      daysRemaining: Math.ceil(
        (new Date(exam.examAt).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));

    // Phase 3: Attendance Summary
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { userId },
    });
    const attendedCount = attendanceRecords.filter(
      (r) => r.status === "PRESENT",
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.status === "ABSENT",
    ).length;
    const totalAttendanceClasses = attendedCount + absentCount;
    const targetAttendance = user.profile?.targetAttendance ?? 75.0;
    const attendancePercentage =
      totalAttendanceClasses > 0
        ? Number(((attendedCount / totalAttendanceClasses) * 100).toFixed(1))
        : null;

    const attendanceSummary = {
      attended: attendedCount,
      total: totalAttendanceClasses,
      percentage: attendancePercentage,
      target: targetAttendance,
      isBelowTarget:
        attendancePercentage !== null &&
        attendancePercentage < targetAttendance,
      hasRecords: totalAttendanceClasses > 0,
    };

    // Determine greeting
    const hour = now.getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";

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
      upcomingExams,
      attendanceSummary,
    };
  }
}
