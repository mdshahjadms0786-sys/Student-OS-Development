import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '@student-os/database';

const app = createApp();

describe('Subjects API', () => {
  let cookie: string[];
  let subjectId: string;

  beforeAll(async () => {
    // Clean up test user and cascading entities
    await prisma.user.deleteMany({
      where: { email: 'subject_test@example.com' },
    });

    // Create user and get session cookie by registering
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'subject_test@example.com',
        password: 'Password123!',
        name: 'Subject Test User',
      });
    
    cookie = res.get('Set-Cookie') || [];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'subject_test@example.com' },
    });
  });

  it('should create a subject', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Cookie', cookie)
      .send({
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('CS101');
    subjectId = res.body.data.id;
  });

  it('should list subjects', async () => {
    const res = await request(app)
      .get('/api/subjects')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(subjectId);
  });

  it('should get a specific subject', async () => {
    const res = await request(app)
      .get(`/api/subjects/${subjectId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(subjectId);
  });

  it('should update a subject', async () => {
    const res = await request(app)
      .patch(`/api/subjects/${subjectId}`)
      .set('Cookie', cookie)
      .send({
        name: 'Updated CS101',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated CS101');
  });

  it('should delete a subject', async () => {
    const res = await request(app)
      .delete(`/api/subjects/${subjectId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify deletion
    const getRes = await request(app)
      .get(`/api/subjects/${subjectId}`)
      .set('Cookie', cookie);
      
    expect(getRes.status).toBe(404);
  });
});
