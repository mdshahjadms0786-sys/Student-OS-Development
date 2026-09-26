import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '@student-os/database';

const app = createApp();

describe('Notifications API', () => {
  let cookie;
  let notificationId;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'notifications_test@example.com' },
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'notifications_test@example.com',
        password: 'Password123!',
        name: 'Notifications Test User',
      });
    cookie = res.get('Set-Cookie') || [];

    const user = await prisma.user.findUnique({
      where: { email: 'notifications_test@example.com' },
    });

    // Create a notification directly for testing
    const notif = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'TASK',
        title: 'Upcoming Deadline',
        message: 'Project is due tomorrow',
        scheduledAt: new Date(),
      },
    });
    notificationId = notif.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'notifications_test@example.com' },
    });
  });

  it('should initialize and list default notification preferences', async () => {
    const res = await request(app)
      .get('/api/notification-preferences')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);

    const taskPref = res.body.data.find((p) => p.type === 'TASK');
    expect(taskPref).toBeDefined();
    expect(taskPref.enabled).toBe(true);
  });

  it('should update a notification preference', async () => {
    const res = await request(app)
      .patch('/api/notification-preferences')
      .set('Cookie', cookie)
      .send({
        type: 'TASK',
        enabled: false,
        timingMinutes: 60,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.enabled).toBe(false);
    expect(res.body.data.timingMinutes).toBe(60);
  });

  it('should list notifications and unread count', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('should mark a notification as read', async () => {
    const res = await request(app)
      .post(`/api/notifications/${notificationId}/read`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.readAt).not.toBeNull();
  });

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .post('/api/notifications/read-all')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get('/api/notifications?unread=true')
      .set('Cookie', cookie);
    expect(checkRes.body.data.unreadCount).toBe(0);
    expect(checkRes.body.data.notifications.length).toBe(0);
  });
});
