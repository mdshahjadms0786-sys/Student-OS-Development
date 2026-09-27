import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "@student-os/database";

const app = createApp();

describe("Analytics API", () => {
  let cookie;
  let subjectId;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: "analytics_test@example.com",
      },
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "analytics_test@example.com",
      password: "Password123!",
      name: "Analytics Student",
    });
    cookie = res.get("Set-Cookie") || [];

    const subRes = await request(app)
      .post("/api/subjects")
      .set("Cookie", cookie)
      .send({
        code: "CS601",
        name: "Data Science",
        credits: 4,
      });
    subjectId = subRes.body.data.id;

    // Seed 1 task
    await request(app)
      .post("/api/tasks")
      .set("Cookie", cookie)
      .send({
        title: "Python Lab Exercise",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        priority: "HIGH",
        category: "ASSIGNMENT",
        subjectId,
      });

    // Seed 1 exam
    await request(app)
      .post("/api/exams")
      .set("Cookie", cookie)
      .send({
        subjectId,
        title: "Data Science Midterm",
        examAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        preparationProgress: 50,
      });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: "analytics_test@example.com",
      },
    });
  });

  it("GET /api/analytics/attendance returns real attendance metrics", async () => {
    // Record 4 present and 1 absent
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post("/api/attendance")
        .set("Cookie", cookie)
        .send({ subjectId, status: "PRESENT" });
    }
    await request(app)
      .post("/api/attendance")
      .set("Cookie", cookie)
      .send({ subjectId, status: "ABSENT" });

    const res = await request(app)
      .get("/api/analytics/attendance")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAttended).toBe(4);
    expect(res.body.data.totalClasses).toBe(5);
    expect(res.body.data.overallPercentage).toBe(80.0);
    expect(res.body.data.isBelowTarget).toBe(false);
    expect(res.body.data.subjects.length).toBe(1);
    expect(res.body.data.statusDistribution.length).toBeGreaterThan(0);
  });

  it("GET /api/analytics/tasks returns real task completion and distribution", async () => {
    const res = await request(app)
      .get("/api/analytics/tasks")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.completed).toBe(0);
    expect(res.body.data.completionRate).toBe(0);
    expect(res.body.data.statusDistribution).toBeDefined();
    expect(res.body.data.priorityDistribution).toBeDefined();
  });

  it("logs study session and retrieves real study-hours analytics", async () => {
    // Empty state check initially
    const emptyRes = await request(app)
      .get("/api/analytics/study-hours")
      .set("Cookie", cookie);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data.totalMinutes).toBe(0);
    expect(emptyRes.body.data.hasData).toBe(false);

    // Log a 90 minute study session
    const logRes = await request(app)
      .post("/api/analytics/study-sessions")
      .set("Cookie", cookie)
      .send({
        subjectId,
        durationMinutes: 90,
      });

    expect(logRes.status).toBe(201);
    expect(logRes.body.data.durationMinutes).toBe(90);

    // Verify analytics reflects the real study session
    const studyRes = await request(app)
      .get("/api/analytics/study-hours")
      .set("Cookie", cookie);
    expect(studyRes.status).toBe(200);
    expect(studyRes.body.data.totalMinutes).toBe(90);
    expect(studyRes.body.data.totalHours).toBe(1.5);
    expect(studyRes.body.data.hasData).toBe(true);
  });

  it("GET /api/analytics/exams returns exam preparation metrics", async () => {
    const res = await request(app)
      .get("/api/analytics/exams")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.averageProgress).toBe(50);
    expect(res.body.data.upcomingCount).toBe(1);
  });

  it("GET /api/analytics/academic-performance returns hasData: false when no marks exist without fabricating data", async () => {
    const res = await request(app)
      .get("/api/analytics/academic-performance")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.hasData).toBe(false);
    expect(res.body.data.message).toBeDefined();
    expect(res.body.data.trends).toEqual([]);
  });
});
