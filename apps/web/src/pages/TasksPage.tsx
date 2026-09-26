import * as React from 'react';
import { Card, CardContent, Button, Badge, Input } from '@student-os/ui';
import { Spinner } from '../components/ui/Spinner.js';
import { apiClient } from '../lib/api-client.js';
import { toast } from 'sonner';
import {
  Plus,
  CheckCircle2,
  Circle,
  Search,
  Trash2,
  Edit2,
  Clock,
  Filter,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell.js';
import { useRouter } from '../lib/router.js';
import { useAuth } from '../lib/auth-context.js';
import { format, isPast, isToday, parseISO } from 'date-fns';

export interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string | null;
}

export interface Task {
  id: string;
  userId: string;
  subjectId?: string | null;
  title: string;
  description?: string | null;
  dueAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'ASSIGNMENT' | 'PROJECT' | 'STUDY' | 'REVISION' | 'OTHER';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  subject?: Subject | null;
  isOverdue?: boolean;
}

export function TasksPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = React.useState<string>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  // Form states
  const [formTitle, setFormTitle] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formSubjectId, setFormSubjectId] = React.useState('');
  const [formDueAt, setFormDueAt] = React.useState('');
  const [formPriority, setFormPriority] = React.useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [formCategory, setFormCategory] = React.useState<'ASSIGNMENT' | 'PROJECT' | 'STUDY' | 'REVISION' | 'OTHER'>('ASSIGNMENT');
  const [formStatus, setFormStatus] = React.useState<'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('TODO');
  const [saving, setSaving] = React.useState(false);

  const fetchTasks = React.useCallback(async () => {
    try {
      const res = await apiClient<Task[]>('/api/tasks');
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubjects = React.useCallback(async () => {
    try {
      const res = await apiClient<Subject[]>('/api/subjects');
      if (res.success && res.data) {
        setSubjects(res.data);
      }
    } catch {
      // Ignore subjects fetch error
    }
  }, []);

  React.useEffect(() => {
    fetchTasks();
    fetchSubjects();
  }, [fetchTasks, fetchSubjects]);

  const openCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormSubjectId('');
    // Default due date to tomorrow at 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormDueAt(localISOTime);
    setFormPriority('MEDIUM');
    setFormCategory('ASSIGNMENT');
    setFormStatus('TODO');
    setIsCreateOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormSubjectId(task.subjectId || '');
    const dateObj = new Date(task.dueAt);
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormDueAt(localISOTime);
    setFormPriority(task.priority);
    setFormCategory(task.category);
    setFormStatus(task.status === 'COMPLETED' ? 'COMPLETED' : task.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'TODO');
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formDueAt) {
      toast.error('Due date is required');
      return;
    }

    setSaving(true);
    try {
      const dueAtIso = new Date(formDueAt).toISOString();
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        subjectId: formSubjectId || undefined,
        dueAt: dueAtIso,
        priority: formPriority,
        category: formCategory,
        status: formStatus,
      };

      if (editingTask) {
        const res = await apiClient<Task>(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (res.success && res.data) {
          toast.success('Task updated');
          setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? res.data! : t)));
          setEditingTask(null);
        }
      } else {
        const res = await apiClient<Task>('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success && res.data) {
          toast.success('Task created');
          setTasks((prev) => [res.data!, ...prev]);
          setIsCreateOpen(false);
        }
      }
    } catch {
      toast.error('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const res = await apiClient<Task>(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        const updated = res.data;
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        if (updated.status === 'COMPLETED') {
          toast.success(`Completed: ${task.title}`);
        } else {
          toast.info(`Marked as pending: ${task.title}`);
        }
      }
    } catch {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await apiClient(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Task deleted');
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'OVERDUE') {
        const isOverdue = (t.status === 'TODO' || t.status === 'IN_PROGRESS') && isPast(parseISO(t.dueAt));
        if (!isOverdue) return false;
      } else if (t.status !== statusFilter) {
        return false;
      }
    }
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
      return false;
    }
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
      return false;
    }
    if (subjectFilter !== 'ALL' && t.subjectId !== subjectFilter) {
      return false;
    }
    return true;
  });

  // Calculate metrics
  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter(
    (t) => (t.status === 'TODO' || t.status === 'IN_PROGRESS') && isPast(parseISO(t.dueAt))
  ).length;

  const priorityColor = (p: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'HIGH':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Tasks & Assignments
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track coursework, deadlines, and project deliverables.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tasks</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                aria-label="Filter by Status"
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm dark:border-slate-800 dark:bg-slate-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>

              <select
                aria-label="Filter by Priority"
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm dark:border-slate-800 dark:bg-slate-900"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                aria-label="Filter by Category"
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm dark:border-slate-800 dark:bg-slate-900"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="PROJECT">Project</option>
                <option value="STUDY">Study</option>
                <option value="REVISION">Revision</option>
                <option value="OTHER">Other</option>
              </select>

              {subjects.length > 0 && (
                <select
                  aria-label="Filter by Subject"
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm dark:border-slate-800 dark:bg-slate-900"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="ALL">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              )}

              {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || subjectFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                    setCategoryFilter('ALL');
                    setSubjectFilter('ALL');
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                <Filter className="h-6 w-6 text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {tasks.length === 0 ? 'No tasks created yet' : 'No matching tasks found'}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {tasks.length === 0
                ? 'Stay on top of assignments, homework, and projects by adding your first task.'
                : 'Try adjusting your search terms or filter criteria.'}
            </p>
            {tasks.length === 0 && (
              <Button onClick={openCreateModal} className="mt-2">
                <Plus className="h-4 w-4 mr-1" /> Add Your First Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const dueDate = parseISO(task.dueAt);
            const isCompleted = task.status === 'COMPLETED';
            const overdue = !isCompleted && isPast(dueDate) && !isToday(dueDate);
            const dueToday = !isCompleted && isToday(dueDate);

            return (
              <Card
                key={task.id}
                className={`transition-all hover:shadow-sm ${
                  isCompleted ? 'opacity-65 bg-slate-50 dark:bg-slate-900/40' : ''
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-medium text-slate-900 dark:text-white truncate ${
                            isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.subject && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${task.subject.color || '#3b82f6'}20`,
                              color: task.subject.color || '#3b82f6',
                            }}
                          >
                            {task.subject.code}
                          </Badge>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {task.category}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs pt-1">
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            overdue
                              ? 'text-red-600 dark:text-red-400'
                              : dueToday
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {overdue ? 'Overdue: ' : dueToday ? 'Due Today: ' : 'Due: '}
                          {format(dueDate, 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(task)}
                      aria-label="Edit task"
                    >
                      <Edit2 className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {(isCreateOpen || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Task Title *
                </label>
                <Input
                  required
                  placeholder="e.g., Complete Chapter 4 Exercises"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Subject
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                  >
                    <option value="">No subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Due Date & Time *
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={formDueAt}
                    onChange={(e) => setFormDueAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                  >
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="PROJECT">Project</option>
                    <option value="STUDY">Study</option>
                    <option value="REVISION">Revision</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {editingTask && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                  placeholder="Additional details, rubric requirements, links..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
