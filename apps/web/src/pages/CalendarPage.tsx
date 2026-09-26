import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@student-os/ui';
import { Spinner } from '../components/ui/Spinner.js';
import { apiClient } from '../lib/api-client.js';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell.js';
import { useRouter } from '../lib/router.js';
import { useAuth } from '../lib/auth-context.js';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';

export interface CalendarItem {
  id: string;
  type: 'TASK' | 'CLASS' | 'EVENT';
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  status?: string | null;
  priority?: string | null;
  color?: string | null;
  location?: string | null;
  subject?: {
    id: string;
    code: string;
    name: string;
    color?: string | null;
  } | null;
  relatedEntityId?: string | null;
}

export function CalendarPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [items, setItems] = React.useState<CalendarItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Month interval calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const fetchCalendar = React.useCallback(async () => {
    setLoading(true);
    try {
      const fromIso = startDate.toISOString();
      const toIso = endDate.toISOString();
      const res = await apiClient<CalendarItem[]>(`/api/calendar?from=${fromIso}&to=${toIso}`);
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  React.useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentMonth((d) => subMonths(d, 1));
  const nextMonth = () => setCurrentMonth((d) => addMonths(d, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const getItemsForDay = (day: Date) => {
    return items.filter((item) => {
      const itemDate = parseISO(item.startAt);
      return isSameDay(itemDate, day);
    });
  };

  const selectedDayItems = getItemsForDay(selectedDate);
  const classesForDay = selectedDayItems.filter((i) => i.type === 'CLASS');
  const tasksForDay = selectedDayItems.filter((i) => i.type === 'TASK');
  const eventsForDay = selectedDayItems.filter((i) => i.type === 'EVENT');

  const handleToggleTaskComplete = async (taskId: string) => {
    try {
      const res = await apiClient(`/api/tasks/${taskId}/complete`, { method: 'POST' });
      if (res.success) {
        toast.success('Task status updated');
        fetchCalendar();
      }
    } catch {
      toast.error('Failed to update task');
    }
  };

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Academic Calendar
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View scheduled classes, deadlines, and milestone events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous Month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next Month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate('#tasks')} className="gap-2 ml-2">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Calendar Grid (takes 2 columns on lg) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Classes
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Tasks
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {loading ? (
                <div className="flex justify-center p-16">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : (
                <div>
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-2">
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                    <div>Sun</div>
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day) => {
                      const dayItems = getItemsForDay(day);
                      const isSelected = isSameDay(day, selectedDate);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isTodayDate = isToday(day);

                      const classCount = dayItems.filter((i) => i.type === 'CLASS').length;
                      const taskCount = dayItems.filter((i) => i.type === 'TASK').length;

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => setSelectedDate(day)}
                          className={`min-h-[72px] sm:min-h-[88px] p-1.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/30 dark:bg-blue-900/20'
                              : isTodayDate
                              ? 'border-amber-400 bg-amber-50/40 dark:border-amber-700/50 dark:bg-amber-950/10'
                              : 'border-slate-100 hover:border-slate-300 dark:border-slate-800/80 dark:hover:border-slate-700'
                          } ${!isCurrentMonth ? 'opacity-35 bg-slate-50/50 dark:bg-slate-900/20' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center ${
                                isTodayDate
                                  ? 'bg-amber-500 text-white font-bold'
                                  : isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {format(day, 'd')}
                            </span>
                          </div>

                          <div className="space-y-1 mt-1 overflow-hidden">
                            {classCount > 0 && (
                              <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded truncate">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {classCount} {classCount === 1 ? 'class' : 'classes'}
                              </div>
                            )}
                            {taskCount > 0 && (
                              <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded truncate">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                {taskCount} {taskCount === 1 ? 'due' : 'due'}
                              </div>
                            )}

                            {/* Mobile dots */}
                            <div className="flex sm:hidden gap-1 justify-center mt-1">
                              {classCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                              {taskCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Agenda Detail Panel (1 column on lg) */}
        <div>
          <Card className="sticky top-20">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    {format(selectedDate, 'EEEE, MMM d, yyyy')}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDayItems.length} {selectedDayItems.length === 1 ? 'item' : 'items'} scheduled
                  </p>
                </div>
                {isToday(selectedDate) && (
                  <Badge variant="secondary" className="text-xs">
                    Today
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto">
              {/* Classes Section */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  Classes ({classesForDay.length})
                </h4>

                {classesForDay.length === 0 ? (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    No classes scheduled for this date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classesForDay.map((item) => {
                      const startTime = format(parseISO(item.startAt), 'h:mm a');
                      const endTime = format(parseISO(item.endAt), 'h:mm a');
                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {startTime} - {endTime}
                            </span>
                          </div>
                          {item.location && (
                            <p className="text-xs text-slate-500">Room: {item.location}</p>
                          )}
                          {item.description && (
                            <p className="text-xs text-slate-500">{item.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                  Tasks & Deadlines ({tasksForDay.length})
                </h4>

                {tasksForDay.length === 0 ? (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    No deadlines on this date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasksForDay.map((task) => {
                      const isCompleted = task.status === 'COMPLETED';
                      const dueTime = format(parseISO(task.startAt), 'h:mm a');
                      return (
                        <div
                          key={task.id}
                          className={`p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 ${
                            isCompleted ? 'opacity-65' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {task.relatedEntityId && (
                              <button
                                type="button"
                                onClick={() => handleToggleTaskComplete(task.relatedEntityId!)}
                                className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium text-slate-900 dark:text-white truncate ${
                                  isCompleted ? 'line-through text-slate-500' : ''
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                {task.subject && (
                                  <span className="font-semibold">{task.subject.code}</span>
                                )}
                                <span>Due: {dueTime}</span>
                              </div>
                            </div>
                          </div>
                          {task.priority && (
                            <Badge variant="outline" className="text-[10px]">
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Events Section if any */}
              {eventsForDay.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Events ({eventsForDay.length})
                  </h4>
                  <div className="space-y-2">
                    {eventsForDay.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20"
                      >
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                          {ev.title}
                        </p>
                        {ev.description && (
                          <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
