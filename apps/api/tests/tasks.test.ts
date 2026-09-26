import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '@student-os/database';

const app = createApp();

describe('Tasks API', () => {
  let cookie: string[];
  let user2Cookie: string[];
  let subjectId: string;
  let taskId: string;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['tasks_test@example.com', 'tasks_user2@example.com'],
        },
      },
    });

    // Register primary user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tasks_test@example.com',
        password: 'Password123!',
        name: 'Tasks Test User',
      });
    cookie = res.get('Set-Cookie') || [];

    // Register second user for authorization checks
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tasks_user2@example.com',
        password: 'Password123!',
        name: 'Tasks Second User',
      });
    user2Cookie = res2.get('Set-Cookie') || [];

    // Create a subject
    const subjectRes = await request(app)
      .post('/api/subjects')
      .set('Cookie', cookie)
      .send({
        code: 'CS201',
        name: 'Data Structures',
        credits: 4,
      });
    subjectId = subjectRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['tasks_test@example.com', 'tasks_user2@example.com'],
        },
      },
    });
  });

  it('should create a task with subject association', async () => {
    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', cookie)
      .send({
        title: 'Binary Tree Assignment',
        description: 'Implement AVL balance rotations',
        dueAt,
        priority: 'HIGH',
        category: 'ASSIGNMENT',
        subjectId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Binary Tree Assignment');
    expect(res.body.data.priority).toBe('HIGH');
    expect(res.body.data.status).toBe('TODO');
    expect(res.body.data.subject?.code).toBe('CS201');
    taskId = res.body.data.id;
  });

  it('should fail validation when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', cookie)
      .send({
        dueAt: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should list tasks with filter and search', async () => {
    // List all
    const res = await request(app).get('/api/tasks').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    // Search filter
    const searchRes = await request(app)
      .get('/api/tasks?search=Binary')
      .set('Cookie', cookie);
    expect(searchRes.body.data.length).toBe(1);

    // Status filter
    const statusRes = await request(app)
      .get('/api/tasks?status=TODO')
      .set('Cookie', cookie);
    expect(statusRes.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should toggle task completion via /complete endpoint', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/complete`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.completedAt).not.toBeNull();

    // Toggle back to TODO
    const res2 = await request(app)
      .post(`/api/tasks/${taskId}/complete`)
      .set('Cookie', cookie);
    expect(res2.status).toBe(200);
    expect(res2.body.data.status).toBe('TODO');
    expect(res2.body.data.completedAt).toBeNull();
  });

  it('should prevent unauthorized access by another user', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Cookie', user2Cookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should reflect task in dashboard summary', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pendingTasksCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.upcomingTasks.length).toBeGreaterThanOrEqual(1);
  });

  it('should update task details', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Cookie', cookie)
      .send({
        priority: 'URGENT',
        description: 'Updated instructions',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.priority).toBe('URGENT');
    expect(res.body.data.description).toBe('Updated instructions');
  });

  it('should delete task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Cookie', cookie);
    expect(checkRes.status).toBe(404);
  });
});
