import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "@student-os/database";

const app = createApp();

describe("AI Intelligence API (Phase 4)", () => {
  let cookie;
  let subjectId;
  let noteId;
  let examId;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: "ai_test_student@example.com",
      },
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "ai_test_student@example.com",
      password: "Password123!",
      name: "AI Test Student",
    });
    cookie = res.get("Set-Cookie") || [];

    // Create a subject
    const subRes = await request(app)
      .post("/api/subjects")
      .set("Cookie", cookie)
      .send({
        code: "CS401",
        name: "Algorithms & Complexity",
        credits: 4,
      });
    subjectId = subRes.body.data.id;

    // Create a note
    const noteRes = await request(app)
      .post("/api/notes")
      .set("Cookie", cookie)
      .send({
        subjectId,
        title: "Dynamic Programming Foundations",
        content:
          "Dynamic Programming (DP) optimizes recursive solutions by storing overlapping subproblem solutions in a memoization table or bottom-up array. Key examples include Fibonacci, Knapsack, and Longest Common Subsequence.",
      });
    noteId = noteRes.body.data.id;

    // Create an exam
    const examRes = await request(app)
      .post("/api/exams")
      .set("Cookie", cookie)
      .send({
        subjectId,
        title: "Algorithms Final Exam",
        examAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        syllabus: "Graph Algorithms, Dynamic Programming, NP-Completeness",
        preparationProgress: 35,
      });
    examId = examRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: "ai_test_student@example.com",
      },
    });
  });

  it("rejects unauthorized AI endpoint requests", async () => {
    const res = await request(app).post("/api/ai/study-plan").send({});
    expect(res.status).toBe(401);
  });

  it("POST /api/ai/study-plan returns structured proposed plan without modifying database", async () => {
    const res = await request(app)
      .post("/api/ai/study-plan")
      .set("Cookie", cookie)
      .send({
        studyHoursPerDay: 3,
        days: 5,
        targetSubjectId: subjectId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAiGenerated).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.disclaimer).toBeDefined();
  });

  it("POST /api/ai/study-plan/accept creates real database tasks only upon explicit user acceptance", async () => {
    const planItem = {
      title: "AI Study Task: Graph Traversal Review",
      description: "Accepted from AI study roadmap",
      subjectId,
      date: new Date().toISOString(),
      durationMinutes: 60,
      priority: "HIGH",
      category: "STUDY",
    };

    const res = await request(app)
      .post("/api/ai/study-plan/accept")
      .set("Cookie", cookie)
      .send({
        items: [planItem],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.acceptedCount).toBe(1);
    expect(res.body.data.tasks[0].title).toBe(
      "AI Study Task: Graph Traversal Review"
    );

    // Verify task is now present in user's task list
    const tasksRes = await request(app).get("/api/tasks").set("Cookie", cookie);
    expect(
      tasksRes.body.data.some(
        (t) => t.title === "AI Study Task: Graph Traversal Review"
      )
    ).toBe(true);
  });

  it("POST /api/ai/doubt-assistant answers student questions with subject context", async () => {
    const res = await request(app)
      .post("/api/ai/doubt-assistant")
      .set("Cookie", cookie)
      .send({
        question: "What is time complexity of merge sort?",
        subjectId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAiGenerated).toBe(true);
    expect(res.body.data.explanation).toBeDefined();
    expect(res.body.data.examples).toBeDefined();
    expect(res.body.data.nextSteps).toBeDefined();
  });

  it("POST /api/ai/notes-summary generates key points and self-test questions from existing note", async () => {
    const res = await request(app)
      .post("/api/ai/notes-summary")
      .set("Cookie", cookie)
      .send({
        noteId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAiGenerated).toBe(true);
    expect(res.body.data.noteTitle).toBe("Dynamic Programming Foundations");
    expect(res.body.data.keyPoints.length).toBeGreaterThan(0);
    expect(res.body.data.revisionQuestions.length).toBeGreaterThan(0);
  });

  it("POST /api/ai/exam-prep generates structured revision guide for registered exam", async () => {
    const res = await request(app)
      .post("/api/ai/exam-prep")
      .set("Cookie", cookie)
      .send({
        examId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAiGenerated).toBe(true);
    expect(res.body.data.examTitle).toBe("Algorithms Final Exam");
    expect(res.body.data.revisionPlan.length).toBeGreaterThan(0);
    expect(res.body.data.practiceQuestions.length).toBeGreaterThan(0);
    expect(res.body.data.checklist.length).toBeGreaterThan(0);
  });

  it("GET /api/ai/recommendations computes real actionable study advice from live application data", async () => {
    const res = await request(app)
      .get("/api/ai/recommendations")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAiGenerated).toBe(true);
    expect(res.body.data.recommendations).toBeDefined();
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
  });
});
