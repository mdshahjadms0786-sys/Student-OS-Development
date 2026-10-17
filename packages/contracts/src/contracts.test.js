import { describe, it, expect } from "vitest";
import { RegisterRequestSchema, LoginRequestSchema } from "./auth.schema.js";
import {
  StudyPlanRequestSchema,
  DoubtAssistantRequestSchema,
} from "./ai.schema.js";

describe("Contracts Schema Validation", () => {
  it("validates a valid registration payload", () => {
    const validData = {
      email: "student@university.edu",
      password: "StrongPassword123!",
      name: "John Doe",
    };
    const result = RegisterRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email in registration", () => {
    const invalidData = {
      email: "invalid-email",
      password: "password123",
      name: "John Doe",
    };
    const result = RegisterRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("validates a valid login payload", () => {
    const validData = {
      email: "student@university.edu",
      password: "SecretPassword",
    };
    const result = LoginRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates AI study plan and doubt request payloads", () => {
    const planResult = StudyPlanRequestSchema.safeParse({
      studyHoursPerDay: 4,
      days: 7,
    });
    expect(planResult.success).toBe(true);

    const doubtResult = DoubtAssistantRequestSchema.safeParse({
      question: "How do binary trees work?",
    });
    expect(doubtResult.success).toBe(true);
  });
});
