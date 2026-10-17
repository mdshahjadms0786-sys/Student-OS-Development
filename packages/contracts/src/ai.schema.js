import { z } from "zod";

export const StudyPlanRequestSchema = z.object({
  studyHoursPerDay: z.number().int().min(1).max(16).default(4),
  days: z.number().int().min(1).max(30).default(7),
  focusAreas: z.array(z.string()).optional(),
  targetSubjectId: z.string().uuid("Invalid subject ID").optional().nullable(),
});

export const StudyPlanItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  subjectId: z.string().uuid("Invalid subject ID").optional().nullable(),
  date: z.string().or(z.coerce.date()),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  category: z
    .enum(["ASSIGNMENT", "PROJECT", "STUDY", "REVISION", "OTHER"])
    .default("STUDY"),
});

export const StudyPlanAcceptSchema = z.object({
  items: z.array(StudyPlanItemSchema).min(1, "At least one item is required"),
});

export const DoubtAssistantRequestSchema = z.object({
  question: z
    .string()
    .min(2, "Question is too short")
    .max(2000, "Question is too long"),
  subjectId: z.string().uuid("Invalid subject ID").optional().nullable(),
  additionalContext: z.string().max(1000).optional().nullable(),
});

export const NotesSummaryRequestSchema = z
  .object({
    noteId: z.string().uuid("Invalid note ID").optional().nullable(),
    content: z
      .string()
      .max(10000, "Note content too long")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => data.noteId || (data.content && data.content.trim().length > 0),
    {
      message: "Either noteId or non-empty content must be provided",
    },
  );

export const ExamPrepRequestSchema = z.object({
  examId: z.string().uuid("Invalid exam ID"),
});

export const AiRecommendationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
