import { Router } from "express";
import { requireAuth } from "../../middleware/auth-guard.js";
import {
  handleGenerateStudyPlan,
  handleAcceptStudyPlan,
  handleDoubtAssistant,
  handleNotesSummary,
  handleExamPrep,
  handleGetRecommendations,
} from "./ai.controller.js";

export const aiRouter = Router();

aiRouter.use(requireAuth);

// POST /api/ai/study-plan - generate intelligent study plan
aiRouter.post("/study-plan", handleGenerateStudyPlan);

// POST /api/ai/study-plan/accept - accept generated plan items and create tasks
aiRouter.post("/study-plan/accept", handleAcceptStudyPlan);

// POST /api/ai/doubt-assistant - resolve student question / doubt
aiRouter.post("/doubt-assistant", handleDoubtAssistant);

// POST /api/ai/notes-summary - summarize student notes
aiRouter.post("/notes-summary", handleNotesSummary);

// POST /api/ai/exam-prep - generate exam revision plan and practice questions
aiRouter.post("/exam-prep", handleExamPrep);

// GET /api/ai/recommendations - get real-time smart recommendations
aiRouter.get("/recommendations", handleGetRecommendations);
