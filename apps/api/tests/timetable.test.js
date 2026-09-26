import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '@student-os/database';

const app = createApp();

describe('Timetable API', () => {
  let cookie;
  let subjectId;
  let entryId;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'timetable_test@example.com' },
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'timetable_test@example.com',
        password: 'Password123!',
        name: 'Timetable Test User',
      });
    
    cookie = res.get('Set-Cookie') || [];

    // Create a subject to link timetable entries to
    const subjectRes = await request(app)
      .post('/api/subjects')
      .set('Cookie', cookie)
      .send({
        code: 'MAT101',
        name: 'Calculus I',
        credits: 3,
      });
    subjectId = subjectRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'timetable_test@example.com' },
    });
  });

  it('should create a timetable entry', async () => {
    const res = await request(app)
      .post('/api/timetable')
      .set('Cookie', cookie)
      .send({
        subjectId,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:30',
        type: 'LECTURE',
        room: 'Room A',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dayOfWeek).toBe(1);
    entryId = res.body.data.id;
  });

  it('should prevent overlapping timetable entries on the same day', async () => {
    const res = await request(app)
      .post('/api/timetable')
      .set('Cookie', cookie)
      .send({
        subjectId,
        dayOfWeek: 1, // Monday again
        startTime: '10:00', // Overlaps with 09:00 - 10:30
        endTime: '11:00',
        type: 'TUTORIAL',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should allow adjacent timetable entries', async () => {
    const res = await request(app)
      .post('/api/timetable')
      .set('Cookie', cookie)
      .send({
        subjectId,
        dayOfWeek: 1,
        startTime: '10:30', // Starts exactly when previous ends
        endTime: '12:00',
        type: 'LAB',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should list timetable entries', async () => {
    const res = await request(app)
      .get('/api/timetable')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('should update a timetable entry', async () => {
    const res = await request(app)
      .patch(`/api/timetable/${entryId}`)
      .set('Cookie', cookie)
      .send({
        room: 'Room B',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.room).toBe('Room B');
  });

  it('should delete a timetable entry', async () => {
    const res = await request(app)
      .delete(`/api/timetable/${entryId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
