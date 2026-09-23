import { prisma } from '@student-os/database';
import { UpdateProfileRequest } from '@student-os/contracts';
import { AppError } from '../../middleware/error-handler.js';

export class ProfileService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let profile = user.profile;
    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: { userId },
      });
    }

    return {
      name: user.name,
      email: user.email,
      role: user.role,
      profile,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileRequest) {
    // If name is provided in the root, update User model, otherwise just profile
    const { name, ...profileData } = data as UpdateProfileRequest & { name?: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    const profile = await prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    });

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    
    return {
      name: updatedUser?.name,
      email: updatedUser?.email,
      role: updatedUser?.role,
      profile,
    };
  }
}
