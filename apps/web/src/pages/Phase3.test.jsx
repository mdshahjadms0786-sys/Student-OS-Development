import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AttendancePage } from "./AttendancePage.jsx";
import { ExamsPage } from "./ExamsPage.jsx";
import { NotesPage } from "./NotesPage.jsx";
import { AnalyticsPage } from "./AnalyticsPage.jsx";
import { ThemeProvider } from "../lib/theme.jsx";

// Mock ResizeObserver for Recharts in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock auth context
vi.mock("../lib/auth-context.jsx", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Academic Student",
      email: "student@example.com",
      profileComplete: true,
    },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// Mock api client
vi.mock("../lib/api-client.js", () => ({
  apiClient: vi.fn().mockImplementation((url) => {
    if (url.includes("/api/attendance/batch")) {
      return Promise.resolve({ success: true, data: {} });
    }
    if (url.includes("/api/attendance")) {
      return Promise.resolve({
        success: true,
        data: {
          overall: {
            totalAttended: 24,
            totalClasses: 30,
            percentage: 80.0,
            formattedPercentage: "80.0%",
            target: 75.0,
            isBelowTarget: false,
            classesNeeded: 0,
            safeAbsences: 2,
            hasRecords: true,
          },
          subjects: [
            {
              subjectId: "sub-1",
              subjectCode: "CS101",
              subjectName: "Computer Programming",
              color: "#3b82f6",
              attended: 12,
              total: 15,
              percentage: 80.0,
              isBelowTarget: false,
              hasRecords: true,
            },
          ],
        },
      });
    }

    if (url.includes("/api/exams")) {
      return Promise.resolve({
        success: true,
        data: [
          {
            id: "exam-1",
            title: "Operating Systems Midterm",
            examAt: new Date(Date.now() + 86400000 * 5).toISOString(),
            room: "Hall 3A",
            syllabus: "Virtual Memory, Scheduling",
            preparationProgress: 60,
            status: "UPCOMING",
            daysRemaining: 5,
            subject: {
              id: "sub-1",
              code: "CS101",
              name: "Computer Programming",
            },
          },
        ],
      });
    }

    if (url.includes("/api/notes")) {
      return Promise.resolve({
        success: true,
        data: [
          {
            id: "note-1",
            title: "Processes vs Threads",
            content:
              "Threads share the same memory address space while processes have independent addresses.",
            updatedAt: new Date().toISOString(),
            subject: {
              id: "sub-1",
              code: "CS101",
              name: "Computer Programming",
              color: "#3b82f6",
            },
            attachments: [],
          },
        ],
      });
    }

    if (url.includes("/api/analytics/attendance")) {
      return Promise.resolve({
        success: true,
        data: {
          overallPercentage: 80.0,
          target: 75.0,
          isBelowTarget: false,
          hasData: true,
          subjects: [{ code: "CS101", percentage: 80, target: 75 }],
        },
      });
    }

    if (url.includes("/api/analytics/tasks")) {
      return Promise.resolve({
        success: true,
        data: {
          total: 5,
          completed: 4,
          completionRate: 80.0,
          hasData: true,
          statusDistribution: [
            { name: "Completed", value: 4, color: "#10b981" },
            { name: "Pending", value: 1, color: "#3b82f6" },
          ],
        },
      });
    }

    if (url.includes("/api/analytics/study-hours")) {
      return Promise.resolve({
        success: true,
        data: {
          totalMinutes: 180,
          totalHours: 3.0,
          averageDailyHours: 0.4,
          hasData: true,
          dailyBreakdown: [{ date: "2026-09-27", label: "Today", hours: 3.0 }],
        },
      });
    }

    if (url.includes("/api/analytics/exams")) {
      return Promise.resolve({
        success: true,
        data: {
          total: 1,
          averageProgress: 60,
          upcomingCount: 1,
          hasData: true,
          exams: [
            {
              id: "exam-1",
              title: "OS Midterm",
              subjectName: "CS101",
              preparationProgress: 60,
            },
          ],
        },
      });
    }

    if (url.includes("/api/analytics/academic-performance")) {
      return Promise.resolve({
        success: true,
        data: {
          hasData: false,
          message: "Official marks data not recorded yet.",
          trends: [],
        },
      });
    }

    if (url.includes("/api/subjects")) {
      return Promise.resolve({
        success: true,
        data: [
          {
            id: "sub-1",
            code: "CS101",
            name: "Computer Programming",
            color: "#3b82f6",
          },
        ],
      });
    }

    return Promise.resolve({ success: true, data: [] });
  }),
}));

describe("Phase 3 Frontend Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders AttendancePage with overall metrics and subject cards", async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <AttendancePage />
        </ThemeProvider>,
      );
    });

    expect(
      screen.getByRole("heading", { name: /^Attendance Tracking$/i }),
    ).toBeDefined();
    expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/24 attended out of 30 total classes/i),
    ).toBeDefined();
    expect(screen.getByText("Log Class")).toBeDefined();
    expect(screen.getByText("Batch Sync")).toBeDefined();
  });

  it("renders ExamsPage with countdown and schedule action", async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ExamsPage />
        </ThemeProvider>,
      );
    });

    expect(
      screen.getByRole("heading", { name: /^Exams & Assessments$/i }),
    ).toBeDefined();
    expect(screen.getByText("Operating Systems Midterm")).toBeDefined();
    expect(screen.getByText("In 5 days")).toBeDefined();
    expect(screen.getByText("Prep Progress")).toBeDefined();
    expect(screen.getByText("60%")).toBeDefined();
    expect(screen.getByText("Schedule Exam")).toBeDefined();
  });

  it("renders NotesPage with search and note cards", async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <NotesPage />
        </ThemeProvider>,
      );
    });

    expect(
      screen.getByRole("heading", { name: /^Subject Notes$/i }),
    ).toBeDefined();
    expect(screen.getByText("Processes vs Threads")).toBeDefined();
    expect(
      screen.getByPlaceholderText(/Search notes by title or content/i),
    ).toBeDefined();
    expect(screen.getByText("New Note")).toBeDefined();
  });

  it("renders AnalyticsPage with KPI cards and verified academic performance state", async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <AnalyticsPage />
        </ThemeProvider>,
      );
    });

    expect(
      screen.getByRole("heading", { name: /^Academic Analytics$/i }),
    ).toBeDefined();
    expect(screen.getByText("Subject Attendance vs Target")).toBeDefined();
    expect(screen.getByText("Task Status Distribution")).toBeDefined();
    expect(screen.getByText("Log Study Time")).toBeDefined();
    expect(
      screen.getByText(/Official marks data not recorded yet/i),
    ).toBeDefined();
  });
});
