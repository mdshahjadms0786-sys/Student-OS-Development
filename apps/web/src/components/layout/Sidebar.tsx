import {
  Home,
  Clock,
  CalendarDays,
  Calendar,
  CheckSquare,
  UserCheck,
  Award,
  FileText,
  Bell,
  Settings,
} from 'lucide-react';
import { cn } from '@student-os/ui';

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
}

const mainNavItems: NavItem[] = [
  { name: 'Home', href: '#home', icon: Home },
  { name: 'Today', href: '#today', icon: Clock },
  { name: 'Timetable', href: '#timetable', icon: CalendarDays },
  { name: 'Calendar', href: '#calendar', icon: Calendar },
  { name: 'Tasks', href: '#tasks', icon: CheckSquare },
  { name: 'Attendance', href: '#attendance', icon: UserCheck },
  { name: 'Exams', href: '#exams', icon: Award },
  { name: 'Notes', href: '#notes', icon: FileText },
  { name: 'Notifications', href: '#notifications', icon: Bell },
  { name: 'Settings', href: '#settings', icon: Settings },
];

interface SidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function Sidebar({ currentPath = '#home', onNavigate }: SidebarProps) {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate(item.href);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Phase 0: Foundation</p>
          <p className="mt-0.5">Platform ready for Phase 1 modules.</p>
        </div>
      </div>
    </aside>
  );
}
