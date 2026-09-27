import { z } from "zod";

export const NoteAttachmentSchema = z.object({
  filename: z.string().min(1),
  storageKey: z.string().optional(),
  url: z.string().url().optional(),
  size: z.number().int().optional(),
  mimeType: z.string().optional(),
});

export const CreateNoteSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID").optional().nullable(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  content: z.string().min(1, "Note content cannot be empty"),
  attachments: z.array(NoteAttachmentSchema).optional(),
});

export const UpdateNoteSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID").optional().nullable(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  attachments: z.array(NoteAttachmentSchema).optional(),
});

export const NoteFilterQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  search: z.string().optional(),
});
