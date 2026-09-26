import { z } from 'zod';
import { SubjectResponseSchema } from './subject.schema.js';

export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const TaskCategoryEnum = z.enum(['ASSIGNMENT', 'PROJECT', 'STUDY', 'REVISION', 'OTHER']);
export type TaskCategory = z.infer<typeof TaskCategoryEnum>;

export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  subjectId: z.string().optional().nullable(),
  dueAt: z.string().min(1, 'Due date is required'),
  priority: TaskPriorityEnum.default('MEDIUM'),
  category: TaskCategoryEnum.default('ASSIGNMENT'),
  status: TaskStatusEnum.default('TODO'),
});
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

export const UpdateTaskRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').optional(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  subjectId: z.string().optional().nullable(),
  dueAt: z.string().optional(),
  priority: TaskPriorityEnum.optional(),
  category: TaskCategoryEnum.optional(),
  status: TaskStatusEnum.optional(),
  completedAt: z.string().or(z.date()).optional().nullable(),
});
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

export const TaskResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectId: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  dueAt: z.string().or(z.date()),
  priority: TaskPriorityEnum,
  category: TaskCategoryEnum,
  status: TaskStatusEnum,
  completedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  subject: SubjectResponseSchema.nullable().optional(),
});
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
