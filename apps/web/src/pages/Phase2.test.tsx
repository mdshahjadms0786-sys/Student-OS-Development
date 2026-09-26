import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TasksPage } from './TasksPage.js';
import { CalendarPage } from './CalendarPage.js';
import { NotificationsPage } from './NotificationsPage.js';
import { ThemeProvider } from '../lib/theme.js';

// Mock auth context
vi.mock('../lib/auth-context.js', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Test Student', email: 'student@example.com', profileComplete: true },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// Mock api client
vi.mock('../lib/api-client.js', () => ({
  apiClient: vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/tasks')) {
      return Promise.resolve({
        success: true,
        data: [
          {
            id: 't1',
            userId: 'u1',
            title: 'Mock Database Assignment',
            dueAt: new Date(Date.now() + 86400000).toISOString(),
            priority: 'HIGH',
            category: 'ASSIGNMENT',
            status: 'TODO',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
    }
    if (url.includes('/api/calendar')) {
      return Promise.resolve({
        success: true,
        data: [
          {
            id: 'c1',
            type: 'CLASS',
            title: 'Computer Networks',
            startAt: new Date().toISOString(),
            endAt: new Date().toISOString(),
          },
        ],
      });
    }
    if (url.includes('/api/notifications')) {
      return Promise.resolve({
        success: true,
        data: {
          notifications: [
            {
              id: 'n1',
              userId: 'u1',
              type: 'TASK',
              title: 'Mock Assignment Due',
              message: 'Database assignment is due tomorrow',
              scheduledAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          ],
          unreadCount: 1,
        },
      });
    }
    if (url.includes('/api/notification-preferences')) {
      return Promise.resolve({
        success: true,
        data: [
          {
            id: 'p1',
            type: 'TASK',
            enabled: true,
            timingMinutes: 30,
          },
        ],
      });
    }
    return Promise.resolve({ success: true, data: [] });
  }),
}));

describe('Phase 2 Frontend Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TasksPage with task list and action buttons', async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TasksPage />
        </ThemeProvider>
      );
    });

    expect(screen.getByText('Tasks & Assignments')).toBeDefined();
    expect(screen.getByText('Mock Database Assignment')).toBeDefined();
    expect(screen.getByText('Add Task')).toBeDefined();
  });

  it('renders CalendarPage with navigation and grid', async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <CalendarPage />
        </ThemeProvider>
      );
    });

    expect(screen.getByRole('heading', { name: /Academic Calendar/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Today$/i })).toBeDefined();
    expect(screen.getByText('Mon')).toBeDefined();
  });

  it('renders NotificationsPage with notification item and tabs', async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <NotificationsPage />
        </ThemeProvider>
      );
    });

    expect(screen.getByRole('heading', { name: /^Notifications$/i })).toBeDefined();
    expect(screen.getByText('Mock Assignment Due')).toBeDefined();
    expect(screen.getByText('Preferences')).toBeDefined();
  });
});
