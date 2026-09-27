import { Router } from "express";
import { requireAuth } from "../../middleware/auth-guard.js";
import { ExamsService } from "./exams.service.js";
import {
  CreateExamSchema,
  UpdateExamSchema,
  ExamFilterQuerySchema,
} from "@student-os/contracts";

export const examsRouter = Router();
const examsService = new ExamsService();

examsRouter.use(requireAuth);

// GET /api/exams - list user exams with optional filters
examsRouter.get("/", async (req, res, next) => {
  try {
    const filters = ExamFilterQuerySchema.parse(req.query);
    const data = await examsService.listExams(req.user.id, filters);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/exams - create a new exam
examsRouter.post("/", async (req, res, next) => {
  try {
    const validated = CreateExamSchema.parse(req.body);
    const data = await examsService.createExam(req.user.id, validated);
    res.status(201).json({
      success: true,
      data,
      message: "Exam created successfully",
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/exams/:id - get single exam details
examsRouter.get("/:id", async (req, res, next) => {
  try {
    const data = await examsService.getExam(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/exams/:id - update an existing exam
examsRouter.patch("/:id", async (req, res, next) => {
  try {
    const validated = UpdateExamSchema.parse(req.body);
    const data = await examsService.updateExam(
      req.params.id,
      req.user.id,
      validated,
    );
    res.status(200).json({
      success: true,
      data,
      message: "Exam updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/exams/:id - delete an exam
examsRouter.delete("/:id", async (req, res, next) => {
  try {
    const data = await examsService.deleteExam(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      data,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});
