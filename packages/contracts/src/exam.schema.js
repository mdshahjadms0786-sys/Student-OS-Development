import { z } from "zod";

export const ExamStatusSchema = z.enum([
  "UPCOMING",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export const CreateExamSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  examAt: z.coerce.date({ required_error: "Exam date and time is required" }),
  room: z.string().max(100).optional().nullable(),
  syllabus: z.string().max(5000).optional().nullable(),
  preparationProgress: z.number().int().min(0).max(100).default(0),
  status: ExamStatusSchema.default("UPCOMING"),
});

export const UpdateExamSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID").optional(),
  title: z.string().min(1, "Title cannot be empty").max(200).optional(),
  examAt: z.coerce.date().optional(),
  room: z.string().max(100).optional().nullable(),
  syllabus: z.string().max(5000).optional().nullable(),
  preparationProgress: z.number().int().min(0).max(100).optional(),
  status: ExamStatusSchema.optional(),
});

export const ExamFilterQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  status: ExamStatusSchema.optional(),
  upcomingOnly: z.coerce.boolean().optional(),
});
