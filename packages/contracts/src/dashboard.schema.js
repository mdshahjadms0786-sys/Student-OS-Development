import { z } from 'zod';
import { SubjectResponseSchema } from './subject.schema.js';
import { TimetableEntryResponseSchema } from './timetable.schema.js';
import { TaskResponseSchema } from './task.schema.js';

export const DashboardSummaryResponseSchema = z.object({
  greeting: z.string(),
  userName: z.string(),
  todayClassesCount: z.number(),
  todayClasses: z.array(
    TimetableEntryResponseSchema.extend({
      subject: SubjectResponseSchema,
    })
  ),
  totalSubjectsCount: z.number(),
  nextClass: TimetableEntryResponseSchema.extend({ subject: SubjectResponseSchema }).nullable(),
  profileCompletionStatus: z.number(),
  pendingTasksCount: z.number().default(0),
  upcomingTasks: z.array(TaskResponseSchema).default([]),
  unreadNotificationsCount: z.number().default(0),
});
