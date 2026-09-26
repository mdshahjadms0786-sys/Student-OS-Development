import { z } from 'zod';
import { SubjectResponseSchema } from './subject.schema.js';

export const CalendarItemTypeEnum = z.enum(['TASK', 'CLASS', 'EVENT']);
export type CalendarItemType = z.infer<typeof CalendarItemTypeEnum>;

export const CalendarItemResponseSchema = z.object({
  id: z.string(),
  type: CalendarItemTypeEnum,
  title: z.string(),
  description: z.string().nullable().optional(),
  startAt: z.string().or(z.date()),
  endAt: z.string().or(z.date()),
  status: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  subject: SubjectResponseSchema.nullable().optional(),
  relatedEntityId: z.string().nullable().optional(),
});
export type CalendarItemResponse = z.infer<typeof CalendarItemResponseSchema>;

export const CalendarQuerySchema = z.object({
  from: z.string().min(1, 'from query param is required'),
  to: z.string().min(1, 'to query param is required'),
});
export type CalendarQuery = z.infer<typeof CalendarQuerySchema>;
