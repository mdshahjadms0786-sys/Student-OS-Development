import * as React from 'react';
import { Card, CardContent, Button, Badge } from '@student-os/ui';
import { Spinner } from '../components/ui/Spinner.js';
import { apiClient } from '../lib/api-client.js';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell.js';
import { useRouter } from '../lib/router.js';
import { useAuth } from '../lib/auth-context.js';
import { TimetableEntry } from './TimetablePage.js';
import { format, addDays, subDays, getISODay } from 'date-fns';

export function TodayPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [date, setDate] = React.useState(new Date());
  const [entries, setEntries] = React.useState<TimetableEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchEntries = React.useCallback(async (d: Date) => {
    setLoading(true);
    const dayOfWeek = getISODay(d); // 1 = Monday, 7 = Sunday
    try {
      const res = await apiClient<TimetableEntry[]>(`/api/timetable?dayOfWeek=${dayOfWeek}`);
      if (res.success && res.data) {
        setEntries(res.data.sort((a, b) => a.startTime.localeCompare(b.startTime)));
      }
    } catch (err) {
      toast.error('Failed to load today classes');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEntries(date);
  }, [date, fetchEntries]);

  const goPrev = () => setDate(d => subDays(d, 1));
  const goNext = () => setDate(d => addDays(d, 1));
  const goToday = () => setDate(new Date());

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Today's Classes</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{format(date, 'EEEE, MMMM do, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Spinner className="h-8 w-8" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
          No classes scheduled for this day.
        </div>
      ) : (
        <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-slate-700">
          {entries.map(entry => (
            <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-950 absolute left-[-21px] md:left-1/2 md:-translate-x-1/2" />
              <Card className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)]">
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-${entry.subject?.color || 'blue'}-500 rounded-l-xl`} />
                <CardContent className="p-4 pl-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{entry.subject?.name}</h3>
                    <Badge variant="secondary">{entry.type}</Badge>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{entry.startTime} - {entry.endTime}</p>
                    {entry.room && <p>Room: {entry.room}</p>}
                    {entry.faculty && <p>Faculty: {entry.faculty}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
