import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/create-goal.dto';
import * as crypto from 'crypto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new goal.
   */
  async createGoal(userId: string, dto: CreateGoalDto) {
    if (this.prisma.isFallbackMode) {
      const goals = this.prisma.getMockGoals();
      const newGoal = {
        id: crypto.randomUUID(),
        userId,
        title: dto.title,
        description: dto.description || null,
        status: dto.status || 'TODO',
        priority: dto.priority || 'MEDIUM',
        category: dto.category || 'General',
        colorLabel: dto.colorLabel || null,
        estimatedTime: dto.estimatedTime || 30,
        actualTime: dto.actualTime || 0,
        startAt: new Date(dto.startAt).toISOString(),
        endAt: new Date(dto.endAt).toISOString(),
        isRecurring: dto.isRecurring || false,
        recurrenceRule: dto.recurrenceRule || null,
        parentId: dto.parentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      goals.push(newGoal);
      this.prisma.saveMockGoals(goals);
      return newGoal;
    }

    return this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description || null,
        status: dto.status || 'TODO',
        priority: dto.priority || 'MEDIUM',
        category: dto.category || 'Work',
        estimatedTime: dto.estimatedTime || 30,
        actualTime: dto.actualTime || 0,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
      },
    });
  }

  /**
   * Retrieves a single goal.
   */
  async getGoal(userId: string, goalId: string) {
    if (this.prisma.isFallbackMode) {
      const goals = this.prisma.getMockGoals();
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) {
        throw new NotFoundException('Goal not found');
      }

      if (goal.userId !== userId) {
        const isFriend = await this.checkIsFriend(userId, goal.userId);
        if (!isFriend) {
          throw new ForbiddenException('You do not have access to view this goal');
        }
      }
      return goal;
    }

    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      const isFriend = await this.checkIsFriend(userId, goal.userId);
      if (!isFriend) {
        throw new ForbiddenException('You do not have access to view this goal');
      }
    }

    return goal;
  }

  /**
   * Updates an existing goal. Logs an activity if completed.
   */
  async updateGoal(userId: string, goalId: string, dto: UpdateGoalDto) {
    if (this.prisma.isFallbackMode) {
      const goals = this.prisma.getMockGoals();
      const index = goals.findIndex((g) => g.id === goalId);
      if (index === -1) {
        throw new NotFoundException('Goal not found');
      }

      const currentGoal = goals[index];
      if (currentGoal.userId !== userId) {
        throw new ForbiddenException('You are not authorized to update this goal');
      }

      goals[index] = {
        ...currentGoal,
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      this.prisma.saveMockGoals(goals);
      return goals[index];
    }

    const currentGoal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!currentGoal) {
      throw new NotFoundException('Goal not found');
    }
    if (currentGoal.userId !== userId) {
      throw new ForbiddenException('You are not authorized to update this goal');
    }

    // Convert string inputs to Date objects if updating start/end dates
    const dataUpdate: any = { ...dto };
    if (dto.startAt) dataUpdate.startAt = new Date(dto.startAt);
    if (dto.endAt) dataUpdate.endAt = new Date(dto.endAt);

    return this.prisma.goal.update({
      where: { id: goalId },
      data: dataUpdate,
    });
  }

  /**
   * Deletes a goal.
   */
  async deleteGoal(userId: string, goalId: string) {
    if (this.prisma.isFallbackMode) {
      const goals = this.prisma.getMockGoals();
      const index = goals.findIndex((g) => g.id === goalId);
      if (index === -1) {
        throw new NotFoundException('Goal not found');
      }

      if (goals[index].userId !== userId) {
        throw new ForbiddenException('You are not authorized to delete this goal');
      }

      this.prisma.saveMockGoals(goals.filter((g) => g.id !== goalId));
      return { message: 'Goal deleted successfully' };
    }

    const currentGoal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!currentGoal) {
      throw new NotFoundException('Goal not found');
    }
    if (currentGoal.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this goal');
    }

    await this.prisma.goal.delete({ where: { id: goalId } });
    return { message: 'Goal deleted successfully' };
  }

  /**
   * Lists goals for a user (with optional start and end date filters).
   */
  async listGoals(userId: string, startAt?: string, endAt?: string) {
    if (this.prisma.isFallbackMode) {
      let goals = this.prisma.getMockGoals().filter((g) => g.userId === userId);
      if (startAt) goals = goals.filter((g) => g.startAt >= startAt);
      if (endAt) goals = goals.filter((g) => g.startAt <= endAt);
      return goals;
    }

    const filters: any = { userId };
    if (startAt || endAt) {
      filters.startAt = {};
      if (startAt) filters.startAt.gte = new Date(startAt);
      if (endAt) filters.startAt.lte = new Date(endAt);
    }

    return this.prisma.goal.findMany({
      where: filters,
      orderBy: { startAt: 'asc' },
    });
  }

  /**
   * Add a comment to a goal (Social features).
   */
  async addComment(userId: string, goalId: string, content: string) {
    const goal = await this.getGoal(userId, goalId);

    if (this.prisma.isFallbackMode) {
      const comments = this.prisma.getMockComments();
      const profiles = this.prisma.getMockProfiles();
      const profile = profiles.find((p) => p.userId === userId) || {};

      const newComment = {
        id: crypto.randomUUID(),
        goalId,
        userId,
        displayName: profile.displayName || 'Anonymous User',
        avatarUrl: profile.avatarUrl || null,
        content,
        createdAt: new Date().toISOString(),
      };
      comments.push(newComment);
      this.prisma.saveMockComments(comments);
      return newComment;
    }

    return this.prisma.comment.create({
      data: {
        goalId,
        userId,
        content,
      },
    });
  }

  /**
   * Add an emoji reaction to a goal.
   */
  async addReaction(userId: string, goalId: string, emoji: string) {
    await this.getGoal(userId, goalId);

    if (this.prisma.isFallbackMode) {
      const reactions = this.prisma.getMockReactions();
      const docId = `${goalId}_${userId}_${encodeURIComponent(emoji)}`;
      
      // Upsert reaction
      const index = reactions.findIndex((r) => r.id === docId);
      const newReaction = {
        id: docId,
        goalId,
        userId,
        emoji,
        createdAt: new Date().toISOString(),
      };
      if (index > -1) {
        reactions[index] = newReaction;
      } else {
        reactions.push(newReaction);
      }
      this.prisma.saveMockReactions(reactions);
      return { message: 'Reaction added successfully', emoji };
    }

    await this.prisma.reaction.upsert({
      where: {
        goalId_userId_emoji: { goalId, userId, emoji },
      },
      create: { goalId, userId, emoji },
      update: { emoji },
    });

    return { message: 'Reaction added successfully', emoji };
  }

  /**
   * Fetch social metadata (comments & reactions) for a goal.
   */
  async getGoalSocialDetails(goalId: string) {
    if (this.prisma.isFallbackMode) {
      const comments = this.prisma.getMockComments().filter((c) => c.goalId === goalId);
      const reactions = this.prisma.getMockReactions().filter((r) => r.goalId === goalId);
      return { comments, reactions };
    }

    const [comments, reactions] = await Promise.all([
      this.prisma.comment.findMany({
        where: { goalId },
        include: { user: { select: { username: true } } },
      }),
      this.prisma.reaction.findMany({
        where: { goalId },
      }),
    ]);

    return { comments, reactions };
  }

  /**
   * Fetch Social Feed activities for a user and their friends.
   */
  async getSocialFeed(userId: string) {
    const friendIds = new Set<string>([userId]);

    if (this.prisma.isFallbackMode) {
      const friendships = this.prisma.getMockFriendships();
      const accepted = friendships.filter(
        (f) => (f.senderId === userId || f.receiverId === userId) && f.status === 'ACCEPTED',
      );
      accepted.forEach((f) => {
        friendIds.add(f.senderId === userId ? f.receiverId : f.senderId);
      });

      const completedGoals = this.prisma
        .getMockGoals()
        .filter((g) => friendIds.has(g.userId) && g.status === 'COMPLETED');

      const profiles = this.prisma.getMockProfiles();
      const hydrated = completedGoals.map((g) => {
        const profile = profiles.find((p) => p.userId === g.userId) || {};
        return {
          id: g.id,
          userId: g.userId,
          type: 'GOAL_COMPLETED',
          createdAt: g.updatedAt,
          displayName: profile.displayName || 'Unknown Friend',
          avatarUrl: profile.avatarUrl || null,
          content: JSON.stringify({
            goalId: g.id,
            title: g.title,
            completedAt: g.updatedAt,
          }),
        };
      });

      return hydrated.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: 'ACCEPTED',
      },
    });

    friendships.forEach((f) => {
      friendIds.add(f.senderId === userId ? f.receiverId : f.senderId);
    });

    const completedGoals = await this.prisma.goal.findMany({
      where: {
        userId: { in: Array.from(friendIds) },
        status: 'COMPLETED',
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return completedGoals.map((g) => ({
      id: g.id,
      userId: g.userId,
      type: 'GOAL_COMPLETED',
      createdAt: g.updatedAt.toISOString(),
      displayName: g.user.profile?.displayName || g.user.username,
      avatarUrl: g.user.profile?.avatarUrl || null,
      content: JSON.stringify({
        goalId: g.id,
        title: g.title,
        completedAt: g.updatedAt.toISOString(),
      }),
    }));
  }

  /**
   * Helper to verify if two users are accepted friends.
   */
  private async checkIsFriend(userId: string, targetId: string): Promise<boolean> {
    if (this.prisma.isFallbackMode) {
      const friendships = this.prisma.getMockFriendships();
      return friendships.some(
        (f) =>
          ((f.senderId === userId && f.receiverId === targetId) ||
            (f.senderId === targetId && f.receiverId === userId)) &&
          f.status === 'ACCEPTED',
      );
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId },
        ],
        status: 'ACCEPTED',
      },
    });

    return !!friendship;
  }
}
