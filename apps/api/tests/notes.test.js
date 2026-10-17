import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "@student-os/database";

const app = createApp();

describe("Notes API", () => {
  let cookie;
  let user2Cookie;
  let subjectId;
  let noteId;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["notes_test@example.com", "notes_user2@example.com"],
        },
      },
    });

    const res1 = await request(app).post("/api/auth/register").send({
      email: "notes_test@example.com",
      password: "Password123!",
      name: "Notes Student",
    });
    cookie = res1.get("Set-Cookie") || [];

    const res2 = await request(app).post("/api/auth/register").send({
      email: "notes_user2@example.com",
      password: "Password123!",
      name: "Notes User 2",
    });
    user2Cookie = res2.get("Set-Cookie") || [];

    const subRes = await request(app)
      .post("/api/subjects")
      .set("Cookie", cookie)
      .send({
        code: "CS501",
        name: "Artificial Intelligence Basics",
        credits: 3,
      });
    subjectId = subRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["notes_test@example.com", "notes_user2@example.com"],
        },
      },
    });
  });

  it("POST /api/notes creates a note with attachments and subject link", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Cookie", cookie)
      .send({
        subjectId,
        title: "Neural Networks Overview",
        content:
          "Perceptron models, backpropagation formulas, activation functions like ReLU and Sigmoid.",
        attachments: [
          {
            filename: "nn-diagram.png",
            url: "https://example.com/nn-diagram.png",
            size: 2048,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.title).toBe("Neural Networks Overview");
    expect(res.body.data.subjectId).toBe(subjectId);
    expect(res.body.data.attachments.length).toBe(1);
    expect(res.body.data.attachments[0].filename).toBe("nn-diagram.png");

    noteId = res.body.data.id;
  });

  it("GET /api/notes searches notes by keyword", async () => {
    // Search matching content keyword
    const res = await request(app)
      .get("/api/notes?search=backpropagation")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(noteId);

    // Search non-matching keyword
    const emptyRes = await request(app)
      .get("/api/notes?search=quantumcomputingspin")
      .set("Cookie", cookie);

    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data.length).toBe(0);
  });

  it("GET /api/notes filters by subjectId", async () => {
    const res = await request(app)
      .get(`/api/notes?subjectId=${subjectId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].subject.code).toBe("CS501");
  });

  it("PATCH /api/notes/:id updates note content", async () => {
    const res = await request(app)
      .patch(`/api/notes/${noteId}`)
      .set("Cookie", cookie)
      .send({
        title: "Neural Networks and Deep Learning",
        content: "Updated content with Transformers and Attention mechanisms.",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Neural Networks and Deep Learning");
    expect(res.body.data.content).toContain("Transformers");
  });

  it("protects notes ownership and rejects unauthorized access", async () => {
    const unauthorizedGet = await request(app)
      .get(`/api/notes/${noteId}`)
      .set("Cookie", user2Cookie);
    expect(unauthorizedGet.status).toBe(403);

    const unauthorizedDelete = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set("Cookie", user2Cookie);
    expect(unauthorizedDelete.status).toBe(403);
  });

  let uploadedAttachmentId;

  it("POST /api/notes/:id/attachments uploads a binary file successfully", async () => {
    const fileContent = Buffer.from("Sample lecture notes PDF content");
    const res = await request(app)
      .post(`/api/notes/${noteId}/attachments`)
      .set("Cookie", cookie)
      .attach("file", fileContent, {
        filename: "lecture-slides.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.filename).toBe("lecture-slides.pdf");
    expect(res.body.data.url).toContain(`/api/notes/${noteId}/attachments/`);
    uploadedAttachmentId = res.body.data.id;
  });

  it("POST /api/notes/:id/attachments rejects unsupported file types", async () => {
    const exeContent = Buffer.from("malicious executable content");
    const res = await request(app)
      .post(`/api/notes/${noteId}/attachments`)
      .set("Cookie", cookie)
      .attach("file", exeContent, {
        filename: "script.exe",
        contentType: "application/x-msdownload",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Unsupported file type");
  });

  it("GET /api/notes/:id/attachments/:attachmentId/download downloads the file and enforces IDOR", async () => {
    // Unauthorized user attempts download
    const unauthRes = await request(app)
      .get(`/api/notes/${noteId}/attachments/${uploadedAttachmentId}/download`)
      .set("Cookie", user2Cookie);
    expect(unauthRes.status).toBe(403);

    // Authorized download
    const res = await request(app)
      .get(`/api/notes/${noteId}/attachments/${uploadedAttachmentId}/download`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toContain("application/pdf");
    expect(res.body.toString()).toBe("Sample lecture notes PDF content");
  });

  it("DELETE /api/notes/:id/attachments/:attachmentId deletes attachment and enforces IDOR", async () => {
    // Unauthorized delete
    const unauthRes = await request(app)
      .delete(`/api/notes/${noteId}/attachments/${uploadedAttachmentId}`)
      .set("Cookie", user2Cookie);
    expect(unauthRes.status).toBe(403);

    // Authorized delete
    const res = await request(app)
      .delete(`/api/notes/${noteId}/attachments/${uploadedAttachmentId}`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is gone
    const checkRes = await request(app)
      .get(`/api/notes/${noteId}/attachments/${uploadedAttachmentId}/download`)
      .set("Cookie", cookie);
    expect(checkRes.status).toBe(404);
  });

  it("DELETE /api/notes/:id removes the note and its attachments", async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);

    const checkRes = await request(app)
      .get(`/api/notes/${noteId}`)
      .set("Cookie", cookie);
    expect(checkRes.status).toBe(404);
  });
});
