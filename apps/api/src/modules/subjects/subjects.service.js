import { prisma } from '@student-os/database';
import { AppError } from '../../middleware/error-handler.js';

export class SubjectsService {
  async listSubjects(userId) {
    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return subjects;
  }

  async getSubject(id, userId) {
    const subject = await prisma.subject.findUnique({
      where: { id },
    });
    
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }
    
    if (subject.userId !== userId) {
      throw new AppError('Forbidden', 403);
    }
    
    return subject;
  }

  async createSubject(userId, data) {
    const subject = await prisma.subject.create({
      data: {
        userId,
        ...data,
      },
    });
    return subject;
  }

  async updateSubject(id, userId, data) {
    await this.getSubject(id, userId); // check ownership
    
    const subject = await prisma.subject.update({
      where: { id },
      data,
    });
    
    return subject;
  }

  async deleteSubject(id, userId) {
    await this.getSubject(id, userId); // check ownership
    
    await prisma.subject.delete({
      where: { id },
    });
    
    return { id };
  }
}
