import { prisma } from "@student-os/database";
import { AppError } from "../../middleware/error-handler.js";
import { createStorageAdapter } from "../../storage/storage-adapter.js";
import { env } from "../../config/env.js";

const storage = createStorageAdapter(
  env.STORAGE_DRIVER || "local",
  env.STORAGE_LOCAL_PATH || "./uploads",
);

function formatAttachment(att, noteId) {
  const isUrl =
    att.storageKey &&
    (att.storageKey.startsWith("http://") ||
      att.storageKey.startsWith("https://"));
  return {
    ...att,
    url: isUrl
      ? att.storageKey
      : `/api/notes/${noteId}/attachments/${att.id}/download`,
  };
}

export class NotesService {
  async listNotes(userId, filters = {}) {
    const where = { userId };

    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch attachments for these notes
    const noteIds = notes.map((n) => n.id);
    const attachments = await prisma.attachment.findMany({
      where: {
        userId,
        entityType: "NOTE",
        entityId: { in: noteIds },
      },
    });

    const attachmentsByNoteId = new Map();
    for (const att of attachments) {
      if (!attachmentsByNoteId.has(att.entityId)) {
        attachmentsByNoteId.set(att.entityId, []);
      }
      attachmentsByNoteId.get(att.entityId).push(att);
    }

    return notes.map((note) => ({
      ...note,
      attachments: (attachmentsByNoteId.get(note.id) || []).map((att) =>
        formatAttachment(att, note.id),
      ),
    }));
  }

  async getNote(id, userId) {
    const note = await prisma.note.findUnique({
      where: { id },
      include: { subject: true },
    });

    if (!note) {
      throw new AppError("Note not found", 404);
    }

    if (note.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        userId,
        entityType: "NOTE",
        entityId: id,
      },
    });

    return {
      ...note,
      attachments: attachments.map((att) => formatAttachment(att, id)),
    };
  }

  async createNote(userId, data) {
    if (data.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: data.subjectId, userId },
      });
      if (!subject) {
        throw new AppError("Subject not found or does not belong to user", 400);
      }
    }

    const note = await prisma.note.create({
      data: {
        userId,
        subjectId: data.subjectId || null,
        title: data.title,
        content: data.content,
      },
      include: { subject: true },
    });

    const createdAttachments = [];
    if (data.attachments && Array.isArray(data.attachments)) {
      for (const att of data.attachments) {
        const created = await prisma.attachment.create({
          data: {
            userId,
            entityType: "NOTE",
            entityId: note.id,
            filename: att.filename,
            storageKey: att.storageKey || att.url || "embedded",
            size: att.size || 0,
            mimeType: att.mimeType || "application/octet-stream",
          },
        });
        createdAttachments.push(created);
      }
    }

    return {
      ...note,
      attachments: createdAttachments.map((att) =>
        formatAttachment(att, note.id),
      ),
    };
  }

  async updateNote(id, userId, data) {
    const existing = await prisma.note.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Note not found", 404);
    }

    if (existing.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    if (data.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: data.subjectId, userId },
      });
      if (!subject) {
        throw new AppError("Subject not found or does not belong to user", 400);
      }
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
      include: { subject: true },
    });

    if (data.attachments && Array.isArray(data.attachments)) {
      await prisma.attachment.deleteMany({
        where: { entityType: "NOTE", entityId: id, userId },
      });
      for (const att of data.attachments) {
        await prisma.attachment.create({
          data: {
            userId,
            entityType: "NOTE",
            entityId: id,
            filename: att.filename,
            storageKey: att.storageKey || att.url || "embedded",
            size: att.size || 0,
            mimeType: att.mimeType || "application/octet-stream",
          },
        });
      }
    }

    const attachments = await prisma.attachment.findMany({
      where: { entityType: "NOTE", entityId: id, userId },
    });

    return {
      ...note,
      attachments: attachments.map((att) => formatAttachment(att, id)),
    };
  }

  async deleteNote(id, userId) {
    const existing = await prisma.note.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Note not found", 404);
    }

    if (existing.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    const attachments = await prisma.attachment.findMany({
      where: { entityType: "NOTE", entityId: id, userId },
    });

    for (const att of attachments) {
      if (
        att.storageKey &&
        !att.storageKey.startsWith("http://") &&
        !att.storageKey.startsWith("https://")
      ) {
        try {
          await storage.deleteFile(att.storageKey);
        } catch {
          // ignore error if file missing
        }
      }
    }

    await prisma.attachment.deleteMany({
      where: { entityType: "NOTE", entityId: id, userId },
    });

    await prisma.note.delete({
      where: { id },
    });

    return { id };
  }

  async addAttachment(noteId, userId, file) {
    await this.getNote(noteId, userId);

    if (!file || !file.buffer) {
      throw new AppError("No file buffer provided for upload", 400);
    }

    const uploadResult = await storage.uploadFile(
      {
        buffer: file.buffer,
        filename: file.originalname || "attachment",
        size: file.size,
        mimeType: file.mimetype || "application/octet-stream",
      },
      `notes/${noteId}`,
    );

    const attachment = await prisma.attachment.create({
      data: {
        userId,
        entityType: "NOTE",
        entityId: noteId,
        filename: file.originalname || "attachment",
        storageKey: uploadResult.storageKey,
        size: file.size,
        mimeType: file.mimetype || "application/octet-stream",
      },
    });

    return formatAttachment(attachment, noteId);
  }

  async deleteAttachment(noteId, attachmentId, userId) {
    await this.getNote(noteId, userId);

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (
      !attachment ||
      attachment.userId !== userId ||
      attachment.entityId !== noteId
    ) {
      throw new AppError("Attachment not found or unauthorized", 404);
    }

    if (
      attachment.storageKey &&
      !attachment.storageKey.startsWith("http://") &&
      !attachment.storageKey.startsWith("https://")
    ) {
      try {
        await storage.deleteFile(attachment.storageKey);
      } catch {
        // ignore
      }
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return { id: attachmentId };
  }

  async getAttachmentFile(noteId, attachmentId, userId) {
    await this.getNote(noteId, userId);

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (
      !attachment ||
      attachment.userId !== userId ||
      attachment.entityId !== noteId
    ) {
      throw new AppError("Attachment not found or unauthorized", 404);
    }

    if (
      attachment.storageKey &&
      (attachment.storageKey.startsWith("http://") ||
        attachment.storageKey.startsWith("https://"))
    ) {
      throw new AppError(
        "Attachment is an external link, not a downloadable file",
        400,
      );
    }

    const fileBuffer = await storage.getFile(attachment.storageKey);
    return {
      buffer: fileBuffer,
      attachment,
    };
  }
}
