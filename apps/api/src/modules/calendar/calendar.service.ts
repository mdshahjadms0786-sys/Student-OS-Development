import { prisma } from '@student-os/database';
import { AppError } from '../../middleware/error-handler.js';

export class CalendarService {
  async getCalendarItems(userId: string, fromStr: string, toStr: string) {
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError('Invalid date range for from/to parameters', 400);
    }

    // 1. Fetch tasks within the range
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        dueAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: { subject: true },
      orderBy: { dueAt: 'asc' },
    });

    const taskItems = tasks.map((task) => ({
      id: `task-${task.id}`,
      type: 'TASK' as const,
      title: task.title,
      description: task.description,
      startAt: task.dueAt.toISOString(),
      endAt: task.dueAt.toISOString(),
      status: task.status,
      priority: task.priority,
      color: task.subject?.color || '#3b82f6',
      location: null,
      subject: task.subject,
      relatedEntityId: task.id,
    }));

    // 2. Fetch all user timetable entries
    const timetableEntries = await prisma.timetableEntry.findMany({
      where: { userId },
      include: { subject: true },
    });

    // Project timetable entries across dates in the range
    const classItems: any[] = [];
    const curr = new Date(fromDate);
    // Ensure we don't loop endlessly if range is huge (cap at 62 days)
    let daysCount = 0;
    while (curr <= toDate && daysCount < 62) {
      // 1 = Monday, ..., 7 = Sunday
      const jsDay = curr.getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;
      const dayEntries = timetableEntries.filter((e) => e.dayOfWeek === dayOfWeek);

      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const datePart = `${year}-${month}-${day}`;

      for (const entry of dayEntries) {
        const startIso = `${datePart}T${entry.startTime}:00`;
        const endIso = `${datePart}T${entry.endTime}:00`;

        classItems.push({
          id: `class-${entry.id}-${datePart}`,
          type: 'CLASS' as const,
          title: `${entry.subject?.name || 'Class'} (${entry.type})`,
          description: entry.faculty ? `Faculty: ${entry.faculty}` : null,
          startAt: new Date(startIso).toISOString(),
          endAt: new Date(endIso).toISOString(),
          status: 'SCHEDULED',
          priority: 'MEDIUM',
          color: entry.subject?.color || '#10b981',
          location: entry.room || null,
          subject: entry.subject,
          relatedEntityId: entry.id,
        });
      }

      curr.setDate(curr.getDate() + 1);
      daysCount++;
    }

    // 3. Fetch explicit events
    const events = await prisma.event.findMany({
      where: {
        userId,
        startAt: { lte: toDate },
        endAt: { gte: fromDate },
      },
      orderBy: { startAt: 'asc' },
    });

    const eventItems = events.map((event) => ({
      id: `event-${event.id}`,
      type: 'EVENT' as const,
      title: event.title,
      description: event.description,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      status: 'CONFIRMED',
      priority: 'MEDIUM',
      color: '#8b5cf6',
      location: null,
      subject: null,
      relatedEntityId: event.id,
    }));

    // Merge and sort
    const allItems = [...taskItems, ...classItems, ...eventItems].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

    return allItems;
  }
}
