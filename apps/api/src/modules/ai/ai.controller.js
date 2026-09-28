import {
  StudyPlanRequestSchema,
  StudyPlanAcceptSchema,
  DoubtAssistantRequestSchema,
  NotesSummaryRequestSchema,
  ExamPrepRequestSchema,
  AiRecommendationQuerySchema,
} from "@student-os/contracts";
import { AppError } from "../../middleware/error-handler.js";
import { AiService } from "./ai.service.js";

const aiService = new AiService();

export async function handleGenerateStudyPlan(req, res, next) {
  try {
    const userId = req.session.userId;
    if (!userId) throw new AppError("Unauthorized", 401);

    const parseResult = StudyPlanRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.errors[0].message, 400);
    }

    const plan = await aiService.generateStudyPlan(userId, parseResult.data);
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

export async function handleAcceptStudyPlan(req, res, next) {
  try {
    const userId = req.session.userId;
    if (!userId) throw new AppError("Unauthorized", 401);

    const parseResult = StudyPlanAcceptSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.errors[0].message, 400);
    }

    const result = await aiService.acceptStudyPlan(userId, parseResult.data.items);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleDoubtAssistant(req, res, next) {
  try {
    const userId = req.session.userId;
    if (!userId) throw new AppError("Unauthorized", 401);

    const parseResult = DoubtAssistantRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.errors[0].message, 400);
    }

    const result = await aiService.answerDoubt(userId, parseResult.data);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleNotesSummary(req, res, next) {
  try {
    const userId = req.session.userId;
    if (!userId) throw new AppError("Unauthorized", 401);

    const parseResult = NotesSummaryRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.errors[0].message, 400);
    }

    const summary = await aiService.summarizeNote(userId, parseResult.data);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

export async function handleExamPrep(req, res, next) {
  try {
    const userId = req.session.userId;
    if (!userId) throw new AppError("Unauthorized", 401);

    const parseResult = ExamPrepRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.errors[0].message, 400);
    }

    const prep = await aiService.generateExamPrep(userId, parseResult.data.examId);
    res.status(200).json({ success: true, data: prep });
  } catch (err) {
    next(err);
  }
}

export async function handleGetRecommendations(req, res, next) {
  try {
    const userId = req.session.userId;
    if (!userId) throw new AppError("Unauthorized", 401);

    const recommendations = await aiService.getSmartRecommendations(userId);
    res.status(200).json({ success: true, data: recommendations });
  } catch (err) {
    next(err);
  }
}
