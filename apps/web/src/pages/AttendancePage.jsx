import * as React from "react";
import { Card, CardContent, Button, Badge, Input } from "@student-os/ui";
import { Spinner } from "../components/ui/Spinner.jsx";
import { apiClient } from "../lib/api-client.js";
import { toast } from "sonner";
import {
  UserCheck,
  Plus,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  History,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { useRouter } from "../lib/router.jsx";
import { useAuth } from "../lib/auth-context.jsx";
import { format } from "date-fns";

export function AttendancePage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [subjects, setSubjects] = React.useState([]);

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = React.useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = React.useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState("");
  const [recordDate, setRecordDate] = React.useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [recordStatus, setRecordStatus] = React.useState("PRESENT");
  const [recordRemarks, setRecordRemarks] = React.useState("");
  const [batchAttended, setBatchAttended] = React.useState(0);
  const [batchTotal, setBatchTotal] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchAttendance = React.useCallback(async () => {
    try {
      const [attRes, subRes] = await Promise.all([
        apiClient("/api/attendance"),
        apiClient("/api/subjects"),
      ]);

      if (attRes.success && attRes.data) {
        setData(attRes.data);
      }
      if (subRes.success && subRes.data) {
        setSubjects(subRes.data);
        if (subRes.data.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subRes.data[0].id);
        }
      }
    } catch {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId]);

  React.useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleQuickMark = async (subjectId, status) => {
    try {
      const res = await apiClient("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          subjectId,
          date: new Date().toISOString(),
          status,
          remarks: "Quick log",
        }),
      });
      if (res.success) {
        toast.success(`Marked ${status.toLowerCase()} successfully`);
        fetchAttendance();
      }
    } catch {
      toast.error("Failed to record attendance");
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      toast.error("Please select a subject");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          date: new Date(recordDate).toISOString(),
          status: recordStatus,
          remarks: recordRemarks || null,
        }),
      });
      if (res.success) {
        toast.success("Attendance recorded successfully");
        setIsRecordModalOpen(false);
        setRecordRemarks("");
        fetchAttendance();
      }
    } catch (err) {
      toast.error(err.message || "Failed to record attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      toast.error("Please select a subject");
      return;
    }
    if (batchAttended > batchTotal) {
      toast.error("Attended classes cannot exceed total classes");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient("/api/attendance/batch", {
        method: "POST",
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          attended: Number(batchAttended),
          total: Number(batchTotal),
        }),
      });
      if (res.success) {
        toast.success("Batch attendance updated");
        setIsBatchModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update batch attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Delete this attendance entry?")) return;
    try {
      const res = await apiClient(`/api/attendance/${recordId}`, {
        method: "DELETE",
      });
      if (res.success) {
        toast.success("Record deleted");
        fetchAttendance();
      }
    } catch {
      toast.error("Failed to delete record");
    }
  };

  const overall = data?.overall;
  const subjectList = data?.subjects || [];

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Attendance Tracking
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Monitor subject-wise and overall class presence against your
              academic target.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchModalOpen(true)}
              className="gap-1.5"
            >
              <Layers className="h-4 w-4" />
              <span>Batch Sync</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsRecordModalOpen(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Log Class</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-blue-600" />
          </div>
        ) : (
          <>
            {/* Overall Summary Card */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Overall Attendance
                      </span>
                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                          {overall?.percentage !== null
                            ? `${overall.percentage}%`
                            : "N/A"}
                        </span>
                        <Badge
                          variant={
                            !overall?.hasRecords
                              ? "outline"
                              : overall.isBelowTarget
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs font-medium"
                        >
                          Target: {overall?.target}%
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {overall?.hasRecords
                          ? `${overall.totalAttended} attended out of ${overall.totalClasses} total classes`
                          : "No attendance records logged yet"}
                      </p>
                    </div>

                    {/* Circular or Bar Indicator */}
                    <div className="w-full sm:w-48">
                      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            overall?.isBelowTarget
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(overall?.percentage || 0, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-slate-400">
                        <span>0%</span>
                        <span className="text-blue-500 font-semibold">
                          {overall?.target}% Target
                        </span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Warning or Advice Alert Banner */}
                  {overall?.hasRecords && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      {overall.isBelowTarget ? (
                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            <strong>Attendance Warning:</strong> You are below
                            your {overall.target}% target. Attend the next{" "}
                            <strong>{overall.classesNeeded}</strong> classes to
                            recover.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-800 dark:text-emerald-300">
                          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            <strong>On Track:</strong> You are meeting your
                            target. You can safely miss up to{" "}
                            <strong>{overall.safeAbsences}</strong> classes
                            without dropping below {overall.target}%.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Target & Settings Card */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Policy Target
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Minimum required attendance percentage configured in your
                      profile.
                    </p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {overall?.target}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">
                      Total tracked subjects:{" "}
                      <strong>{subjectList.length}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subject-Wise Attendance List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Subject Attendance
              </h2>

              {subjectList.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-slate-300 dark:border-slate-800">
                  <UserCheck className="mx-auto h-10 w-10 text-slate-400" />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    No subjects found
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Add academic subjects first to track class attendance.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("#subjects")}
                  >
                    Go to Subjects
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjectList.map((sub) => (
                    <Card
                      key={sub.subjectId}
                      className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm transition-shadow"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: sub.color }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                  {sub.subjectName}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {sub.subjectCode}
                                </Badge>
                              </div>
                              {sub.facultyName && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {sub.facultyName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                              {sub.percentage !== null
                                ? `${sub.percentage}%`
                                : "N/A"}
                            </span>
                            {sub.hasRecords && (
                              <Badge
                                variant={
                                  sub.isBelowTarget
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="ml-2 text-[10px]"
                              >
                                {sub.isBelowTarget ? "Low" : "Good"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                sub.isBelowTarget
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(sub.percentage || 0, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>
                              {sub.attended} Attended / {sub.total} Total
                            </span>
                            {sub.hasRecords && (
                              <span>
                                {sub.isBelowTarget
                                  ? `Need ${sub.classesNeeded} more`
                                  : `Can miss ${sub.safeAbsences}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              onClick={() =>
                                handleQuickMark(sub.subjectId, "PRESENT")
                              }
                            >
                              + Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              onClick={() =>
                                handleQuickMark(sub.subjectId, "ABSENT")
                              }
                            >
                              + Absent
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-slate-500"
                            onClick={() => {
                              setSelectedSubjectId(sub.subjectId);
                              setBatchAttended(sub.attended);
                              setBatchTotal(sub.total);
                              setIsBatchModalOpen(true);
                            }}
                          >
                            Edit Total
                          </Button>
                        </div>

                        {/* Recent History Snippet */}
                        {sub.recentRecords && sub.recentRecords.length > 0 && (
                          <div className="mt-3 pt-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-slate-500">
                              Recent:
                            </span>
                            {sub.recentRecords.slice(0, 4).map((rec) => (
                              <span
                                key={rec.id}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  rec.status === "PRESENT"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : rec.status === "ABSENT"
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {format(new Date(rec.date), "MMM d")}:{" "}
                                {rec.status[0]}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Log Class Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Log Class Attendance
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Record attendance for a specific session.
            </p>

            <form onSubmit={handleRecordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
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
                    Date *
                  </label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status *
                  </label>
                  <select
                    value={recordStatus}
                    onChange={(e) => setRecordStatus(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="EXCUSED">Excused</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab experiment 3"
                  value={recordRemarks}
                  onChange={(e) => setRecordRemarks(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {submitting ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Sync Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Batch Attendance Sync
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Input total classes held and attended to sync your overall
              standing.
            </p>

            <form onSubmit={handleBatchSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
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
                    Classes Attended *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={batchAttended}
                    onChange={(e) =>
                      setBatchAttended(
                        Math.max(0, parseInt(e.target.value) || 0),
                      )
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Total Classes *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={batchTotal}
                    onChange={(e) =>
                      setBatchTotal(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-xs text-blue-700 dark:text-blue-300">
                Calculated:{" "}
                <strong>
                  {batchTotal > 0
                    ? `${((batchAttended / batchTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </strong>{" "}
                attendance.
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBatchModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {submitting ? "Updating..." : "Sync Attendance"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
