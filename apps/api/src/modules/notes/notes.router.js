import { Router } from "express";
import { requireAuth } from "../../middleware/auth-guard.js";
import { NotesService } from "./notes.service.js";
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  NoteFilterQuerySchema,
} from "@student-os/contracts";

export const notesRouter = Router();
const notesService = new NotesService();

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
