import { prisma } from "@student-os/database";
import { AppError } from "../../middleware/error-handler.js";
import { aiProvider } from "./aiProvider.js";

export class AiService {
  /**
   * Generate an intelligent study plan using real user database context
   */
  async generateStudyPlan(userId, options = {}) {
    const studyHoursPerDay = options.studyHoursPerDay || 4;
    const days = options.days || 7;
    const targetSubjectId = options.targetSubjectId || null;

    let targetSubjectName = null;
    if (targetSubjectId) {
      const sub = await prisma.subject.findFirst({
        where: { id: targetSubjectId, userId },
      });
      if (sub) targetSubjectName = sub.name;
    }

    // Fetch upcoming exams
    const exams = await prisma.exam.findMany({
      where: {
        userId,
        examAt: { gte: new Date() },
        status: { not: "COMPLETED" },
      },
      include: { subject: true },
      orderBy: { examAt: "asc" },
      take: 5,
    });

    // Fetch pending and overdue tasks
    const pendingTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ["TODO", "IN_PROGRESS", "OVERDUE"] },
      },
      include: { subject: true },
      orderBy: { dueAt: "asc" },
      take: 10,
    });

    // Fetch timetable entries
    const timetable = await prisma.timetableEntry.findMany({
      where: { userId },
      include: { subject: true },
    });

    return aiProvider.generateStudyPlan({
      exams,
      pendingTasks,
      timetable,
      studyHoursPerDay,
      days,
      targetSubjectId,
      targetSubjectName,
    });
  }

  /**
   * User explicit acceptance of AI study plan items -> creates real database tasks
   */
  async acceptStudyPlan(userId, items = []) {
    if (!items || items.length === 0) {
      throw new AppError("No plan items provided for acceptance", 400);
    }

    const createdTasks = [];

    for (const item of items) {
      let dueAt = new Date(item.date);
      if (isNaN(dueAt.getTime())) {
        dueAt = new Date();
      }

      // If item has a subjectId, verify user ownership or set null
      let validSubjectId = null;
      if (item.subjectId) {
        const sub = await prisma.subject.findFirst({
          where: { id: item.subjectId, userId },
        });
        if (sub) validSubjectId = sub.id;
      }

      const task = await prisma.task.create({
        data: {
          userId,
          title: item.title,
          description: `${item.description || "AI Accepted Study Item"} (Accepted from AI Study Roadmap)`,
          dueAt,
          priority: item.priority || "MEDIUM",
          category: item.category || "STUDY",
          status: "TODO",
          subjectId: validSubjectId,
        },
        include: { subject: true },
      });

      createdTasks.push(task);
    }

    return {
      success: true,
      acceptedCount: createdTasks.length,
      tasks: createdTasks,
      message: `Successfully added ${createdTasks.length} study task(s) to your workspace.`,
    };
  }

  /**
   * Resolve a student question / doubt
   */
  async answerDoubt(userId, { question, subjectId, additionalContext }) {
    let subjectName = null;
    let subjectCode = null;

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId },
      });
      if (subject) {
        subjectName = subject.name;
        subjectCode = subject.code;
      }
    }

    return aiProvider.answerDoubt({
      question,
      subjectName,
      subjectCode,
      additionalContext,
    });
  }

  /**
   * Summarize student note content
   */
  async summarizeNote(userId, { noteId, content }) {
    let noteTitle = "Student Note";
    let noteContent = content || "";
    let subjectName = null;

    if (noteId) {
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: { subject: true },
      });

      if (!note) {
        throw new AppError("Note not found", 404);
      }

      if (note.userId !== userId) {
        throw new AppError("Unauthorized access to note", 403);
      }

      noteTitle = note.title;
      noteContent = note.content;
      if (note.subject) subjectName = note.subject.name;
    }

    return aiProvider.summarizeNote({
      noteTitle,
      noteContent,
      subjectName,
    });
  }

  /**
   * Generate AI Exam Prep guide
   */
  async generateExamPrep(userId, examId) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { subject: true },
    });

    if (!exam) {
      throw new AppError("Exam record not found", 404);
    }

    if (exam.userId !== userId) {
      throw new AppError("Unauthorized access to exam", 403);
    }

    return aiProvider.generateExamPrep({
      examTitle: exam.title,
      subjectName: exam.subject?.name || "Course Subject",
      examDate: exam.examAt,
      syllabus: exam.syllabus,
      progress: exam.preparationProgress,
    });
  }

  /**
   * Compute smart recommendations from live user metrics
   */
  async getSmartRecommendations(userId) {
    // 1. Check user target attendance
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });
    const targetAttendance = profile?.targetAttendance || 75.0;

    // 2. Fetch subjects & calculate attendance
    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: { attendanceRecords: true },
    });

    const lowAttendanceSubjects = [];
    for (const sub of subjects) {
      const total = sub.attendanceRecords.length;
      if (total > 0) {
        const attended = sub.attendanceRecords.filter(
          (r) => r.status === "PRESENT" || r.status === "EXCUSED",
        ).length;
        const percentage = Math.round((attended / total) * 100);
        if (percentage < targetAttendance) {
          lowAttendanceSubjects.push({
            id: sub.id,
            name: sub.name,
            percentage,
            target: targetAttendance,
          });
        }
      }
    }

    // 3. Upcoming exams
    const upcomingExams = await prisma.exam.findMany({
      where: {
        userId,
        examAt: { gte: new Date() },
        status: { not: "COMPLETED" },
      },
      include: { subject: true },
      orderBy: { examAt: "asc" },
      take: 3,
    });

    // 4. Overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        userId,
        status: "OVERDUE",
      },
      take: 5,
    });

    // 5. Weekly study sessions
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: oneWeekAgo },
      },
    });

    const studyMinutes = studySessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0,
    );
    const studyHoursThisWeek = Math.round(studyMinutes / 60);

    return aiProvider.getSmartRecommendations({
      lowAttendanceSubjects,
      upcomingExams,
      overdueTasks,
      studyHoursThisWeek,
    });
  }
}
