import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '@student-os/database';

const app = createApp();

describe('Calendar API', () => {
  let cookie;
  let subjectId;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'calendar_test@example.com' },
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'calendar_test@example.com',
        password: 'Password123!',
        name: 'Calendar Test User',
      });
    cookie = res.get('Set-Cookie') || [];

    const subjectRes = await request(app)
      .post('/api/subjects')
      .set('Cookie', cookie)
      .send({
        code: 'PHY101',
        name: 'Physics',
        credits: 3,
      });
    subjectId = subjectRes.body.data.id;

    // Create a timetable entry on Monday (dayOfWeek = 1)
    await request(app)
      .post('/api/timetable')
      .set('Cookie', cookie)
      .send({
        subjectId,
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:30',
        room: 'Lab 2',
        type: 'LAB',
      });

    // Create a task due on 2026-10-15
    await request(app)
      .post('/api/tasks')
      .set('Cookie', cookie)
      .send({
        title: 'Physics Lab Report',
        dueAt: '2026-10-15T18:00:00.000Z',
        priority: 'MEDIUM',
        category: 'ASSIGNMENT',
        subjectId,
      });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'calendar_test@example.com' },
    });
  });

  it('should require from and to query params', async () => {
    const res = await request(app).get('/api/calendar').set('Cookie', cookie);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return aggregated calendar items including tasks and repeating classes', async () => {
    // 2026-10-12 is Monday, 2026-10-18 is Sunday
    const res = await request(app)
      .get('/api/calendar?from=2026-10-12T00:00:00.000Z&to=2026-10-18T23:59:59.999Z')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const items = res.body.data;
    // Should have Monday lab class
    const classItem = items.find((i) => i.type === 'CLASS');
    expect(classItem).toBeDefined();
    expect(classItem.title).toContain('Physics');
    expect(classItem.location).toBe('Lab 2');

    // Should have Thursday task
    const taskItem = items.find((i) => i.type === 'TASK');
    expect(taskItem).toBeDefined();
    expect(taskItem.title).toBe('Physics Lab Report');
  });
});
