import * as React from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from '@student-os/ui';
import { Label } from '../components/ui/Label.js';
import { apiClient } from '../lib/api-client.js';
import { useAuth } from '../lib/auth-context.js';
import { toast } from 'sonner';
import { Spinner } from '../components/ui/Spinner.js';
import { AppShell } from '../components/layout/AppShell.js';
import { useRouter } from '../lib/router.js';
// Using a basic schema here if @student-os/contracts doesn't export it
const ProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  program: z.string().min(1, 'Program is required'),
  semester: z.number().min(1).max(12),
  section: z.string().optional(),
  batch: z.string().optional(),
  academicYear: z.string().optional(),
  targetAttendance: z.number().min(0).max(100).optional(),
});
type ProfileData = z.infer<typeof ProfileSchema>;

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(true);
  const { currentPath, navigate } = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useReactHookForm<ProfileData>({
    resolver: zodResolver(ProfileSchema)
  });

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient<ProfileData>('/api/profile');
        if (res.success && res.data) {
          reset(res.data);
        }
      } catch (err) {
        toast.error('Could not load profile');
      } finally {
        setFetching(false);
      }
    }
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileData) => {
    setLoading(true);
    try {
      const res = await apiClient<ProfileData>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (res.success) {
        toast.success('Profile updated successfully');
        if (user) {
          updateUser({ ...user, name: data.name, profileComplete: true });
        }
        window.location.hash = '#home';
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex justify-center p-12"><Spinner className="h-8 w-8" /></div>
    </AppShell>
  );

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Please provide your academic details to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" error={!!errors.name} {...register('name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program">Program / Major</Label>
                  <Input id="program" placeholder="e.g. Computer Science" error={!!errors.program} {...register('program')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester (1-12)</Label>
                  <Input id="semester" type="number" error={!!errors.semester} {...register('semester', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input id="section" error={!!errors.section} {...register('section')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Input id="batch" placeholder="e.g. 2024" error={!!errors.batch} {...register('batch')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input id="academicYear" placeholder="e.g. 2023-2024" error={!!errors.academicYear} {...register('academicYear')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAttendance">Target Attendance %</Label>
                  <Input id="targetAttendance" type="number" defaultValue={75} error={!!errors.targetAttendance} {...register('targetAttendance', { valueAsNumber: true })} />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
