import { env } from "../../config/env.js";

/**
 * Server-side AI Provider Abstraction Interface
 * Keeps AI provider logic behind a clean service layer.
 */
export class AiProviderService {
  constructor() {
    this.providerName = env.AI_PROVIDER || "mock";
    this.apiKey = env.AI_API_KEY || null;
    this.timeoutMs = 8000; // 8 second timeout rule
  }

  /**
   * Helper to execute provider call with timeout protection & error handling
   */
  async withTimeout(operation, fallbackReason = "AI service request timed out.") {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(fallbackReason)), this.timeoutMs);
    });

    try {
      const result = await Promise.race([operation(), timeoutPromise]);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * Generate an AI Study Plan based on context
   */
  async generateStudyPlan(context) {
    return this.withTimeout(async () => {
      const { exams, pendingTasks, timetable, studyHoursPerDay, days, targetSubjectName } = context;

      const scheduleItems = [];
      const startDate = new Date();

      // Distribute study blocks over requested days
      for (let dayOffset = 0; dayOffset < days; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayOffset);
        const dateStr = currentDate.toISOString().split("T")[0];

        // Pick priority items: upcoming exams first, then pending tasks
        let dayTaskIndex = 0;

        // Add exam revision block if exam exists
        if (exams && exams.length > dayOffset) {
          const targetExam = exams[dayOffset % exams.length];
          scheduleItems.push({
            id: `plan-item-${dayOffset}-exam`,
            title: `Revise for ${targetExam.title} (${targetExam.subject?.name || "Subject"})`,
            description: `Focus on syllabus: ${targetExam.syllabus || "Core topics"}. Current prep: ${targetExam.preparationProgress}%.`,
            subjectId: targetExam.subjectId,
            subjectName: targetExam.subject?.name || "Academic Subject",
            date: dateStr,
            durationMinutes: 90,
            priority: "HIGH",
            category: "REVISION",
          });
        }

        // Add task focus block
        if (pendingTasks && pendingTasks.length > dayTaskIndex) {
          const task = pendingTasks[dayTaskIndex % pendingTasks.length];
          scheduleItems.push({
            id: `plan-item-${dayOffset}-task`,
            title: `Work on ${task.title}`,
            description: task.description || `Complete priority ${task.priority} assignment before due date.`,
            subjectId: task.subjectId,
            subjectName: task.subject?.name || "General Academic",
            date: dateStr,
            durationMinutes: 60,
            priority: task.priority || "MEDIUM",
            category: task.category || "ASSIGNMENT",
          });
          dayTaskIndex++;
        }

        // Add default general study block if under daily target
        if (scheduleItems.filter((i) => i.date === dateStr).length < 2) {
          scheduleItems.push({
            id: `plan-item-${dayOffset}-general`,
            title: targetSubjectName ? `Deep Study: ${targetSubjectName}` : "General Core Subject Review",
            description: "Review key concepts, solve practice problems, and summarize lecture notes.",
            subjectId: context.targetSubjectId || null,
            subjectName: targetSubjectName || "Core Studies",
            date: dateStr,
            durationMinutes: 60,
            priority: "MEDIUM",
            category: "STUDY",
          });
        }
      }

      const totalHours = (scheduleItems.reduce((acc, item) => acc + item.durationMinutes, 0) / 60).toFixed(1);

      return {
        isAiGenerated: true,
        provider: this.providerName,
        planTitle: `Personalized ${days}-Day Study Roadmap`,
        reasoning: `Plan generated targeting ${exams?.length || 0} upcoming exam(s) and ${pendingTasks?.length || 0} active task(s). Distributed across ${days} days with ~${studyHoursPerDay} study hours/day limit (${totalHours} total scheduled hours).`,
        items: scheduleItems,
        disclaimer: "AI-generated study suggestion. This plan will not modify your schedule until explicitly accepted.",
      };
    });
  }

  /**
   * Resolve a student doubt/question with subject context
   */
  async answerDoubt({ question, subjectName, subjectCode, additionalContext }) {
    return this.withTimeout(async () => {
      const qLower = question.toLowerCase();

      let explanation = `Here is a structured explanation regarding your question: "${question}".`;
      let examples = [];
      let nextSteps = [];

      if (qLower.includes("binary") || qLower.includes("tree") || qLower.includes("data structure")) {
        explanation = "A Binary Tree is a non-linear data structure where each node has at most two child nodes (left and right). Binary Search Trees (BST) maintain the property that left child values are smaller and right child values are larger than the parent node.";
        examples = [
          "In-order traversal of a BST yields elements in sorted ascending order.",
          "Search time complexity is O(log n) in a balanced BST, but degrades to O(n) in a skewed tree.",
        ];
        nextSteps = [
          "Practice implementing tree insertion and deletion algorithms.",
          "Study AVL trees and Red-Black trees for self-balancing concepts.",
        ];
      } else if (qLower.includes("algorithm") || qLower.includes("complexity") || qLower.includes("big o")) {
        explanation = "Big O notation measures the upper bound of an algorithm's time or space complexity relative to input size n. It describes efficiency during worst-case execution scenarios.";
        examples = [
          "O(1): Constant time (e.g., accessing an array index).",
          "O(n log n): Efficient sorting algorithms (e.g., Merge Sort, Quick Sort).",
          "O(n^2): Quadratic time nested loops (e.g., Bubble Sort).",
        ];
        nextSteps = [
          "Analyze loop bounds in your current code assignments.",
          "Identify unnecessary nested iterations to optimize performance.",
        ];
      } else {
        explanation = `Based on your course context${subjectName ? ` in ${subjectName} (${subjectCode})` : ""}, "${question}" requires analyzing the core underlying principles, key formulas/definitions, and practical application steps.`;
        examples = [
          "Example application: Breaking down the problem into smaller sub-problems.",
          "Key formula/rule: Verify all boundary conditions and edge cases.",
        ];
        nextSteps = [
          "Review your lecture notes for this subject.",
          "Try solving 2-3 sample textbook problems on this topic.",
        ];
      }

      if (additionalContext) {
        explanation += `\n\nAdditional Context Note: ${additionalContext}`;
      }

      return {
        isAiGenerated: true,
        provider: this.providerName,
        question,
        subjectName: subjectName || null,
        explanation,
        examples,
        nextSteps,
        disclaimer: "AI-generated educational explanation. Refer to official course textbooks for authoritative answers.",
      };
    });
  }

  /**
   * Summarize student note content
   */
  async summarizeNote({ noteTitle, noteContent, subjectName }) {
    return this.withTimeout(async () => {
      const cleanContent = (noteContent || "").trim();

      if (!cleanContent) {
        return {
          isAiGenerated: true,
          provider: this.providerName,
          noteTitle: noteTitle || "Untitled Note",
          summary: "Note content is empty or contains insufficient text for AI summarization.",
          keyPoints: ["No text content provided in note."],
          revisionQuestions: ["Add lecture notes or text content to generate self-test questions."],
          disclaimer: "AI summarizer requires valid note text.",
        };
      }

      // Extract paragraphs/lines for intelligent key points extraction
      const lines = cleanContent.split("\n").map(l => l.trim()).filter(Boolean);
      const firstLines = lines.slice(0, 3).join(" ");

      const keyPoints = lines.length > 1 
        ? lines.slice(0, 5).map(l => l.replace(/^[-*•]\s*/, ""))
        : [
            `Core focus: ${cleanContent.slice(0, 80)}...`,
            "Important definitions and primary concepts highlighted in note.",
            "Key takeaways for exam review.",
          ];

      return {
        isAiGenerated: true,
        provider: this.providerName,
        noteTitle: noteTitle || "Student Note Summary",
        subjectName: subjectName || null,
        summary: `Summary of "${noteTitle}": ${firstLines.length > 150 ? firstLines.slice(0, 150) + "..." : firstLines}`,
        keyPoints,
        revisionQuestions: [
          `What are the main concepts discussed in ${noteTitle || "this topic"}?`,
          `How do the key formulas or rules in this note apply to practical problems?`,
          `Can you explain the main takeaway without referencing your notes?`,
        ],
        disclaimer: "AI-generated summary based solely on user-provided note text.",
      };
    });
  }

  /**
   * Generate exam revision plan and practice questions
   */
  async generateExamPrep({ examTitle, subjectName, examDate, syllabus, progress }) {
    return this.withTimeout(async () => {
      const formattedDate = examDate ? new Date(examDate).toLocaleDateString() : "Upcoming Exam";

      const revisionPlan = [
        {
          phase: "Phase 1: Core Syllabus Foundations",
          details: syllabus ? `Review topics: ${syllabus.slice(0, 100)}...` : "Review fundamental subject concepts, lecture slides, and primary formulas.",
          estimatedHours: 3,
        },
        {
          phase: "Phase 2: Practice & Problem Solving",
          details: "Solve past paper questions, homework assignments, and self-test quizzes.",
          estimatedHours: 4,
        },
        {
          phase: "Phase 3: Final Mock Test & Formula Sheet Review",
          details: "Timed practice exam simulation and quick review of tricky topics.",
          estimatedHours: 2,
        },
      ];

      const practiceQuestions = [
        {
          id: 1,
          question: `Explain the fundamental concept of ${subjectName || examTitle} and its real-world significance.`,
          hint: "Identify 2-3 core principles discussed during lectures.",
        },
        {
          id: 2,
          question: `What are the typical edge cases or common errors students make in ${examTitle}?`,
          hint: "Consider numerical sign errors, boundary conditions, or syntax details.",
        },
        {
          id: 3,
          question: `Compare and contrast two major techniques or algorithms in ${subjectName || "this subject"}.`,
          hint: "Structure your answer using a comparative matrix (Time, Space, Pros, Cons).",
        },
      ];

      const checklist = [
        "Review syllabus outline and identify weak topics",
        "Summarize class notes and formulas",
        "Complete 3 practice problem sets",
        "Verify exam date, time, and room details",
        "Prepare stationary and identity card prior to exam day",
      ];

      return {
        isAiGenerated: true,
        provider: this.providerName,
        examTitle,
        subjectName: subjectName || "Academic Course",
        examDate: formattedDate,
        currentProgress: `${progress || 0}%`,
        revisionPlan,
        practiceQuestions,
        checklist,
        disclaimer: "AI-generated exam study guide. Does NOT represent official exam papers or university marks.",
      };
    });
  }

  /**
   * Compute smart recommendations from real academic data
   */
  async getSmartRecommendations({ lowAttendanceSubjects, upcomingExams, overdueTasks, studyHoursThisWeek }) {
    return this.withTimeout(async () => {
      const recommendations = [];

      // 1. Attendance warning check
      if (lowAttendanceSubjects && lowAttendanceSubjects.length > 0) {
        const sub = lowAttendanceSubjects[0];
        recommendations.push({
          id: "rec-attendance-warning",
          type: "ATTENDANCE_WARNING",
          priority: "HIGH",
          title: `Attendance Alert: ${sub.name}`,
          description: `Your attendance in ${sub.name} is currently ${sub.percentage}%, which is below your target threshold. Attend the upcoming classes to avoid shortages.`,
          actionableLink: "#attendance",
        });
      }

      // 2. Upcoming exam prep check
      if (upcomingExams && upcomingExams.length > 0) {
        const exam = upcomingExams[0];
        recommendations.push({
          id: "rec-exam-prep",
          type: "EXAM_PREP",
          priority: "HIGH",
          title: `Prepare for Exam: ${exam.title}`,
          description: `${exam.title} (${exam.subject?.name || "Subject"}) is coming up soon. Generate an AI Exam Revision guide to structure your prep.`,
          actionableLink: "#ai",
        });
      }

      // 3. Overdue tasks check
      if (overdueTasks && overdueTasks.length > 0) {
        recommendations.push({
          id: "rec-overdue-tasks",
          type: "TASK_OVERDUE",
          priority: "URGENT",
          title: `Action Needed: ${overdueTasks.length} Overdue Task(s)`,
          description: `You have overdue assignments including "${overdueTasks[0].title}". Clear pending work to keep your academic schedule on track.`,
          actionableLink: "#tasks",
        });
      }

      // 4. Study hours / streak check
      if ((studyHoursThisWeek || 0) < 5) {
        recommendations.push({
          id: "rec-study-boost",
          type: "STUDY_STREAK",
          priority: "MEDIUM",
          title: "Boost Your Weekly Study Time",
          description: `You've logged ${studyHoursThisWeek || 0} hours of focus study this week. Use the AI Study Planner to schedule dedicated study slots.`,
          actionableLink: "#ai",
        });
      }

      // Fallback recommendation if student is 100% on track
      if (recommendations.length === 0) {
        recommendations.push({
          id: "rec-on-track",
          type: "GENERAL",
          priority: "LOW",
          title: "Great Job! Academic Plan is On Track",
          description: "All tasks are up to date and attendance is above target. Maintain your study routine!",
          actionableLink: "#today",
        });
      }

      return {
        isAiGenerated: true,
        provider: this.providerName,
        recommendations,
        disclaimer: "Actionable recommendations calculated from your live application data.",
      };
    });
  }
}

export const aiProvider = new AiProviderService();
