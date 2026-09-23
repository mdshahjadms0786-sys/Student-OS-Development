import { prisma, ClassType } from '@student-os/database';
import type { CreateTimetableEntryRequest, UpdateTimetableEntryRequest } from '@student-os/contracts';
import { AppError } from '../../middleware/error-handler.js';

export class TimetableService {
  private parseTime(time: string): number {
    const parts = time.split(':');
    const hours = Number(parts[0] ?? '0');
    const minutes = Number(parts[1] ?? '0');
    return hours * 60 + minutes;
  }

  private async checkOverlap(userId: string, dayOfWeek: number, startTime: string, endTime: string, excludeId?: string) {
    const startMin = this.parseTime(startTime);
    const endMin = this.parseTime(endTime);

    if (startMin >= endMin) {
      throw new AppError('Start time must be before end time', 400);
    }

    const existingEntries = await prisma.timetableEntry.findMany({
      where: {
        userId,
        dayOfWeek,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    for (const entry of existingEntries) {
      const eStart = this.parseTime(entry.startTime);
      const eEnd = this.parseTime(entry.endTime);

      if (startMin < eEnd && endMin > eStart) {
        throw new AppError('Time conflict with existing timetable entry', 409);
      }
    }
  }

  async listEntries(userId: string, dayOfWeek?: number) {
    const entries = await prisma.timetableEntry.findMany({
      where: {
        userId,
        ...(dayOfWeek !== undefined ? { dayOfWeek } : {}),
      },
      include: { subject: true },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
    return entries;
  }

  async getEntry(id: string, userId: string) {
    const entry = await prisma.timetableEntry.findUnique({
      where: { id },
      include: { subject: true },
    });
    
    if (!entry) throw new AppError('Timetable entry not found', 404);
    if (entry.userId !== userId) throw new AppError('Forbidden', 403);
    
    return entry;
  }

  async createEntry(userId: string, data: CreateTimetableEntryRequest) {
    await this.checkOverlap(userId, data.dayOfWeek, data.startTime, data.endTime);
    
    const entry = await prisma.timetableEntry.create({
      data: {
        userId,
        subjectId: data.subjectId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        faculty: data.faculty,
        type: data.type as ClassType,
      },
      include: { subject: true },
    });
    return entry;
  }

  async updateEntry(id: string, userId: string, data: UpdateTimetableEntryRequest) {
    const existing = await prisma.timetableEntry.findUnique({
      where: { id },
    });
    if (!existing) throw new AppError('Timetable entry not found', 404);
    if (existing.userId !== userId) throw new AppError('Forbidden', 403);
    
    const dayOfWeek = data.dayOfWeek ?? existing.dayOfWeek;
    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;

    if (data.dayOfWeek !== undefined || data.startTime !== undefined || data.endTime !== undefined) {
      await this.checkOverlap(userId, dayOfWeek, startTime, endTime, id);
    }
    
    const entry = await prisma.timetableEntry.update({
      where: { id },
      data: {
        ...(data.subjectId ? { subjectId: data.subjectId } : {}),
        ...(data.dayOfWeek !== undefined ? { dayOfWeek: data.dayOfWeek } : {}),
        ...(data.startTime ? { startTime: data.startTime } : {}),
        ...(data.endTime ? { endTime: data.endTime } : {}),
        ...(data.room !== undefined ? { room: data.room } : {}),
        ...(data.faculty !== undefined ? { faculty: data.faculty } : {}),
        ...(data.type ? { type: data.type as ClassType } : {}),
      },
      include: { subject: true },
    });
    return entry;
  }

  async deleteEntry(id: string, userId: string) {
    const entry = await prisma.timetableEntry.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!entry) throw new AppError('Timetable entry not found', 404);
    if (entry.userId !== userId) throw new AppError('Forbidden', 403);
    
    await prisma.timetableEntry.delete({
      where: { id },
    });
    
    return { id };
  }
  
  async getTodayEntries(userId: string, dayOfWeek: number) {
    return this.listEntries(userId, dayOfWeek);
  }
}
