import * as React from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from '@student-os/ui';
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

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  facultyName?: string;
  color?: string;
}

const SubjectSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  credits: z.number().min(0, 'Credits must be >= 0'),
  facultyName: z.string().optional(),
  color: z.string().optional(),
});
type SubjectData = z.infer<typeof SubjectSchema>;

export function SubjectsPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useReactHookForm<SubjectData>({
    resolver: zodResolver(SubjectSchema),
    defaultValues: { credits: 3, color: 'blue' }
  });

  const fetchSubjects = React.useCallback(async () => {
    try {
      const res = await apiClient<Subject[]>('/api/subjects');
      if (res.success && res.data) {
        setSubjects(res.data);
      }
    } catch (err) {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const onSubmit = async (data: SubjectData) => {
    try {
      if (editingId) {
        await apiClient(`/api/subjects/${editingId}`, { method: 'PATCH', body: JSON.stringify(data) });
        toast.success('Subject updated');
      } else {
        await apiClient('/api/subjects', { method: 'POST', body: JSON.stringify(data) });
        toast.success('Subject created');
      }
      setIsDialogOpen(false);
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.message || 'Error saving subject');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    reset({ code: '', name: '', credits: 3, facultyName: '', color: 'blue' });
    setIsDialogOpen(true);
  };

  const openEdit = (sub: Subject) => {
    setEditingId(sub.id);
    reset({
      code: sub.code,
      name: sub.name,
      credits: sub.credits,
      facultyName: sub.facultyName || '',
      color: sub.color || 'blue'
    });
    setIsDialogOpen(true);
  };

  const deleteSubject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await apiClient(`/api/subjects/${id}`, { method: 'DELETE' });
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err: any) {
      toast.error('Failed to delete subject');
    }
  };

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Subjects</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your course subjects</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Subject</Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Spinner className="h-8 w-8" /></div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No subjects found. Add one to get started.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map(sub => (
            <Card key={sub.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full bg-${sub.color || 'blue'}-500`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{sub.name}</CardTitle>
                    <CardDescription>{sub.code}</CardDescription>
                  </div>
                  <Badge variant="secondary">{sub.credits} CR</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Faculty:</span> {sub.facultyName || 'N/A'}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(sub)}><Edit2 className="h-3 w-3 mr-1"/> Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => deleteSubject(sub.id)}><Trash2 className="h-3 w-3 mr-1"/> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Subject Code</Label>
              <Input error={!!errors.code} {...register('code')} placeholder="e.g. CS101" />
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input type="number" error={!!errors.credits} {...register('credits', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subject Name</Label>
            <Input error={!!errors.name} {...register('name')} />
          </div>
          <div className="space-y-2">
            <Label>Faculty Name (Optional)</Label>
            <Input error={!!errors.facultyName} {...register('facultyName')} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Select {...register('color')}>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="amber">Amber</option>
            </Select>
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
