import * as React from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, Button, Input, Badge } from '@student-os/ui';
import { Label } from '../components/ui/Label.js';
import { Select } from '../components/ui/Select.js';
import { Dialog } from '../components/ui/Dialog.js';
import { Spinner } from '../components/ui/Spinner.js';
import { apiClient } from '../lib/api-client.js';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell.js';
import { useRouter } from '../lib/router.js';
import { useAuth } from '../lib/auth-context.js';
import { Subject } from './SubjectsPage.js';

export interface TimetableEntry {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  faculty?: string;
  type: string;
  subject?: Subject;
}

const TimetableSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  dayOfWeek: z.number().min(1).max(7),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().optional(),
  faculty: z.string().optional(),
  type: z.enum(['LECTURE', 'LAB', 'TUTORIAL']),
});
type TimetableData = z.infer<typeof TimetableSchema>;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function TimetablePage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [entries, setEntries] = React.useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useReactHookForm<TimetableData>({
    resolver: zodResolver(TimetableSchema),
    defaultValues: { type: 'LECTURE', dayOfWeek: 1 }
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, subjectsRes] = await Promise.all([
        apiClient<TimetableEntry[]>(`/api/timetable`),
        apiClient<Subject[]>('/api/subjects')
      ]);
      if (entriesRes.success && entriesRes.data) setEntries(entriesRes.data);
      if (subjectsRes.success && subjectsRes.data) setSubjects(subjectsRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: TimetableData) => {
    try {
      if (editingId) {
        await apiClient(`/api/timetable/${editingId}`, { method: 'PATCH', body: JSON.stringify(data) });
        toast.success('Class updated');
      } else {
        await apiClient('/api/timetable', { method: 'POST', body: JSON.stringify(data) });
        toast.success('Class added');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error saving class. Maybe a time conflict?');
    }
  };

  const openAdd = (day: number) => {
    setEditingId(null);
    reset({ subjectId: subjects[0]?.id || '', dayOfWeek: day, startTime: '09:00', endTime: '10:00', room: '', faculty: '', type: 'LECTURE' });
    setIsDialogOpen(true);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditingId(entry.id);
    reset({
      subjectId: entry.subjectId,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room || '',
      faculty: entry.faculty || '',
      type: entry.type as any
    });
    setIsDialogOpen(true);
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await apiClient(`/api/timetable/${id}`, { method: 'DELETE' });
      toast.success('Class deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete class');
    }
  };

  const dayEntries = entries.filter(e => e.dayOfWeek === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Timetable</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your weekly schedule</p>
        </div>
        <Button onClick={() => openAdd(selectedDay)}><Plus className="h-4 w-4 mr-2" /> Add Class</Button>
      </div>

      <div className="flex overflow-x-auto mb-6 gap-2 pb-2">
        {DAYS.map((day, i) => (
          <Button 
            key={day} 
            variant={selectedDay === i + 1 ? 'primary' : 'outline'} 
            onClick={() => setSelectedDay(i + 1)}
            className="whitespace-nowrap"
          >
            {day}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Spinner className="h-8 w-8" /></div>
      ) : dayEntries.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No classes scheduled for {DAYS[selectedDay - 1]}.</div>
      ) : (
        <div className="space-y-4">
          {dayEntries.map(entry => {
            const subject = subjects.find(s => s.id === entry.subjectId) || entry.subject;
            return (
              <Card key={entry.id} className="relative overflow-hidden">
                 <div className={`absolute top-0 left-0 w-1.5 h-full bg-${subject?.color || 'blue'}-500`} />
                 <CardContent className="p-4 flex justify-between items-center">
                   <div>
                     <div className="text-lg font-semibold">{subject?.name || 'Unknown Subject'}</div>
                     <div className="text-sm text-slate-500">
                       {entry.startTime} - {entry.endTime}
                       {entry.room && ` • Room: ${entry.room}`}
                       {entry.faculty && ` • Faculty: ${entry.faculty}`}
                     </div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     <Badge variant="outline">{entry.type}</Badge>
                     <div className="flex gap-2">
                       <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}><Edit2 className="h-4 w-4" /></Button>
                       <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => deleteEntry(entry.id)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                   </div>
                 </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={editingId ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select error={!!errors.subjectId} {...register('subjectId')}>
              <option value="">Select a subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select error={!!errors.dayOfWeek} {...register('dayOfWeek', { valueAsNumber: true })}>
                {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select error={!!errors.type} {...register('type')}>
                <option value="LECTURE">Lecture</option>
                <option value="LAB">Lab</option>
                <option value="TUTORIAL">Tutorial</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" error={!!errors.startTime} {...register('startTime')} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" error={!!errors.endTime} {...register('endTime')} />
            </div>
            <div className="space-y-2">
              <Label>Room (Optional)</Label>
              <Input error={!!errors.room} {...register('room')} />
            </div>
            <div className="space-y-2">
              <Label>Faculty (Optional)</Label>
              <Input error={!!errors.faculty} {...register('faculty')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Spinner className="h-4 w-4 mr-2" /> : null} Save</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
