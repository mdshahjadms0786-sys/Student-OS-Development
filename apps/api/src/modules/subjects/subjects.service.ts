import { prisma } from '@student-os/database';
import type { CreateSubjectRequest, UpdateSubjectRequest } from '@student-os/contracts';
import { AppError } from '../../middleware/error-handler.js';

export class SubjectsService {
  async listSubjects(userId: string) {
    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return subjects;
  }

  async getSubject(id: string, userId: string) {
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

  async createSubject(userId: string, data: CreateSubjectRequest) {
    const subject = await prisma.subject.create({
      data: {
        userId,
        ...data,
      },
    });
    return subject;
  }

  async updateSubject(id: string, userId: string, data: UpdateSubjectRequest) {
    await this.getSubject(id, userId); // check ownership
    
    const subject = await prisma.subject.update({
      where: { id },
      data,
    });
    
    return subject;
  }

  async deleteSubject(id: string, userId: string) {
    await this.getSubject(id, userId); // check ownership
    
    await prisma.subject.delete({
      where: { id },
    });
    
    return { id };
  }
}
