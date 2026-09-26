import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@student-os/ui';
import { Spinner } from '../components/ui/Spinner.js';
import { apiClient } from '../lib/api-client.js';
import { toast } from 'sonner';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  CheckSquare,
  Award,
  UserCheck,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell.js';
import { useRouter } from '../lib/router.js';
import { useAuth } from '../lib/auth-context.js';
import { format, parseISO } from 'date-fns';

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'CLASS' | 'ASSIGNMENT' | 'EXAM' | 'ATTENDANCE' | 'TASK' | 'SUMMARY' | 'SYSTEM';
  title: string;
  message: string;
  readAt?: string | null;
  scheduledAt: string;
  relatedEntity?: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  type: string;
  enabled: boolean;
  timingMinutes: number;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = React.useState<NotificationPreference[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'UNREAD' | 'PREFERENCES'>('ALL');

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await apiClient<{ notifications: NotificationItem[]; unreadCount: number }>(
        '/api/notifications'
      );
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreferences = React.useCallback(async () => {
    try {
      const res = await apiClient<NotificationPreference[]>('/api/notification-preferences');
      if (res.success && res.data) {
        setPreferences(res.data);
      }
    } catch {
      // Ignore preferences fetch error
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await apiClient<NotificationItem>(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await apiClient('/api/notifications/read-all', { method: 'POST' });
      if (res.success) {
        toast.success('All notifications marked as read');
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleTogglePreference = async (pref: NotificationPreference) => {
    const newEnabled = !pref.enabled;
    try {
      const res = await apiClient<NotificationPreference>('/api/notification-preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          type: pref.type,
          enabled: newEnabled,
        }),
      });
      if (res.success && res.data) {
        setPreferences((prev) =>
          prev.map((p) => (p.type === pref.type ? res.data! : p))
        );
        toast.success(`${pref.type} notifications ${newEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch {
      toast.error('Failed to update preference');
    }
  };

  const handleUpdateTiming = async (pref: NotificationPreference, timingMinutes: number) => {
    try {
      const res = await apiClient<NotificationPreference>('/api/notification-preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          type: pref.type,
          timingMinutes,
        }),
      });
      if (res.success && res.data) {
        setPreferences((prev) =>
          prev.map((p) => (p.type === pref.type ? res.data! : p))
        );
        toast.success(`Timing updated for ${pref.type}`);
      }
    } catch {
      toast.error('Failed to update reminder timing');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.readAt;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CLASS':
        return <Clock className="h-4 w-4 text-emerald-600" />;
      case 'ASSIGNMENT':
      case 'TASK':
        return <CheckSquare className="h-4 w-4 text-blue-600" />;
      case 'EXAM':
        return <Award className="h-4 w-4 text-purple-600" />;
      case 'ATTENDANCE':
        return <UserCheck className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  const getDeepLink = (notif: NotificationItem) => {
    switch (notif.type) {
      case 'TASK':
      case 'ASSIGNMENT':
        return { label: 'Go to Tasks', path: '#tasks' };
      case 'CLASS':
        return { label: 'Go to Timetable', path: '#timetable' };
      default:
        return null;
    }
  };

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-blue-600">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review academic alerts, class schedules, and task reminders.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'ALL'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('UNREAD')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'UNREAD'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PREFERENCES')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            activeTab === 'PREFERENCES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : activeTab === 'PREFERENCES' ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Reminder Preferences</CardTitle>
            <p className="text-sm text-slate-500">
              Customize which notifications you receive and reminder advance lead times.
            </p>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
            {preferences.map((pref) => (
              <div key={pref.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white capitalize">
                    {pref.type.toLowerCase().replace('_', ' ')} Notifications
                  </span>
                  <p className="text-xs text-slate-500">
                    Receive alert reminders before deadlines and schedules.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {pref.enabled && (
                    <select
                      aria-label="Reminder Timing"
                      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                      value={pref.timingMinutes}
                      onChange={(e) => handleUpdateTiming(pref, Number(e.target.value))}
                    >
                      <option value={5}>5 mins before</option>
                      <option value={15}>15 mins before</option>
                      <option value={30}>30 mins before</option>
                      <option value={60}>1 hour before</option>
                      <option value={1440}>1 day before</option>
                    </select>
                  )}

                  <button
                    type="button"
                    role="switch"
                    aria-checked={pref.enabled}
                    onClick={() => handleTogglePreference(pref)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pref.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        pref.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                <Bell className="h-6 w-6 text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {activeTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              You are all caught up! Academic alerts, upcoming classes, and task reminders will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.readAt;
            const link = getDeepLink(notif);
            return (
              <Card
                key={notif.id}
                className={`transition-all ${
                  isUnread
                    ? 'border-blue-200 bg-blue-50/20 dark:border-blue-900/40 dark:bg-blue-950/10'
                    : 'opacity-85'
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {notif.title}
                        </span>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {notif.type}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {notif.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                        <span>{format(parseISO(notif.createdAt), 'MMM d, yyyy h:mm a')}</span>

                        {link && (
                          <button
                            type="button"
                            onClick={() => navigate(link.path)}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            <span>{link.label}</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-xs shrink-0 gap-1 text-slate-500 hover:text-blue-600"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Mark read</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
