import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto, UpdateHabitDto, LogHabitDto } from './dto/create-habit.dto';
import * as crypto from 'crypto';

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new habit.
   */
  async createHabit(userId: string, dto: CreateHabitDto) {
    if (this.prisma.isFallbackMode) {
      const habits = this.prisma.getMockHabits();
      const newHabit = {
        id: crypto.randomUUID(),
        userId,
        name: dto.name,
        description: dto.description || null,
        frequency: dto.frequency,
        daysOfWeek: dto.daysOfWeek || [],
        logs: {},
        currentStreak: 0,
        longestStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      habits.push(newHabit);
      this.prisma.saveMockHabits(habits);
      return newHabit;
    }

    return this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
        frequency: dto.frequency,
        daysOfWeek: dto.daysOfWeek || [],
        logs: {},
      },
    });
  }

  /**
   * Retrieves a single habit.
   */
  async getHabit(userId: string, habitId: string) {
    if (this.prisma.isFallbackMode) {
      const habits = this.prisma.getMockHabits();
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) {
        throw new NotFoundException('Habit not found');
      }
      if (habit.userId !== userId) {
        throw new ForbiddenException('You do not have access to this habit');
      }
      return habit;
    }

    const habit = await this.prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException('You do not have access to this habit');
    }

    return habit;
  }

  /**
   * Updates an existing habit.
   */
  async updateHabit(userId: string, habitId: string, dto: UpdateHabitDto) {
    if (this.prisma.isFallbackMode) {
      const habits = this.prisma.getMockHabits();
      const index = habits.findIndex((h) => h.id === habitId);
      if (index === -1) {
        throw new NotFoundException('Habit not found');
      }

      const habit = habits[index];
      if (habit.userId !== userId) {
        throw new ForbiddenException('You are not authorized to update this habit');
      }

      habits[index] = {
        ...habit,
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      this.prisma.saveMockHabits(habits);
      return habits[index];
    }

    const currentHabit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!currentHabit) {
      throw new NotFoundException('Habit not found');
    }
    if (currentHabit.userId !== userId) {
      throw new ForbiddenException('You are not authorized to update this habit');
    }

    return this.prisma.habit.update({
      where: { id: habitId },
      data: {
        ...dto,
      },
    });
  }

  /**
   * Deletes a habit.
   */
  async deleteHabit(userId: string, habitId: string) {
    if (this.prisma.isFallbackMode) {
      const habits = this.prisma.getMockHabits();
      const index = habits.findIndex((h) => h.id === habitId);
      if (index === -1) {
        throw new NotFoundException('Habit not found');
      }

      if (habits[index].userId !== userId) {
        throw new ForbiddenException('You are not authorized to delete this habit');
      }

      this.prisma.saveMockHabits(habits.filter((h) => h.id !== habitId));
      return { message: 'Habit deleted successfully' };
    }

    const currentHabit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!currentHabit) {
      throw new NotFoundException('Habit not found');
    }
    if (currentHabit.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this habit');
    }

    await this.prisma.habit.delete({ where: { id: habitId } });
    return { message: 'Habit deleted successfully' };
  }

  /**
   * Lists all habits for a user.
   */
  async listHabits(userId: string) {
    if (this.prisma.isFallbackMode) {
      return this.prisma.getMockHabits().filter((h) => h.userId === userId);
    }

    return this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Logs a completion/uncompletion date for a habit and recalculates streaks.
   */
  async logHabit(userId: string, habitId: string, dto: LogHabitDto) {
    const habit = await this.getHabit(userId, habitId);

    const logs = (habit.logs as Record<string, boolean>) || {};
    const updatedLogs = { ...logs };
    updatedLogs[dto.date] = dto.completed;

    const streakResult = this.calculateStreaks(updatedLogs);

    if (this.prisma.isFallbackMode) {
      const habits = this.prisma.getMockHabits();
      const index = habits.findIndex((h) => h.id === habitId);
      habits[index].logs = updatedLogs;
      habits[index].currentStreak = streakResult.currentStreak;
      habits[index].longestStreak = streakResult.longestStreak;
      habits[index].updatedAt = new Date().toISOString();
      this.prisma.saveMockHabits(habits);
    } else {
      await this.prisma.habit.update({
        where: { id: habitId },
        data: {
          logs: updatedLogs,
          currentStreak: streakResult.currentStreak,
          longestStreak: streakResult.longestStreak,
        },
      });
    }

    return {
      habitId,
      date: dto.date,
      completed: dto.completed,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
    };
  }

  /**
   * Core algorithm to compute streaks from date maps.
   */
  private calculateStreaks(logs: Record<string, boolean>) {
    const completedDates = Object.keys(logs)
      .filter((dateStr) => logs[dateStr] === true)
      .sort((a, b) => b.localeCompare(a)); // sort descending (newest first)

    if (completedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // 1. Calculate Current Streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = formatDate(today);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    const isTodayCompleted = logs[todayStr] === true;
    const isYesterdayCompleted = logs[yesterdayStr] === true;

    if (isTodayCompleted || isYesterdayCompleted) {
      const walkDate = isTodayCompleted ? today : yesterday;
      while (true) {
        const walkStr = formatDate(walkDate);
        if (logs[walkStr] === true) {
          currentStreak++;
          walkDate.setDate(walkDate.getDate() - 1); // step back 1 day
        } else {
          break;
        }
      }
    }

    // 2. Calculate Longest Streak (Historical Max)
    const sortedAsc = [...completedDates].sort((a, b) => a.localeCompare(b));
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of sortedAsc) {
      const currentDate = new Date(dateStr);
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }
      prevDate = new Date(dateStr); // match walk exactly
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return { currentStreak, longestStreak };
  }
}
