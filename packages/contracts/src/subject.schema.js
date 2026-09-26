import { z } from 'zod';

export const CreateSubjectRequestSchema = z.object({
  code: z.string().min(1, 'Subject code is required'),
  name: z.string().min(1, 'Subject name is required'),
  credits: z.coerce.number().int().min(1).max(10).default(3),
  facultyName: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export const UpdateSubjectRequestSchema = CreateSubjectRequestSchema.partial();

export const SubjectResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  code: z.string(),
  name: z.string(),
  credits: z.number(),
  facultyName: z.string().nullable(),
  color: z.string().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
