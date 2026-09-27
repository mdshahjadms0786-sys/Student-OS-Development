import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "@student-os/database";

const app = createApp();

describe("Attendance API", () => {
  let cookie;
  let user2Cookie;
  let subjectId;
  let subject2Id;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["att_test@example.com", "att_user2@example.com"],
        },
      },
    });

    // 1. Register user 1
    const res1 = await request(app).post("/api/auth/register").send({
      email: "att_test@example.com",
      password: "Password123!",
      name: "Attendance Student",
    });
    cookie = res1.get("Set-Cookie") || [];

    // 2. Register user 2
    const res2 = await request(app).post("/api/auth/register").send({
      email: "att_user2@example.com",
      password: "Password123!",
      name: "Second Student",
    });
    user2Cookie = res2.get("Set-Cookie") || [];

    // 3. Create subjects for user 1
    const subRes1 = await request(app)
      .post("/api/subjects")
      .set("Cookie", cookie)
      .send({
        code: "CS301",
        name: "Operating Systems",
        credits: 4,
      });
    subjectId = subRes1.body.data.id;

    const subRes2 = await request(app)
      .post("/api/subjects")
      .set("Cookie", cookie)
      .send({
        code: "CS302",
        name: "Computer Networks",
        credits: 3,
      });
    subject2Id = subRes2.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["att_test@example.com", "att_user2@example.com"],
        },
      },
    });
  });

  it("GET /api/attendance safely handles zero attendance records without divide-by-zero", async () => {
    const res = await request(app).get("/api/attendance").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overall.totalClasses).toBe(0);
    expect(res.body.data.overall.totalAttended).toBe(0);
    expect(res.body.data.overall.percentage).toBeNull();
    expect(res.body.data.overall.formattedPercentage).toBe("N/A");
    expect(res.body.data.overall.hasRecords).toBe(false);
    expect(res.body.data.overall.isBelowTarget).toBe(false);

    // Subject stats should also be zero-safe
    const osSubject = res.body.data.subjects.find(
      (s) => s.subjectId === subjectId,
    );
    expect(osSubject).toBeDefined();
    expect(osSubject.total).toBe(0);
    expect(osSubject.percentage).toBeNull();
    expect(osSubject.hasRecords).toBe(false);
  });

  it("POST /api/attendance records class attendance and calculates percentage correctly", async () => {
    // Record 3 PRESENT sessions for CS301
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/api/attendance")
        .set("Cookie", cookie)
        .send({
          subjectId,
          date: new Date(Date.now() - i * 86400000).toISOString(),
          status: "PRESENT",
          remarks: `Class ${i + 1}`,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    }

    // Record 1 ABSENT session for CS301
    const absentRes = await request(app)
      .post("/api/attendance")
      .set("Cookie", cookie)
      .send({
        subjectId,
        date: new Date().toISOString(),
        status: "ABSENT",
        remarks: "Sick leave",
      });
    expect(absentRes.status).toBe(201);

    // Check stats: 3 present out of 4 total = 75.0%
    const detailRes = await request(app)
      .get(`/api/attendance/${subjectId}`)
      .set("Cookie", cookie);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.stats.attended).toBe(3);
    expect(detailRes.body.data.stats.total).toBe(4);
    expect(detailRes.body.data.stats.percentage).toBe(75.0);
    expect(detailRes.body.data.stats.isBelowTarget).toBe(false);
  });

  it("calculates warning state and classes needed when below target", async () => {
    // Add another ABSENT for CS301: 3/5 = 60.0% (below 75% target)
    await request(app).post("/api/attendance").set("Cookie", cookie).send({
      subjectId,
      date: new Date().toISOString(),
      status: "ABSENT",
    });

    const res = await request(app)
      .get(`/api/attendance/${subjectId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.attended).toBe(3);
    expect(res.body.data.stats.total).toBe(5);
    expect(res.body.data.stats.percentage).toBe(60.0);
    expect(res.body.data.stats.isBelowTarget).toBe(true);
    expect(res.body.data.stats.classesNeeded).toBeGreaterThan(0);

    // Also verify notification was triggered
    const notifRes = await request(app)
      .get("/api/notifications")
      .set("Cookie", cookie);
    const warning =
      notifRes.body.data.notifications?.find((n) => n.type === "ATTENDANCE") ||
      notifRes.body.data.find?.((n) => n.type === "ATTENDANCE");
    expect(warning).toBeDefined();
  });

  it("POST /api/attendance/batch sets aggregate attendance correctly", async () => {
    const res = await request(app)
      .post("/api/attendance/batch")
      .set("Cookie", cookie)
      .send({
        subjectId: subject2Id,
        attended: 18,
        total: 20,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.stats.attended).toBe(18);
    expect(res.body.data.stats.total).toBe(20);
    expect(res.body.data.stats.percentage).toBe(90.0);
    expect(res.body.data.stats.isBelowTarget).toBe(false);
    expect(res.body.data.stats.safeAbsences).toBeGreaterThan(0);
  });

  it("rejects invalid inputs and unauthorized access", async () => {
    // Attended > total should fail
    const invalidBatch = await request(app)
      .post("/api/attendance/batch")
      .set("Cookie", cookie)
      .send({
        subjectId: subject2Id,
        attended: 25,
        total: 20,
      });
    expect(invalidBatch.status).toBe(400);

    // User 2 cannot access or record attendance for User 1 subject
    const forbidden = await request(app)
      .post("/api/attendance")
      .set("Cookie", user2Cookie)
      .send({
        subjectId,
        status: "PRESENT",
      });
    expect(forbidden.status).toBe(404);

    const forbiddenGet = await request(app)
      .get(`/api/attendance/${subjectId}`)
      .set("Cookie", user2Cookie);
    expect(forbiddenGet.status).toBe(404);
  });
});
