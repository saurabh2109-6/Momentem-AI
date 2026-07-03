import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves a user profile by their user ID.
   */
  async getProfile(userId: string) {
    if (this.prisma.isFallbackMode) {
      const profiles = this.prisma.getMockProfiles();
      const profile = profiles.find((p) => p.userId === userId);
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }
      return profile;
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  /**
   * Updates a user profile.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (this.prisma.isFallbackMode) {
      const profiles = this.prisma.getMockProfiles();
      const index = profiles.findIndex((p) => p.userId === userId);
      if (index === -1) {
        throw new NotFoundException('Profile not found');
      }
      
      profiles[index] = {
        ...profiles[index],
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      this.prisma.saveMockProfiles(profiles);
      return profiles[index];
    }

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        ...dto,
      },
    });

    return profile;
  }

  /**
   * Finds a user profile by their friend code.
   */
  async getProfileByFriendCode(friendCode: string) {
    const codeUpper = friendCode.toUpperCase();

    if (this.prisma.isFallbackMode) {
      const profiles = this.prisma.getMockProfiles();
      const profile = profiles.find((p) => p.friendCode === codeUpper);
      if (!profile) {
        throw new NotFoundException('No profile found with that friend code');
      }

      const users = this.prisma.getMockUsers();
      const user = users.find((u) => u.id === profile.userId) || {};

      return {
        ...profile,
        username: user.username || '',
      };
    }

    const profile = await this.prisma.profile.findUnique({
      where: { friendCode: codeUpper },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('No profile found with that friend code');
    }

    return {
      ...profile,
      username: profile.user?.username || '',
    };
  }
}
