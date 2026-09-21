import { describe, it, expect } from 'vitest';
import { prisma } from './index.js';

describe('Database Foundation', () => {
  it('instantiates the PrismaClient singleton', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
  });
});
