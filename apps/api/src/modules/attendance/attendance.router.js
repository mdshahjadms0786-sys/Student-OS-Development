import { Router } from "express";
import { requireAuth } from "../../middleware/auth-guard.js";
import { AttendanceService } from "./attendance.service.js";
import {
  CreateAttendanceRecordSchema,
  UpdateAttendanceRecordSchema,
  BatchAttendanceSchema,
} from "@student-os/contracts";

export const attendanceRouter = Router();
const attendanceService = new AttendanceService();

attendanceRouter.use(requireAuth);

// GET /api/attendance - overall attendance summary & subject breakdown
attendanceRouter.get("/", async (req, res, next) => {
  try {
    const data = await attendanceService.getOverallAttendance(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/attendance/:subjectId - attendance records and stats for a specific subject
attendanceRouter.get("/:subjectId", async (req, res, next) => {
  try {
    const data = await attendanceService.getSubjectAttendance(
      req.user.id,
      req.params.subjectId,
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/attendance - record class session attendance
attendanceRouter.post("/", async (req, res, next) => {
  try {
    const validated = CreateAttendanceRecordSchema.parse(req.body);
    const data = await attendanceService.recordAttendance(
      req.user.id,
      validated,
    );
    res.status(201).json({
      success: true,
      data,
      message: "Attendance recorded successfully",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/attendance/batch - set or sync aggregate attended/total classes
attendanceRouter.post("/batch", async (req, res, next) => {
  try {
    const validated = BatchAttendanceSchema.parse(req.body);
    const data = await attendanceService.batchUpdateAttendance(
      req.user.id,
      validated,
    );
    res.status(200).json({
      success: true,
      data,
      message: "Batch attendance updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/attendance/:id - update an existing attendance record
attendanceRouter.patch("/:id", async (req, res, next) => {
  try {
    const validated = UpdateAttendanceRecordSchema.parse(req.body);
    const data = await attendanceService.updateAttendanceRecord(
      req.params.id,
      req.user.id,
      validated,
    );
    res.status(200).json({
      success: true,
      data,
      message: "Attendance record updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/attendance/:id - delete an attendance record
attendanceRouter.delete("/:id", async (req, res, next) => {
  try {
    const data = await attendanceService.deleteAttendanceRecord(
      req.params.id,
      req.user.id,
    );
    res.status(200).json({
      success: true,
      data,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});
