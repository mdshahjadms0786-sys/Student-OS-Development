import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from "@student-os/ui";
import { Spinner } from "../components/ui/Spinner.jsx";
import { apiClient } from "../lib/api-client.js";
import { toast } from "sonner";
import {
  CalendarDays,
  BookOpen,
  Clock,
  ArrowRight,
  CheckSquare,
  Bell,
  Calendar,
  UserCheck,
  Award,
  FileText,
  BarChart3,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { useRouter } from "../lib/router.jsx";
import { useAuth } from "../lib/auth-context.jsx";
import { format, parseISO } from "date-fns";

export function HomePage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await apiClient("/api/dashboard/summary");
        if (res.success && res.data) {
          setSummary(res.data);
        }
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading)
    return (
      <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
        <div className="flex justify-center p-12">
          <Spinner className="h-8 w-8" />
        </div>
      </AppShell>
    );

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {summary?.greeting || "Welcome back"},{" "}
            {summary?.userName || user?.name || "Student"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here is your connected academic summary for today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("#tasks")}
            variant="outline"
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Tasks</span>
          </Button>
          <Button onClick={() => navigate("#calendar")} className="gap-2">
            <Calendar className="h-4 w-4" />
            <span>Calendar</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card
          className="cursor-pointer hover:border-slate-300 transition-colors"
          onClick={() => navigate("#today")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Classes
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.todayClassesCount || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Scheduled classes</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-slate-300 transition-colors"
          onClick={() => navigate("#tasks")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {summary?.pendingTasksCount ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tasks requiring action
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-slate-300 transition-colors"
          onClick={() => navigate("#attendance")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-2xl font-bold ${summary?.attendanceSummary?.isBelowTarget ? "text-amber-600" : "text-slate-900 dark:text-white"}`}
              >
                {summary?.attendanceSummary?.percentage !== null
                  ? `${summary?.attendanceSummary?.percentage}%`
                  : "N/A"}
              </span>
              <Badge
                variant={
                  summary?.attendanceSummary?.isBelowTarget
                    ? "destructive"
                    : "secondary"
                }
                className="text-[10px]"
              >
                Target: {summary?.attendanceSummary?.target || 75}%
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary?.attendanceSummary?.hasRecords
                ? `${summary.attendanceSummary.attended}/${summary.attendanceSummary.total} classes attended`
                : "No attendance records yet"}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-slate-300 transition-colors"
          onClick={() => navigate("#exams")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Exams
            </CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary?.upcomingExams?.length ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Upcoming assessments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next Class & Quick Actions */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Next Upcoming Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.nextClass ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold truncate">
                    {summary.nextClass.subject?.name || "Class"}
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {summary.nextClass.startTime} - {summary.nextClass.endTime}
                  </p>
                  {summary.nextClass.room && (
                    <p className="text-xs text-slate-500">
                      Room: {summary.nextClass.room}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => navigate("#today")}
                  >
                    View in Today Timeline
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-slate-500 py-3">
                  No further classes scheduled for today.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("#attendance")}
              >
                Track Attendance <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("#exams")}
              >
                Schedule & Prep Exams <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("#notes")}
              >
                Subject Notes <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("#analytics")}
              >
                Academic Analytics <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("#tasks")}
              >
                Tasks & Assignments <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("#calendar")}
              >
                Academic Calendar <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tasks & Deadlines (Phase 2 Cross-Module Integration) */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-amber-600" />
                  Upcoming Tasks & Deadlines
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tasks due in the coming days
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("#tasks")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Tasks →
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              {!summary?.upcomingTasks || summary.upcomingTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <CheckSquare className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm font-medium">
                    No pending tasks due soon!
                  </p>
                  <p className="text-xs text-slate-400">
                    Great job staying on top of coursework.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("#tasks")}
                    className="mt-2"
                  >
                    Add Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate("#tasks")}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {task.title}
                          </span>
                          {task.subject && (
                            <Badge variant="secondary" className="text-[10px]">
                              {task.subject.code}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due:{" "}
                          {format(parseISO(task.dueAt), "EEE, MMM d • h:mm a")}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          task.priority === "URGENT"
                            ? "border-red-500 text-red-600"
                            : task.priority === "HIGH"
                              ? "border-amber-500 text-amber-600"
                              : "border-slate-300 text-slate-600"
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Exams Card (Phase 3 Cross-Module Integration) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  Upcoming Exams & Assessments
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Countdown and preparation readiness
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("#exams")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Exams →
              </Button>
            </CardHeader>
            <CardContent>
              {!summary?.upcomingExams || summary.upcomingExams.length === 0 ? (
                <div className="text-center py-6 text-slate-500 space-y-1">
                  <p className="text-sm font-medium">
                    No upcoming exams scheduled.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("#exams")}
                    className="mt-2"
                  >
                    Schedule Exam
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => navigate("#exams")}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {exam.title}
                          </span>
                          {exam.subject && (
                            <Badge variant="secondary" className="text-[10px]">
                              {exam.subject.code}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>
                            {format(
                              parseISO(exam.examAt),
                              "EEE, MMM d • h:mm a",
                            )}
                          </span>
                          {exam.room && <span>• Room: {exam.room}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-medium">
                            Prep: {exam.preparationProgress}%
                          </div>
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-0.5">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${exam.preparationProgress}%` }}
                            />
                          </div>
                        </div>

                        <Badge
                          variant={
                            exam.daysRemaining <= 3
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {exam.daysRemaining <= 0
                            ? "Today"
                            : exam.daysRemaining === 1
                              ? "Tomorrow"
                              : `In ${exam.daysRemaining}d`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
