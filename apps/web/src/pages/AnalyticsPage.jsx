import * as React from "react";
import { Card, CardContent, Button, Badge } from "@student-os/ui";
import { Spinner } from "../components/ui/Spinner.jsx";
import { apiClient } from "../lib/api-client.js";
import { toast } from "sonner";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  UserCheck,
  Award,
  TrendingUp,
  Plus,
  HelpCircle,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { useRouter } from "../lib/router.jsx";
import { useAuth } from "../lib/auth-context.jsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export function AnalyticsPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [attendanceData, setAttendanceData] = React.useState(null);
  const [taskData, setTaskData] = React.useState(null);
  const [studyData, setStudyData] = React.useState(null);
  const [examData, setExamData] = React.useState(null);
  const [academicData, setAcademicData] = React.useState(null);
  const [subjects, setSubjects] = React.useState([]);

  // Study session modal
  const [isStudyModalOpen, setIsStudyModalOpen] = React.useState(false);
  const [studySubjectId, setStudySubjectId] = React.useState("");
  const [studyDuration, setStudyDuration] = React.useState(60);
  const [savingStudy, setSavingStudy] = React.useState(false);

  const fetchAnalytics = React.useCallback(async () => {
    try {
      const [attRes, taskRes, studyRes, examRes, acadRes, subRes] =
        await Promise.all([
          apiClient("/api/analytics/attendance"),
          apiClient("/api/analytics/tasks"),
          apiClient("/api/analytics/study-hours?days=7"),
          apiClient("/api/analytics/exams"),
          apiClient("/api/analytics/academic-performance"),
          apiClient("/api/subjects"),
        ]);

      if (attRes.success && attRes.data) setAttendanceData(attRes.data);
      if (taskRes.success && taskRes.data) setTaskData(taskRes.data);
      if (studyRes.success && studyRes.data) setStudyData(studyRes.data);
      if (examRes.success && examRes.data) setExamData(examRes.data);
      if (acadRes.success && acadRes.data) setAcademicData(acadRes.data);
      if (subRes.success && subRes.data) {
        setSubjects(subRes.data);
        if (subRes.data.length > 0 && !studySubjectId) {
          setStudySubjectId(subRes.data[0].id);
        }
      }
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [studySubjectId]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleLogStudy = async (e) => {
    e.preventDefault();
    setSavingStudy(true);
    try {
      const res = await apiClient("/api/analytics/study-sessions", {
        method: "POST",
        body: JSON.stringify({
          subjectId: studySubjectId || null,
          durationMinutes: Number(studyDuration),
        }),
      });
      if (res.success) {
        toast.success("Study session logged");
        setIsStudyModalOpen(false);
        fetchAnalytics();
      }
    } catch (err) {
      toast.error(err.message || "Failed to log study session");
    } finally {
      setSavingStudy(false);
    }
  };

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Academic Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Real application statistics across attendance, task completion,
              study habits, and exam readiness.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsStudyModalOpen(true)}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Clock className="h-4 w-4" />
            <span>Log Study Time</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Overall Attendance
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {attendanceData?.overallPercentage !== null
                      ? `${attendanceData.overallPercentage}%`
                      : "N/A"}
                  </span>
                  <Badge
                    variant={
                      attendanceData?.isBelowTarget
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    Target: {attendanceData?.target}%
                  </Badge>
                </div>
              </Card>

              <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Task Completion
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {taskData?.completionRate !== null
                      ? `${taskData.completionRate}%`
                      : "N/A"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {taskData?.completed || 0}/{taskData?.total || 0} tasks
                  </span>
                </div>
              </Card>

              <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  7-Day Study Time
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {studyData?.totalHours || 0} hrs
                  </span>
                  <span className="text-xs text-slate-500">
                    ~{studyData?.averageDailyHours || 0} h/day
                  </span>
                </div>
              </Card>

              <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Exam Readiness
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {examData?.averageProgress || 0}%
                  </span>
                  <span className="text-xs text-slate-500">
                    {examData?.upcomingCount || 0} upcoming
                  </span>
                </div>
              </Card>
            </div>

            {/* Charts Section 1: Attendance & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Chart */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-blue-500" />
                        Subject Attendance vs Target
                      </h3>
                      <p className="text-xs text-slate-500">
                        Attendance percentage across all enrolled subjects
                      </p>
                    </div>
                  </div>

                  {!attendanceData?.hasData ? (
                    <div className="flex h-56 flex-col items-center justify-center text-center p-4 border border-dashed rounded-lg">
                      <UserCheck className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        No attendance records logged yet
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 text-xs"
                        onClick={() => navigate("#attendance")}
                      >
                        Log Attendance
                      </Button>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={attendanceData.subjects}
                          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                        >
                          <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11 }}
                            unit="%"
                          />
                          <Tooltip
                            formatter={(value) => [`${value}%`, "Attendance"]}
                            labelFormatter={(label) => `Subject: ${label}`}
                          />
                          <ReferenceLine
                            y={attendanceData.target}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            label={{
                              value: `Target ${attendanceData.target}%`,
                              fill: "#ef4444",
                              fontSize: 10,
                              position: "top",
                            }}
                          />
                          <Bar
                            dataKey="percentage"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Task Completion Donut */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Task Status Distribution
                      </h3>
                      <p className="text-xs text-slate-500">
                        Breakdown of pending and completed tasks
                      </p>
                    </div>
                  </div>

                  {!taskData?.hasData ? (
                    <div className="flex h-56 flex-col items-center justify-center text-center p-4 border border-dashed rounded-lg">
                      <CheckCircle2 className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        No tasks created yet
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 text-xs"
                        onClick={() => navigate("#tasks")}
                      >
                        Create Task
                      </Button>
                    </div>
                  ) : (
                    <div className="h-64 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskData.statusDistribution.filter(
                              (s) => s.value > 0,
                            )}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {taskData.statusDistribution
                              .filter((s) => s.value > 0)
                              .map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `${value} tasks`,
                              name,
                            ]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconSize={8}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Section 2: Study Hours & Exam Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Study Hours Chart */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-500" />
                        Daily Study Hours (Past 7 Days)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tracked revision and assignment time
                      </p>
                    </div>
                  </div>

                  {!studyData?.hasData ? (
                    <div className="flex h-56 flex-col items-center justify-center text-center p-4 border border-dashed rounded-lg">
                      <Clock className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        No study sessions logged for this period
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 text-xs"
                        onClick={() => setIsStudyModalOpen(true)}
                      >
                        Log Study Session
                      </Button>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={studyData.dailyBreakdown}
                          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                        >
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} unit="h" />
                          <Tooltip
                            formatter={(value) => [
                              `${value} hours`,
                              "Study Time",
                            ]}
                          />
                          <Bar
                            dataKey="hours"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exam Preparation Progress */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        Exam Preparation Readiness
                      </h3>
                      <p className="text-xs text-slate-500">
                        Syllabus revision progress per exam
                      </p>
                    </div>
                  </div>

                  {!examData?.hasData ? (
                    <div className="flex h-56 flex-col items-center justify-center text-center p-4 border border-dashed rounded-lg">
                      <Award className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        No upcoming exams scheduled
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 text-xs"
                        onClick={() => navigate("#exams")}
                      >
                        Schedule Exam
                      </Button>
                    </div>
                  ) : (
                    <div className="h-64 w-full overflow-y-auto space-y-4 pr-1">
                      {examData.exams.map((exam) => (
                        <div key={exam.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {exam.title} ({exam.subjectName})
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {exam.preparationProgress}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all duration-300"
                              style={{ width: `${exam.preparationProgress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Academic Performance Trends — Strictly Real Application Data */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Academic Performance Trend
                  </h3>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
                  <HelpCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {academicData?.message ||
                      "Official examination marks have not been recorded yet."}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    In compliance with Student OS data integrity standards,
                    historical performance trends are strictly computed from
                    verified academic marks and are never fabricated.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Log Study Session Modal */}
      {isStudyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Log Study Session
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Record time spent studying, revising, or completing academic work.
            </p>

            <form onSubmit={handleLogStudy} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject
                </label>
                <select
                  value={studySubjectId}
                  onChange={(e) => setStudySubjectId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">General Study (No Subject)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="720"
                  step="5"
                  value={studyDuration}
                  onChange={(e) =>
                    setStudyDuration(Math.max(1, parseInt(e.target.value) || 0))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {(studyDuration / 60).toFixed(1)} hours
                </span>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStudyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingStudy}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {savingStudy ? "Saving..." : "Record Session"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
