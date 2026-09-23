import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@student-os/ui';
import { Spinner } from '../components/ui/Spinner.js';
import { apiClient } from '../lib/api-client.js';
import { toast } from 'sonner';
import { CalendarDays, BookOpen, Clock, UserCircle, ArrowRight } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell.js';
import { useRouter } from '../lib/router.js';
import { useAuth } from '../lib/auth-context.js';

interface DashboardSummary {
  greeting: string;
  todayClasses: number;
  subjectCount: number;
  nextClass: { name: string; time: string; room?: string } | null;
  profileComplete: boolean;
}

export function HomePage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await apiClient<DashboardSummary>('/api/dashboard/summary');
        if (res.success && res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex justify-center p-12"><Spinner className="h-8 w-8" /></div>
    </AppShell>
  );

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {summary?.greeting || `Welcome back, ${user?.name || 'Student'}`}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Here is what's happening today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.todayClasses || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.subjectCount || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Total subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Class</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {summary?.nextClass ? (
              <>
                <div className="text-lg font-bold truncate" title={summary.nextClass.name}>{summary.nextClass.name}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {summary.nextClass.time} {summary.nextClass.room && ` • ${summary.nextClass.room}`}
                </p>
              </>
            ) : (
              <div className="text-sm text-slate-500 pt-2">No more classes today</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <UserCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <Badge variant={summary?.profileComplete ? 'success' : 'warning'} className="mt-1">
              {summary?.profileComplete ? 'Complete' : 'Incomplete'}
            </Badge>
            {!summary?.profileComplete && (
              <Button variant="ghost" className="px-0 py-0 h-auto text-xs ml-2" onClick={() => navigate('#profile')}>
                Complete now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('#today')}>
              View Today's Schedule <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('#timetable')}>
              Manage Timetable <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('#subjects')}>
              Add Subject <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
