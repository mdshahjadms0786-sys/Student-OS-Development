import { z } from "zod";

export const AttendanceStatusSchema = z.enum([
  "PRESENT",
  "ABSENT",
  "EXCUSED",
  "CANCELLED",
]);

export const CreateAttendanceRecordSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  date: z.coerce.date().default(() => new Date()),
  status: AttendanceStatusSchema.default("PRESENT"),
  remarks: z.string().max(255).optional().nullable(),
});

export const UpdateAttendanceRecordSchema = z.object({
  date: z.coerce.date().optional(),
  status: AttendanceStatusSchema.optional(),
  remarks: z.string().max(255).optional().nullable(),
});

export const BatchAttendanceSchema = z
  .object({
    subjectId: z.string().uuid("Invalid subject ID"),
    attended: z.number().int().min(0, "Attended classes cannot be negative"),
    total: z.number().int().min(0, "Total classes cannot be negative"),
  })
  .refine((data) => data.attended <= data.total, {
    message: "Attended classes cannot exceed total classes",
    path: ["attended"],
  });

export const AttendanceFilterQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
