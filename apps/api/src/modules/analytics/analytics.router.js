import { Router } from "express";
import { requireAuth } from "../../middleware/auth-guard.js";
import { AnalyticsService } from "./analytics.service.js";
import { StudySessionCreateSchema } from "@student-os/contracts";

export const analyticsRouter = Router();
const analyticsService = new AnalyticsService();

analyticsRouter.use(requireAuth);

// GET /api/analytics/attendance
analyticsRouter.get("/attendance", async (req, res, next) => {
  try {
    const data = await analyticsService.getAttendanceAnalytics(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/tasks
analyticsRouter.get("/tasks", async (req, res, next) => {
  try {
    const data = await analyticsService.getTaskAnalytics(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/study-hours
analyticsRouter.get("/study-hours", async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days, 10) : 7;
    const data = await analyticsService.getStudyHoursAnalytics(
      req.user.id,
      days,
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/study-sessions - log study session
analyticsRouter.post("/study-sessions", async (req, res, next) => {
  try {
    const validated = StudySessionCreateSchema.parse(req.body);
    const data = await analyticsService.logStudySession(req.user.id, validated);
    res.status(201).json({
      success: true,
      data,
      message: "Study session logged successfully",
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/exams
analyticsRouter.get("/exams", async (req, res, next) => {
  try {
    const data = await analyticsService.getExamAnalytics(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/academic-performance
analyticsRouter.get("/academic-performance", async (req, res, next) => {
  try {
    const data = await analyticsService.getAcademicPerformanceAnalytics(
      req.user.id,
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});
