import { z } from 'zod';
import { AuthUserSchema } from './auth.schema.js';

export const StudentProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  program: z.string().nullable().optional(),
  semester: z.number().int().min(1).max(12).nullable().optional(),
  section: z.string().nullable().optional(),
  batch: z.string().nullable().optional(),
  academicYear: z.string().nullable().optional(),
});


export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  program: z.string().max(100).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  section: z.string().max(20).optional(),
  batch: z.string().max(50).optional(),
  academicYear: z.string().max(50).optional(),
});


export const UserWithProfileSchema = AuthUserSchema.extend({
  profile: StudentProfileSchema.nullable().optional(),
});

