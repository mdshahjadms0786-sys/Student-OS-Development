import * as React from "react";
import { Card, CardContent, Button, Badge } from "@student-os/ui";
import { Spinner } from "../components/ui/Spinner.jsx";
import { apiClient } from "../lib/api-client.js";
import { toast } from "sonner";
import {
  Award,
  Plus,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  BarChart,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { useRouter } from "../lib/router.jsx";
import { useAuth } from "../lib/auth-context.jsx";
import { format, parseISO } from "date-fns";

export function ExamsPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [exams, setExams] = React.useState([]);
  const [subjects, setSubjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("ALL"); // ALL, UPCOMING, COMPLETED

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingExam, setEditingExam] = React.useState(null);

  // Form states
  const [title, setTitle] = React.useState("");
  const [subjectId, setSubjectId] = React.useState("");
  const [examDate, setExamDate] = React.useState("");
  const [examTime, setExamTime] = React.useState("09:00");
  const [room, setRoom] = React.useState("");
  const [syllabus, setSyllabus] = React.useState("");
  const [preparationProgress, setPreparationProgress] = React.useState(0);
  const [status, setStatus] = React.useState("UPCOMING");
  const [saving, setSaving] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const [examsRes, subsRes] = await Promise.all([
        apiClient("/api/exams"),
        apiClient("/api/subjects"),
      ]);

      if (examsRes.success && examsRes.data) {
        setExams(examsRes.data);
      }
      if (subsRes.success && subsRes.data) {
        setSubjects(subsRes.data);
        if (subsRes.data.length > 0 && !subjectId) {
          setSubjectId(subsRes.data[0].id);
        }
      }
    } catch {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingExam(null);
    setTitle("");
    if (subjects.length > 0) setSubjectId(subjects[0].id);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    setExamDate(format(tomorrow, "yyyy-MM-dd"));
    setExamTime("09:00");
    setRoom("");
    setSyllabus("");
    setPreparationProgress(0);
    setStatus("UPCOMING");
    setIsModalOpen(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setTitle(exam.title);
    setSubjectId(exam.subjectId);
    const d = new Date(exam.examAt);
    setExamDate(format(d, "yyyy-MM-dd"));
    setExamTime(format(d, "HH:mm"));
    setRoom(exam.room || "");
    setSyllabus(exam.syllabus || "");
    setPreparationProgress(exam.preparationProgress || 0);
    setStatus(exam.status || "UPCOMING");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Exam title is required");
      return;
    }
    if (!subjectId) {
      toast.error("Please select a subject");
      return;
    }
    if (!examDate) {
      toast.error("Please choose an exam date");
      return;
    }

    const isoDateTime = new Date(
      `${examDate}T${examTime || "09:00"}:00`,
    ).toISOString();

    setSaving(true);
    try {
      if (editingExam) {
        const res = await apiClient(`/api/exams/${editingExam.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: title.trim(),
            subjectId,
            examAt: isoDateTime,
            room: room.trim() || null,
            syllabus: syllabus.trim() || null,
            preparationProgress: Number(preparationProgress),
            status,
          }),
        });
        if (res.success) {
          toast.success("Exam updated successfully");
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await apiClient("/api/exams", {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            subjectId,
            examAt: isoDateTime,
            room: room.trim() || null,
            syllabus: syllabus.trim() || null,
            preparationProgress: Number(preparationProgress),
            status,
          }),
        });
        if (res.success) {
          toast.success("Exam scheduled successfully");
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      const res = await apiClient(`/api/exams/${id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Exam deleted");
        fetchData();
      }
    } catch {
      toast.error("Failed to delete exam");
    }
  };

  const handleQuickProgress = async (exam, delta) => {
    const nextVal = Math.min(
      100,
      Math.max(0, exam.preparationProgress + delta),
    );
    try {
      const res = await apiClient(`/api/exams/${exam.id}`, {
        method: "PATCH",
        body: JSON.stringify({ preparationProgress: nextVal }),
      });
      if (res.success) {
        setExams((prev) =>
          prev.map((e) =>
            e.id === exam.id ? { ...e, preparationProgress: nextVal } : e,
          ),
        );
      }
    } catch {
      toast.error("Failed to update progress");
    }
  };

  const filteredExams = exams.filter((e) => {
    if (filter === "UPCOMING") return e.status === "UPCOMING";
    if (filter === "COMPLETED") return e.status === "COMPLETED";
    return true;
  });

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Exams & Assessments
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track upcoming tests, rooms, syllabus, countdowns, and preparation
              progress.
            </p>
          </div>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Exam</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {["ALL", "UPCOMING", "COMPLETED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {f.toLowerCase()} (
              {
                exams.filter((e) => (f === "ALL" ? true : e.status === f))
                  .length
              }
              )
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-blue-600" />
          </div>
        ) : filteredExams.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-slate-300 dark:border-slate-800">
            <Award className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              No exams found
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {filter !== "ALL"
                ? `You have no ${filter.toLowerCase()} exams scheduled.`
                : "Stay ahead of your academic assessments by scheduling your first exam."}
            </p>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="mt-4 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Exam</span>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => {
              const examDateObj = new Date(exam.examAt);
              const daysLeft = exam.daysRemaining;

              return (
                <Card
                  key={exam.id}
                  className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Header: Subject & Countdown */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: exam.subject?.color || "#3b82f6",
                          }}
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {exam.subject?.name || "General"}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {exam.subject?.code}
                        </Badge>
                      </div>

                      {/* Countdown badge */}
                      {exam.status === "COMPLETED" ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] text-emerald-600"
                        >
                          Completed
                        </Badge>
                      ) : daysLeft > 0 ? (
                        <Badge
                          variant={daysLeft <= 3 ? "destructive" : "secondary"}
                          className="text-[10px] font-semibold"
                        >
                          {daysLeft === 1 ? "Tomorrow" : `In ${daysLeft} days`}
                        </Badge>
                      ) : daysLeft === 0 ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px] animate-pulse"
                        >
                          Today
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-slate-400"
                        >
                          Past
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {exam.title}
                      </h3>
                    </div>

                    {/* Meta info: Date, Time, Room */}
                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{format(examDateObj, "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{format(examDateObj, "h:mm a")}</span>
                      </div>
                      {exam.room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>Room: {exam.room}</span>
                        </div>
                      )}
                    </div>

                    {/* Syllabus snippet */}
                    {exam.syllabus && (
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 mb-1">
                          <FileText className="h-3.5 w-3.5" />
                          Syllabus:
                        </p>
                        <p className="line-clamp-2 text-slate-500 dark:text-slate-400">
                          {exam.syllabus}
                        </p>
                      </div>
                    )}

                    {/* Preparation Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          Prep Progress
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {exam.preparationProgress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${exam.preparationProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1 pt-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-xs text-slate-500"
                          onClick={() => handleQuickProgress(exam, -10)}
                        >
                          -10
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-xs text-slate-500"
                          onClick={() => handleQuickProgress(exam, +10)}
                        >
                          +10
                        </Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          onClick={() => openEditModal(exam)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          onClick={() => handleDelete(exam.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {exam.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Exam Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingExam ? "Edit Exam" : "Schedule New Exam"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Provide exam date, time, venue, and syllabus information.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Exam Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Examination, End-Semester Finals"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Time
                  </label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Room / Hall
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hall 4B, Room 201"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Syllabus / Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Modules 1-4, Chapters on Memory Management, Virtual Memory"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Preparation Readiness</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {preparationProgress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={preparationProgress}
                  onChange={(e) =>
                    setPreparationProgress(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {saving
                    ? "Saving..."
                    : editingExam
                      ? "Update Exam"
                      : "Schedule Exam"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
