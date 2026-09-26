import * as React from 'react';
import { Card, CardContent, Button, Badge } from '@student-os/ui';
import { Spinner } from '../components/ui/Spinner.jsx';
import { apiClient } from '../lib/api-client.js';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckSquare,
  Circle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell.jsx';
import { useRouter } from '../lib/router.jsx';
import { useAuth } from '../lib/auth-context.jsx';
import {
  format,
  addDays,
  subDays,
  getISODay,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';

export function TodayPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [date, setDate] = React.useState(new Date());
  const [entries, setEntries] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async (d) => {
    setLoading(true);
    const dayOfWeek = getISODay(d); // 1 = Monday, 7 = Sunday
    const startStr = startOfDay(d).toISOString();
    const endStr = endOfDay(d).toISOString();

    try {
      const [timetableRes, tasksRes] = await Promise.all([
        apiClient(`/api/timetable?dayOfWeek=${dayOfWeek}`),
        apiClient(`/api/tasks?from=${startStr}&to=${endStr}`),
      ]);

      if (timetableRes.success && timetableRes.data) {
        setEntries(timetableRes.data.sort((a, b) => a.startTime.localeCompare(b.startTime)));
      }
      if (tasksRes.success && tasksRes.data) {
        setTasks(tasksRes.data);
      }
    } catch {
      toast.error('Failed to load today schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData(date);
  }, [date, fetchData]);

  const goPrev = () => setDate((d) => subDays(d, 1));
  const goNext = () => setDate((d) => addDays(d, 1));
  const goToday = () => setDate(new Date());

  const handleToggleTask = async (taskId) => {
    try {
      const res = await apiClient(`/api/tasks/${taskId}/complete`, { method: 'POST' });
      if (res.success && res.data) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data : t)));
        toast.success('Task status updated');
      }
    } catch {
      toast.error('Failed to update task');
    }
  };

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Today's Agenda
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {format(date, 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate('#tasks')} className="gap-2 ml-2">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheduled Classes (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Scheduled Classes ({entries.length})
              </h3>
            </div>

            {entries.length === 0 ? (
              <Card className="text-center py-10 text-slate-500">
                <CardContent>No classes scheduled for this day.</CardContent>
              </Card>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-slate-700">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-950 absolute left-[-21px] md:left-1/2 md:-translate-x-1/2" />
                    <Card className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)]">
                      <div
                        className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl`}
                        style={{ backgroundColor: entry.subject?.color || '#3b82f6' }}
                      />
                      <CardContent className="p-4 pl-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
                            {entry.subject?.name}
                          </h4>
                          <Badge variant="secondary">{entry.type}</Badge>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {entry.startTime} - {entry.endTime}
                          </p>
                          {entry.room && <p>Room: {entry.room}</p>}
                          {entry.faculty && <p>Faculty: {entry.faculty}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Due Today (1 column) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-amber-600" />
              Tasks Due on this Day ({tasks.length})
            </h3>

            {tasks.length === 0 ? (
              <Card className="text-center py-10 text-slate-500">
                <CardContent className="space-y-2">
                  <p className="text-sm">No tasks due on this date.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('#tasks')}
                    className="mt-2"
                  >
                    Create Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  const dueTime = format(parseISO(task.dueAt), 'h:mm a');

                  return (
                    <Card
                      key={task.id}
                      className={`transition-all ${
                        isCompleted ? 'opacity-65 bg-slate-50 dark:bg-slate-900/40' : ''
                      }`}
                    >
                      <CardContent className="p-3.5 flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCompleted
                                ? 'line-through text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {task.subject && (
                              <Badge variant="secondary" className="text-[10px]">
                                {task.subject.code}
                              </Badge>
                            )}
                            <span>Due: {dueTime}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                        >
                          {task.priority}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
