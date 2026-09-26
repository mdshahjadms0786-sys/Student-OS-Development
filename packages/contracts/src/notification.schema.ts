import { z } from 'zod';

export const NotificationTypeEnum = z.enum([
  'CLASS',
  'ASSIGNMENT',
  'EXAM',
  'ATTENDANCE',
  'TASK',
  'SUMMARY',
  'SYSTEM',
]);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const NotificationResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeEnum,
  title: z.string(),
  message: z.string(),
  readAt: z.string().or(z.date()).nullable().optional(),
  scheduledAt: z.string().or(z.date()),
  relatedEntity: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

export const NotificationPreferenceResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeEnum,
  enabled: z.boolean(),
  timingMinutes: z.number(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type NotificationPreferenceResponse = z.infer<typeof NotificationPreferenceResponseSchema>;

export const UpdateNotificationPreferenceRequestSchema = z.object({
  type: NotificationTypeEnum,
  enabled: z.boolean().optional(),
  timingMinutes: z.number().int().min(0).max(10080).optional(),
});
export type UpdateNotificationPreferenceRequest = z.infer<
  typeof UpdateNotificationPreferenceRequestSchema
>;
