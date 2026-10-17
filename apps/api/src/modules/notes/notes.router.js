import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth-guard.js";
import { AppError } from "../../middleware/error-handler.js";
import { NotesService } from "./notes.service.js";
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  NoteFilterQuerySchema,
} from "@student-os/contracts";

export const notesRouter = Router();
const notesService = new NotesService();

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, JPG, WEBP, GIF, TXT, MD, DOC, DOCX`,
          400,
        ),
      );
    }
  },
});

notesRouter.use(requireAuth);

// GET /api/notes - list notes with subject and search filter
notesRouter.get("/", async (req, res, next) => {
  try {
    const filters = NoteFilterQuerySchema.parse(req.query);
    const data = await notesService.listNotes(req.user.id, filters);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notes - create note
notesRouter.post("/", async (req, res, next) => {
  try {
    const validated = CreateNoteSchema.parse(req.body);
    const data = await notesService.createNote(req.user.id, validated);
    res.status(201).json({
      success: true,
      data,
      message: "Note created successfully",
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notes/:id - get single note
notesRouter.get("/:id", async (req, res, next) => {
  try {
    const data = await notesService.getNote(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notes/:id - update note
notesRouter.patch("/:id", async (req, res, next) => {
  try {
    const validated = UpdateNoteSchema.parse(req.body);
    const data = await notesService.updateNote(
      req.params.id,
      req.user.id,
      validated,
    );
    res.status(200).json({
      success: true,
      data,
      message: "Note updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notes/:id - delete note
notesRouter.delete("/:id", async (req, res, next) => {
  try {
    const data = await notesService.deleteNote(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      data,
      message: "Note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notes/:id/attachments - upload binary file attachment
notesRouter.post(
  "/:id/attachments",
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(
          "No file uploaded. Please provide a file with field name 'file'.",
          400,
        );
      }
      const data = await notesService.addAttachment(
        req.params.id,
        req.user.id,
        req.file,
      );
      res.status(201).json({
        success: true,
        data,
        message: "Attachment uploaded successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/notes/:id/attachments/:attachmentId/download - download attachment
notesRouter.get(
  "/:id/attachments/:attachmentId/download",
  async (req, res, next) => {
    try {
      const { buffer, attachment } = await notesService.getAttachmentFile(
        req.params.id,
        req.params.attachmentId,
        req.user.id,
      );

      res.setHeader(
        "Content-Type",
        attachment.mimeType || "application/octet-stream",
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(attachment.filename)}"`,
      );
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/notes/:id/attachments/:attachmentId - delete attachment
notesRouter.delete("/:id/attachments/:attachmentId", async (req, res, next) => {
  try {
    const data = await notesService.deleteAttachment(
      req.params.id,
      req.params.attachmentId,
      req.user.id,
    );
    res.status(200).json({
      success: true,
      data,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});
