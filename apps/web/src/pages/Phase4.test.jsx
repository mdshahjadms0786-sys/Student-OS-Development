import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AiPage } from "./AiPage.jsx";
import { ThemeProvider } from "../lib/theme.jsx";

// Mock ResizeObserver
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
      name: "AI Test Student",
      email: "ai_student@example.com",
      profileComplete: true,
    },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// Mock router context
vi.mock("../lib/router.jsx", () => ({
  useRouter: () => ({
    currentPath: "#ai",
    navigate: vi.fn(),
  }),
  ProtectedRoute: ({ children }) => children,
}));

describe("Phase 4 AI Frontend Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/api/subjects")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [{ id: "s1", code: "CS101", name: "Data Structures" }],
            }),
        });
      }
      if (url.includes("/api/notes")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: "n1",
                  title: "Binary Trees Note",
                  content: "Tree concepts",
                },
              ],
            }),
        });
      }
      if (url.includes("/api/exams")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: "e1",
                  title: "Data Structures Final Exam",
                  examAt: new Date().toISOString(),
                },
              ],
            }),
        });
      }
      if (url.includes("/api/ai/recommendations")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                isAiGenerated: true,
                recommendations: [
                  {
                    id: "r1",
                    title: "Action Needed: Overdue Work",
                    description: "Clear pending assignments",
                    priority: "HIGH",
                    actionableLink: "#tasks",
                  },
                ],
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });
    });
  });

  it("renders AiPage header, tabs, and Study Planner form controls", async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <AiPage />
        </ThemeProvider>,
      );
    });

    expect(
      screen.getByRole("heading", { name: /^AI Intelligence Center$/i }),
    ).toBeDefined();
    expect(screen.getByText("Phase 4 Active")).toBeDefined();
    expect(screen.getByText("Study Planner")).toBeDefined();
    expect(screen.getByText("Doubt Assistant")).toBeDefined();
    expect(screen.getByText("Notes Summary")).toBeDefined();
    expect(screen.getByText("Exam Prep")).toBeDefined();
    expect(screen.getByText("Recommendations")).toBeDefined();
    expect(screen.getByText("Configure Study Plan")).toBeDefined();
    expect(screen.getByText("Generate Roadmap")).toBeDefined();
  });
});
