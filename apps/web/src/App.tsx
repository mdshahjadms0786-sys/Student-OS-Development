import * as React from 'react';
import { AppShell } from './components/layout/AppShell.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@student-os/ui';
import { CheckCircle2, Server, Layout, ShieldCheck, Database } from 'lucide-react';
import { apiClient } from './lib/api-client.js';

interface HealthData {
  status: string;
  uptime: number;
  version: string;
}

export function App() {
  const [currentPath, setCurrentPath] = React.useState('#home');
  const [healthStatus, setHealthStatus] = React.useState<'loading' | 'healthy' | 'unreachable'>('loading');
  const [healthInfo, setHealthInfo] = React.useState<HealthData | null>(null);

  const checkHealth = React.useCallback(async () => {
    setHealthStatus('loading');
    try {
      const res = await apiClient<HealthData>('/api/health');
      if (res.success && res.data) {
        setHealthInfo(res.data);
        setHealthStatus('healthy');
      } else {
        setHealthStatus('unreachable');
      }
    } catch {
      setHealthStatus('unreachable');
    }
  }, []);

  React.useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <AppShell
      currentPath={currentPath}
      onNavigate={(path) => setCurrentPath(path)}
      user={{ name: 'Lead Architect', email: 'architect@student-os.dev' }}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Phase 0: Project Foundation
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monorepo, Express.js backend, React frontend, Prisma schema, and design system are operational.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backend Status</CardTitle>
              <Server className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={healthStatus === 'healthy' ? 'success' : 'warning'}>
                  {healthStatus === 'healthy' ? 'Express API Healthy' : healthStatus === 'loading' ? 'Checking...' : 'Standby'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {healthInfo ? `Version ${healthInfo.version}` : 'REST API configured on :4000'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Layer</CardTitle>
              <Database className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="success">Prisma ORM Ready</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL schema & client configured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security & Session</CardTitle>
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="default">httpOnly Session</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Helmet, CORS & Auth Guard enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Design System</CardTitle>
              <Layout className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Tailwind + shadcn/ui</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Responsive AppShell & Dark Mode
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Foundation Verification Checklist</CardTitle>
            <CardDescription>
              All Phase 0 architectural prerequisites are complete before starting Phase 1.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'pnpm monorepo structure with shared packages (@student-os/contracts, @student-os/database, @student-os/ui)',
              'TypeScript strict mode with comprehensive tsconfig.base.json',
              'Express.js backend with session auth guard, storage adapter & centralized error handler',
              'Prisma schema modeling User, StudentProfile, Timetable, Tasks, Attendance, Exams, Notes & Notifications',
              'Vitest unit/integration testing suite configured across monorepo',
              'Playwright E2E testing framework harness established',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
              </div>
            ))}

            <div className="pt-4">
              <Button onClick={checkHealth} variant="outline" size="sm">
                Re-check API Health
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default App;
