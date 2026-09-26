import * as React from 'react';
import { Sun, Moon, Bell, GraduationCap } from 'lucide-react';
import { useTheme } from '../../lib/theme.js';
import { Button } from '@student-os/ui';
import { apiClient } from '../../lib/api-client.js';

interface HeaderProps {
  user?: { name: string; email: string } | null;
  onNavigate?: (path: string) => void;
}

export function Header({ user, onNavigate }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    async function checkNotifications() {
      try {
        const res = await apiClient<{ unreadCount: number }>('/api/notifications?unread=true');
        if (res.success && res.data) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch {
        // Ignore unread count failure in header
      }
    }
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationsClick = () => {
    if (onNavigate) {
      onNavigate('#notifications');
    } else {
      window.location.hash = '#notifications';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.hash = '#home'}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
            Student OS
          </h1>
          <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            Academic Management & Productivity
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          onClick={handleNotificationsClick}
          className="relative text-slate-600 dark:text-slate-300"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-slate-600 dark:text-slate-300"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {user && (
          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 md:inline">
              {user.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
