import { z } from "zod";

export const StudySessionCreateSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID").optional().nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(1440, "Duration cannot exceed 24 hours"),
  startedAt: z.coerce.date().default(() => new Date()),
  endedAt: z.coerce.date().optional(),
});
