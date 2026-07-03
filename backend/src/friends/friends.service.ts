import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Sends a friend request to a user via their unique Friend Code.
   */
  async sendFriendRequest(senderId: string, friendCode: string) {
    const codeUpper = friendCode.toUpperCase();
    let receiverId = '';

    if (this.prisma.isFallbackMode) {
      const profiles = this.prisma.getMockProfiles();
      const profile = profiles.find((p) => p.friendCode === codeUpper);
      if (!profile) {
        throw new NotFoundException('No user found with that friend code');
      }
      receiverId = profile.userId;

      if (senderId === receiverId) {
        throw new ConflictException('You cannot send a friend request to yourself');
      }

      const friendships = this.prisma.getMockFriendships();
      const friendshipIndex = friendships.findIndex(
        (f) =>
          (f.senderId === senderId && f.receiverId === receiverId) ||
          (f.senderId === receiverId && f.receiverId === senderId),
      );

      if (friendshipIndex > -1) {
        const friendship = friendships[friendshipIndex];
        if (friendship.status === 'ACCEPTED') {
          throw new ConflictException('You are already friends with this user');
        }
        if (friendship.status === 'PENDING') {
          if (friendship.senderId === senderId) {
            throw new ConflictException('Friend request already sent and pending');
          } else {
            // Auto-accept request from the other user!
            friendships[friendshipIndex].status = 'ACCEPTED';
            friendships[friendshipIndex].updatedAt = new Date().toISOString();
            this.prisma.saveMockFriendships(friendships);
            return { message: 'Friend request accepted automatically', status: 'ACCEPTED' };
          }
        }
        if (friendship.status === 'BLOCKED') {
          throw new ForbiddenException('Cannot send friend request');
        }
      }

      const newFriendship = {
        id: crypto.randomUUID(),
        senderId,
        receiverId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      friendships.push(newFriendship);
      this.prisma.saveMockFriendships(friendships);
      return { message: 'Friend request sent successfully', status: 'PENDING' };
    }

    // --- PostgreSQL Implementation ---
    const profile = await this.prisma.profile.findUnique({
      where: { friendCode: codeUpper },
    });
    if (!profile) {
      throw new NotFoundException('No user found with that friend code');
    }
    receiverId = profile.userId;

    if (senderId === receiverId) {
      throw new ConflictException('You cannot send a friend request to yourself');
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new ConflictException('You are already friends with this user');
      }
      if (existing.status === 'PENDING') {
        if (existing.senderId === senderId) {
          throw new ConflictException('Friend request already sent and pending');
        } else {
          await this.prisma.friendship.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED' },
          });
          return { message: 'Friend request accepted automatically', status: 'ACCEPTED' };
        }
      }
      if (existing.status === 'BLOCKED') {
        throw new ForbiddenException('Cannot send friend request');
      }
    }

    await this.prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
    });

    return { message: 'Friend request sent successfully', status: 'PENDING' };
  }

  /**
   * Accepts a pending friend request.
   */
  async acceptFriendRequest(userId: string, senderId: string) {
    if (this.prisma.isFallbackMode) {
      const friendships = this.prisma.getMockFriendships();
      const index = friendships.findIndex(
        (f) => f.senderId === senderId && f.receiverId === userId && f.status === 'PENDING',
      );
      if (index === -1) {
        throw new NotFoundException('Friend request not found');
      }

      friendships[index].status = 'ACCEPTED';
      friendships[index].updatedAt = new Date().toISOString();
      this.prisma.saveMockFriendships(friendships);
      return { message: 'Friend request accepted successfully' };
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: { senderId, receiverId: userId, status: 'PENDING' },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    await this.prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'ACCEPTED' },
    });

    return { message: 'Friend request accepted successfully' };
  }

  /**
   * Rejects or cancels a pending request.
   */
  async rejectFriendRequest(userId: string, friendId: string) {
    if (this.prisma.isFallbackMode) {
      const friendships = this.prisma.getMockFriendships();
      const index = friendships.findIndex(
        (f) =>
          ((f.senderId === userId && f.receiverId === friendId) ||
            (f.senderId === friendId && f.receiverId === userId)) &&
          f.status === 'PENDING',
      );
      if (index === -1) {
        throw new NotFoundException('Friend request not found');
      }

      this.prisma.saveMockFriendships(friendships.filter((_, idx) => idx !== index));
      return { message: 'Friend request rejected/cancelled successfully' };
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: 'PENDING',
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'Friend request rejected/cancelled successfully' };
  }

  /**
   * Blocks a user.
   */
  async blockUser(userId: string, friendId: string) {
    if (this.prisma.isFallbackMode) {
      const friendships = this.prisma.getMockFriendships();
      const index = friendships.findIndex(
        (f) =>
          (f.senderId === userId && f.receiverId === friendId) ||
          (f.senderId === friendId && f.receiverId === userId),
      );

      const blockRecord = {
        id: index > -1 ? friendships[index].id : crypto.randomUUID(),
        senderId: userId,
        receiverId: friendId,
        status: 'BLOCKED',
        createdAt: index > -1 ? friendships[index].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (index > -1) {
        friendships[index] = blockRecord;
      } else {
        friendships.push(blockRecord);
      }
      this.prisma.saveMockFriendships(friendships);
      return { message: 'User blocked successfully' };
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });

    if (existing) {
      await this.prisma.friendship.update({
        where: { id: existing.id },
        data: {
          status: 'BLOCKED',
          senderId: userId, // track who blocked
          receiverId: friendId,
        },
      });
    } else {
      await this.prisma.friendship.create({
        data: {
          senderId: userId,
          receiverId: friendId,
          status: 'BLOCKED',
        },
      });
    }

    return { message: 'User blocked successfully' };
  }

  /**
   * Unblocks a user.
   */
  async unblockUser(userId: string, friendId: string) {
    if (this.prisma.isFallbackMode) {
      const friendships = this.prisma.getMockFriendships();
      const index = friendships.findIndex(
        (f) =>
          (f.senderId === userId && f.receiverId === friendId && f.status === 'BLOCKED') ||
          (f.senderId === friendId && f.receiverId === userId && f.status === 'BLOCKED'),
      );

      if (index === -1) {
        throw new NotFoundException('Friendship record not found');
      }

      this.prisma.saveMockFriendships(friendships.filter((_, idx) => idx !== index));
      return { message: 'User unblocked successfully' };
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: 'BLOCKED',
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship record not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'User unblocked successfully' };
  }

  /**
   * Lists all accepted friends of a user.
   */
  async listFriends(userId: string) {
    if (this.prisma.isFallbackMode) {
      const friendships = this.prisma.getMockFriendships();
      const accepted = friendships.filter(
        (f) => (f.senderId === userId || f.receiverId === userId) && f.status === 'ACCEPTED',
      );

      const profiles = this.prisma.getMockProfiles();
      const users = this.prisma.getMockUsers();

      return accepted
        .map((f) => {
          const friendId = f.senderId === userId ? f.receiverId : f.senderId;
          const profile = profiles.find((p) => p.userId === friendId) || {};
          const user = users.find((u) => u.id === friendId) || {};
          return {
            ...profile,
            username: user.username || '',
          };
        })
        .filter((f) => f.userId);
    }

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: 'ACCEPTED',
      },
      include: {
        sender: { include: { profile: true } },
        receiver: { include: { profile: true } },
      },
    });

    return friendships.map((f) => {
      const isSender = f.senderId === userId;
      const friendUser = isSender ? f.receiver : f.sender;
      return {
        id: friendUser.profile?.id,
        userId: friendUser.id,
        displayName: friendUser.profile?.displayName || friendUser.username,
        bio: friendUser.profile?.bio || null,
        avatarUrl: friendUser.profile?.avatarUrl || null,
        timezone: friendUser.profile?.timezone || 'UTC',
        country: friendUser.profile?.country || null,
        friendCode: friendUser.profile?.friendCode || '',
        username: friendUser.username,
      };
    });
  }

  /**
   * Lists all pending friend requests received by a user.
   */
  async listPendingRequests(userId: string) {
    if (this.prisma.isFallbackMode) {
      const friendships = this.prisma.getMockFriendships();
      const pending = friendships.filter((f) => f.receiverId === userId && f.status === 'PENDING');

      const profiles = this.prisma.getMockProfiles();
      const users = this.prisma.getMockUsers();

      return pending.map((f) => {
        const profile = profiles.find((p) => p.userId === f.senderId) || {};
        const user = users.find((u) => u.id === f.senderId) || {};
        return {
          userId: f.senderId,
          displayName: profile.displayName || user.username || '',
          friendCode: profile.friendCode || '',
          avatarUrl: profile.avatarUrl || null,
          sentAt: f.createdAt,
        };
      });
    }

    const pending = await this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          include: { profile: true },
        },
      },
    });

    return pending.map((f) => ({
      userId: f.senderId,
      displayName: f.sender.profile?.displayName || f.sender.username,
      friendCode: f.sender.profile?.friendCode || '',
      avatarUrl: f.sender.profile?.avatarUrl || null,
      sentAt: f.createdAt.toISOString(),
    }));
  }
}
