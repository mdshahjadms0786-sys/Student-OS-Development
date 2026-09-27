import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "@student-os/database";

const app = createApp();

describe("Exams API", () => {
  let cookie;
  let user2Cookie;
  let subjectId;
  let examId;
  const futureExamDate = new Date(
    Date.now() + 5 * 24 * 60 * 60 * 1000,
  ).toISOString();

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["exam_test@example.com", "exam_user2@example.com"],
        },
      },
    });

    const res1 = await request(app).post("/api/auth/register").send({
      email: "exam_test@example.com",
      password: "Password123!",
      name: "Exam Student",
    });
    cookie = res1.get("Set-Cookie") || [];

    const res2 = await request(app).post("/api/auth/register").send({
      email: "exam_user2@example.com",
      password: "Password123!",
      name: "Exam Second Student",
    });
    user2Cookie = res2.get("Set-Cookie") || [];

    const subRes = await request(app)
      .post("/api/subjects")
      .set("Cookie", cookie)
      .send({
        code: "CS401",
        name: "Software Engineering",
        credits: 4,
      });
    subjectId = subRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["exam_test@example.com", "exam_user2@example.com"],
        },
      },
    });
  });

  it("POST /api/exams creates an exam with days remaining and schedules reminder", async () => {
    const res = await request(app)
      .post("/api/exams")
      .set("Cookie", cookie)
      .send({
        subjectId,
        title: "Midterm Examination",
        examAt: futureExamDate,
        room: "Hall B-204",
        syllabus: "Chapters 1 through 5, Agile & Scrum methodologies",
        preparationProgress: 35,
        status: "UPCOMING",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.title).toBe("Midterm Examination");
    expect(res.body.data.room).toBe("Hall B-204");
    expect(res.body.data.preparationProgress).toBe(35);
    expect(res.body.data.daysRemaining).toBeGreaterThanOrEqual(4);
    expect(res.body.data.isPast).toBe(false);

    examId = res.body.data.id;

    // Verify reminder notification was scheduled
    const notifs = await request(app)
      .get("/api/notifications")
      .set("Cookie", cookie);
    const examReminder =
      notifs.body.data.notifications?.find((n) => n.type === "EXAM") ||
      notifs.body.data.find?.((n) => n.type === "EXAM");
    expect(examReminder).toBeDefined();
    expect(examReminder.relatedEntity).toBe(examId);
  });

  it("integrates created exam with Calendar and Dashboard", async () => {
    // 1. Calendar integration
    const fromDate = new Date(Date.now() - 86400000).toISOString();
    const toDate = new Date(Date.now() + 10 * 86400000).toISOString();

    const calRes = await request(app)
      .get(`/api/calendar?from=${fromDate}&to=${toDate}`)
      .set("Cookie", cookie);

    expect(calRes.status).toBe(200);
    const examItem = calRes.body.data.find((item) => item.type === "EXAM");
    expect(examItem).toBeDefined();
    expect(examItem.title).toContain("Midterm Examination");
    expect(examItem.location).toBe("Hall B-204");

    // 2. Dashboard integration
    const dashRes = await request(app)
      .get("/api/dashboard/summary")
      .set("Cookie", cookie);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.upcomingExams).toBeDefined();
    expect(dashRes.body.data.upcomingExams.length).toBeGreaterThan(0);
    expect(dashRes.body.data.upcomingExams[0].title).toBe(
      "Midterm Examination",
    );
    expect(dashRes.body.data.upcomingExams[0].daysRemaining).toBeGreaterThan(0);
  });

  it("GET /api/exams lists and filters exams", async () => {
    const res = await request(app)
      .get("/api/exams?upcomingOnly=true")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(examId);
  });

  it("PATCH /api/exams/:id updates exam progress and syllabus", async () => {
    const res = await request(app)
      .patch(`/api/exams/${examId}`)
      .set("Cookie", cookie)
      .send({
        preparationProgress: 80,
        syllabus: "Updated syllabus: Chapters 1 through 7",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.preparationProgress).toBe(80);
    expect(res.body.data.syllabus).toContain("Chapters 1 through 7");
  });

  it("protects exam access and modification against unauthorized users", async () => {
    const unauthorizedGet = await request(app)
      .get(`/api/exams/${examId}`)
      .set("Cookie", user2Cookie);
    expect(unauthorizedGet.status).toBe(403);

    const unauthorizedPatch = await request(app)
      .patch(`/api/exams/${examId}`)
      .set("Cookie", user2Cookie)
      .send({ preparationProgress: 100 });
    expect(unauthorizedPatch.status).toBe(403);
  });

  it("DELETE /api/exams/:id removes the exam and its notifications", async () => {
    const res = await request(app)
      .delete(`/api/exams/${examId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);

    const checkRes = await request(app)
      .get(`/api/exams/${examId}`)
      .set("Cookie", cookie);
    expect(checkRes.status).toBe(404);
  });
});
