import { z } from 'zod';

export const CreateTimetableEntryRequestSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  room: z.string().optional().nullable(),
  faculty: z.string().optional().nullable(),
  type: z.enum(['LECTURE', 'LAB', 'TUTORIAL', 'WORKSHOP', 'OTHER']).default('LECTURE'),
});

export const UpdateTimetableEntryRequestSchema = CreateTimetableEntryRequestSchema.partial();

export const TimetableEntryResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectId: z.string(),
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().nullable(),
  faculty: z.string().nullable(),
  type: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
