import { prisma, Role } from './index.js';

export async function seed() {
  console.log('🌱 Seeding database with initial foundation data...');

  // Create demo student
  const demoStudent = await prisma.user.upsert({
    where: { email: 'student@demo.edu' },
    update: {},
    create: {
      email: 'student@demo.edu',
      name: 'Alex Rivera',
      // Password is 'password123' (Foundation mock hash for development)
      passwordHash: '$2a$12$e8x/yR5Z.N5QyF7qjGv0ve8Yl6x.V2J9IqG0rN5.aB7t6r5l8c7qK',
      role: Role ? Role.STUDENT : 'STUDENT',
      profile: {
        create: {
          program: 'Computer Science & Engineering',
          semester: 5,
          section: 'A',
          batch: '2023-2027',
          academicYear: '2025-2026',
          targetAttendance: 80.0,
        },
      },
    },
  });

  console.log(`✅ Demo user established: ${demoStudent.email} (ID: ${demoStudent.id})`);
}

if (process.env['NODE_ENV'] !== 'test') {
  seed()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
