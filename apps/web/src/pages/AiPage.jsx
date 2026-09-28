import { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  CheckSquare,
  CalendarDays,
  Bot,
  Info,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { cn } from "@student-os/ui";

export function AiPage() {
  const [activeTab, setActiveTab] = useState("planner"); // planner | doubt | notes | exam | recommendations

  // Subjects for dropdowns
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [exams, setExams] = useState([]);

  // Study Planner state
  const [plannerOptions, setPlannerOptions] = useState({
    studyHoursPerDay: 4,
    days: 7,
    targetSubjectId: "",
  });
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [acceptingPlan, setAcceptingPlan] = useState(false);
  const [planAcceptedSuccess, setPlanAcceptedSuccess] = useState(null);

  // Doubt Assistant state
  const [doubtQuery, setDoubtQuery] = useState("");
  const [doubtSubjectId, setDoubtSubjectId] = useState("");
  const [doubtResult, setDoubtResult] = useState(null);
  const [doubtLoading, setDoubtLoading] = useState(false);

  // Notes Summary state
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [customNoteContent, setCustomNoteContent] = useState("");
  const [noteSummaryResult, setNoteSummaryResult] = useState(null);
  const [noteSummaryLoading, setNoteSummaryLoading] = useState(false);

  // Exam Prep state
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examPrepResult, setExamPrepResult] = useState(null);
  const [examPrepLoading, setExamPrepLoading] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  // Load initial subjects, notes, exams, and recommendations
  useEffect(() => {
    fetchInitialData();
    fetchRecommendations();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [subRes, notesRes, examsRes] = await Promise.all([
        fetch("/api/subjects"),
        fetch("/api/notes"),
        fetch("/api/exams"),
      ]);

      if (subRes.ok) {
        const d = await subRes.json();
        setSubjects(d.data || []);
      }
      if (notesRes.ok) {
        const d = await notesRes.json();
        setNotes(d.data || []);
      }
      if (examsRes.ok) {
        const d = await examsRes.json();
        setExams(d.data || []);
      }
    } catch {
      // Ignore initial fetch errors
    }
  };

  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const res = await fetch("/api/ai/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.data);
      }
    } catch {
      // Ignore recommendations load failure
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // 1. Generate Study Plan
  const handleGeneratePlan = async (e) => {
    e?.preventDefault();
    setPlanLoading(true);
    setErrorMsg("");
    setPlanAcceptedSuccess(null);
    try {
      const res = await fetch("/api/ai/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyHoursPerDay: Number(plannerOptions.studyHoursPerDay),
          days: Number(plannerOptions.days),
          targetSubjectId: plannerOptions.targetSubjectId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedPlan(data.data);
      } else {
        setErrorMsg(data.message || "Failed to generate study plan.");
      }
    } catch {
      setErrorMsg("Network error generating study plan.");
    } finally {
      setPlanLoading(false);
    }
  };

  // 2. Accept Study Plan
  const handleAcceptPlan = async () => {
    if (!generatedPlan || !generatedPlan.items) return;
    setAcceptingPlan(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/ai/study-plan/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: generatedPlan.items }),
      });
      const data = await res.json();
      if (res.ok) {
        setPlanAcceptedSuccess(data.data?.message || "Plan items added to your tasks!");
      } else {
        setErrorMsg(data.message || "Failed to accept plan.");
      }
    } catch {
      setErrorMsg("Error committing study plan.");
    } finally {
      setAcceptingPlan(false);
    }
  };

  // 3. Doubt Assistant
  const handleAskDoubt = async (e) => {
    e?.preventDefault();
    if (!doubtQuery.trim()) return;
    setDoubtLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/ai/doubt-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: doubtQuery,
          subjectId: doubtSubjectId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDoubtResult(data.data);
      } else {
        setErrorMsg(data.message || "Failed to resolve question.");
      }
    } catch {
      setErrorMsg("Network error resolving question.");
    } finally {
      setDoubtLoading(false);
    }
  };

  // 4. Summarize Note
  const handleSummarizeNote = async (e) => {
    e?.preventDefault();
    if (!selectedNoteId && !customNoteContent.trim()) return;
    setNoteSummaryLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/ai/notes-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: selectedNoteId || undefined,
          content: selectedNoteId ? undefined : customNoteContent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNoteSummaryResult(data.data);
      } else {
        setErrorMsg(data.message || "Failed to summarize note.");
      }
    } catch {
      setErrorMsg("Network error generating summary.");
    } finally {
      setNoteSummaryLoading(false);
    }
  };

  // 5. Exam Prep
  const handleGenerateExamPrep = async (e) => {
    e?.preventDefault();
    if (!selectedExamId) return;
    setExamPrepLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/ai/exam-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: selectedExamId }),
      });
      const data = await res.json();
      if (res.ok) {
        setExamPrepResult(data.data);
      } else {
        setErrorMsg(data.message || "Failed to generate exam prep guide.");
      }
    } catch {
      setErrorMsg("Network error generating exam prep.");
    } finally {
      setExamPrepLoading(false);
    }
  };

  return (
    <AppShell currentPath="#ai">
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-300" />
              <h1 className="text-2xl font-bold">AI Intelligence Center</h1>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                Phase 4 Active
              </span>
            </div>
            <p className="mt-1 text-sm text-blue-100">
              Personalized study planning, doubt resolution, note summaries & exam prep powered by your academic workflow.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3 text-xs text-blue-100 backdrop-blur-sm">
            <Bot className="h-5 w-5 text-amber-300 shrink-0" />
            <span>AI outputs require explicit user review & never alter official university records.</span>
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800">
          {[
            { id: "planner", label: "Study Planner", icon: CalendarDays },
            { id: "doubt", label: "Doubt Assistant", icon: HelpCircle },
            { id: "notes", label: "Notes Summary", icon: FileText },
            { id: "exam", label: "Exam Prep", icon: Award },
            { id: "recommendations", label: "Recommendations", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: STUDY PLANNER */}
        {activeTab === "planner" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form Column */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Configure Study Plan
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Generate an optimized daily schedule based on your upcoming exams and pending tasks.
              </p>

              <form onSubmit={handleGeneratePlan} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Daily Study Target (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={plannerOptions.studyHoursPerDay}
                    onChange={(e) => setPlannerOptions({ ...plannerOptions, studyHoursPerDay: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Plan Duration (Days)
                  </label>
                  <select
                    value={plannerOptions.days}
                    onChange={(e) => setPlannerOptions({ ...plannerOptions, days: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="3">3 Days (Sprint)</option>
                    <option value="7">7 Days (Full Week)</option>
                    <option value="14">14 Days (Two Weeks)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Priority Focus Subject (Optional)
                  </label>
                  <select
                    value={plannerOptions.targetSubjectId}
                    onChange={(e) => setPlannerOptions({ ...plannerOptions, targetSubjectId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">All Subjects (Balanced)</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={planLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {planLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  )}
                  <span>Generate Roadmap</span>
                </button>
              </form>
            </div>

            {/* Results Column */}
            <div className="space-y-4 lg:col-span-2">
              {planAcceptedSuccess && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>{planAcceptedSuccess}</span>
                  </div>
                  <a href="#tasks" className="font-semibold underline">View Tasks</a>
                </div>
              )}

              {generatedPlan ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {generatedPlan.planTitle}
                        </h3>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          AI Generated
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {generatedPlan.reasoning}
                      </p>
                    </div>

                    <button
                      onClick={handleAcceptPlan}
                      disabled={acceptingPlan}
                      className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:mt-0"
                    >
                      {acceptingPlan ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckSquare className="h-4 w-4" />
                      )}
                      <span>Accept Plan</span>
                    </button>
                  </div>

                  {/* Disclaimer banner */}
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>{generatedPlan.disclaimer}</span>
                  </div>

                  {/* Proposed Plan Items */}
                  <div className="mt-6 space-y-3">
                    {generatedPlan.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.title}
                            </span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {item.subjectName}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {item.durationMinutes} min
                          </span>
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
                  <Bot className="h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                    No Plan Generated Yet
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Configure your preferences on the left and click "Generate Roadmap" to create a personalized study schedule.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DOUBT ASSISTANT */}
        {activeTab === "doubt" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Ask a Question
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Get instant educational explanations, code examples, and next steps for your course subjects.
              </p>

              <form onSubmit={handleAskDoubt} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Course Subject Context (Optional)
                  </label>
                  <select
                    value={doubtSubjectId}
                    onChange={(e) => setDoubtSubjectId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">General Academic Question</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Your Question / Doubt
                  </label>
                  <textarea
                    rows={4}
                    value={doubtQuery}
                    onChange={(e) => setDoubtQuery(e.target.value)}
                    placeholder="e.g. How does binary search work and what is its time complexity?"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={doubtLoading || !doubtQuery.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {doubtLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  )}
                  <span>Ask AI Assistant</span>
                </button>
              </form>
            </div>

            {/* Result Column */}
            <div className="space-y-4 lg:col-span-2">
              {doubtResult ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        AI Doubt Resolution
                      </span>
                      <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                        "{doubtResult.question}"
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400">Explanation</h4>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {doubtResult.explanation}
                      </p>
                    </div>

                    {doubtResult.examples && doubtResult.examples.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-400">Examples & Applications</h4>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                          {doubtResult.examples.map((ex, i) => (
                            <li key={i}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {doubtResult.nextSteps && doubtResult.nextSteps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-400">Recommended Next Steps</h4>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                          {doubtResult.nextSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
                  <HelpCircle className="h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                    Ask Anything Academic
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Enter your question in the box to get structured explanations and learning steps.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: NOTES SUMMARY */}
        {activeTab === "notes" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Summarize Note
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Select an existing note or paste text to extract key points and self-test revision questions.
              </p>

              <form onSubmit={handleSummarizeNote} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Select Saved Note
                  </label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => {
                      setSelectedNoteId(e.target.value);
                      if (e.target.value) setCustomNoteContent("");
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Or Paste Custom Note Below --</option>
                    {notes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({n.subject?.name || "General"})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedNoteId && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Or Paste Text Content
                    </label>
                    <textarea
                      rows={5}
                      value={customNoteContent}
                      onChange={(e) => setCustomNoteContent(e.target.value)}
                      placeholder="Paste lecture notes or textbook summary here..."
                      className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={noteSummaryLoading || (!selectedNoteId && !customNoteContent.trim())}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {noteSummaryLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  )}
                  <span>Generate AI Summary</span>
                </button>
              </form>
            </div>

            {/* Summary Output Column */}
            <div className="space-y-4 lg:col-span-2">
              {noteSummaryResult ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        AI Note Summary
                      </span>
                      <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                        {noteSummaryResult.noteTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400">Summary Overview</h4>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        {noteSummaryResult.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400">Key Takeaways</h4>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                        {noteSummaryResult.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400">Self-Test Revision Questions</h4>
                      <div className="mt-2 space-y-2">
                        {noteSummaryResult.revisionQuestions.map((q, i) => (
                          <div key={i} className="rounded-lg bg-slate-50 p-3 text-xs font-medium text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                            Q{i + 1}: {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
                  <FileText className="h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                    Summarize Your Notes
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Select a note from the dropdown to automatically extract key concepts and practice questions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EXAM PREP */}
        {activeTab === "exam" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Exam Prep Generator
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Select an upcoming exam to generate structured revision timelines, practice questions, and prep checklists.
              </p>

              <form onSubmit={handleGenerateExamPrep} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Select Exam
                  </label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    required
                  >
                    <option value="">-- Choose Registered Exam --</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} ({ex.subject?.name || "Subject"})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={examPrepLoading || !selectedExamId}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {examPrepLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-white" />
                  )}
                  <span>Generate Exam Prep</span>
                </button>
              </form>
            </div>

            {/* Exam Prep Output */}
            <div className="space-y-4 lg:col-span-2">
              {examPrepResult ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        AI Exam Revision Guide
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {examPrepResult.examTitle}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {examPrepResult.subjectName} • Exam Date: {examPrepResult.examDate}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {/* Revision Plan */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Revision Plan Timeline</h4>
                      <div className="mt-2 space-y-3">
                        {examPrepResult.revisionPlan.map((step, idx) => (
                          <div key={idx} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100">
                              <span>{step.phase}</span>
                              <span className="text-blue-600">{step.estimatedHours} hrs</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{step.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Practice Questions */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Practice Questions & Hints</h4>
                      <div className="mt-2 space-y-3">
                        {examPrepResult.practiceQuestions.map((pq) => (
                          <div key={pq.id} className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-800/50">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              Q: {pq.question}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 italic">Hint: {pq.hint}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checklist */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Exam Readiness Checklist</h4>
                      <ul className="mt-2 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {examPrepResult.checklist.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
                  <Award className="h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                    Prepare For Exams
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Select a registered exam to build a complete revision roadmap and practice question set.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Smart Academic Recommendations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Computed live from your task completion rates, attendance thresholds, and exam schedules.
                </p>
              </div>

              <button
                onClick={fetchRecommendations}
                disabled={recommendationsLoading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", recommendationsLoading && "animate-spin")} />
                <span>Refresh</span>
              </button>
            </div>

            {recommendations && recommendations.recommendations ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {recommendations.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-semibold",
                            rec.priority === "HIGH" || rec.priority === "URGENT"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          )}
                        >
                          {rec.priority} PRIORITY
                        </span>
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      </div>
                      <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
                        {rec.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {rec.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <a
                        href={rec.actionableLink || "#home"}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <span>Take Action</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
                <Sparkles className="h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                  Loading Recommendations...
                </h3>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
