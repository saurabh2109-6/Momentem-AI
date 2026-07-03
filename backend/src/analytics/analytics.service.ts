import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Computes productivity metrics, success/miss ratios, streak logs,
   * burnout risks, and success heatmaps.
   */
  async getUserAnalytics(userId: string) {
    let goals: any[] = [];
    let habits: any[] = [];

    if (this.prisma.isFallbackMode) {
      goals = this.prisma.getMockGoals().filter((g) => g.userId === userId);
      habits = this.prisma.getMockHabits().filter((h) => h.userId === userId);
    } else {
      [goals, habits] = await Promise.all([
        this.prisma.goal.findMany({ where: { userId } }),
        this.prisma.habit.findMany({ where: { userId } }),
      ]);
    }

    // Compute Goal Statistics
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g: any) => g.status === 'COMPLETED').length;
    const missedGoals = goals.filter((g: any) => g.status === 'MISSED').length;
    const todoGoals = goals.filter((g: any) => g.status === 'TODO' || g.status === 'IN_PROGRESS').length;

    const successRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const missRate = totalGoals > 0 ? Math.round((missedGoals / totalGoals) * 100) : 0;

    // Compute Habit Streaks & Consistency
    let longestStreak = 0;
    let totalHabitCompletionsLast30Days = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    habits.forEach((habit: any) => {
      longestStreak = Math.max(longestStreak, habit.longestStreak || 0);
      
      const logs = (habit.logs as Record<string, boolean>) || {};
      Object.keys(logs).forEach((dateStr) => {
        if (dateStr >= thirtyDaysAgoStr && logs[dateStr] === true) {
          totalHabitCompletionsLast30Days++;
        }
      });
    });

    const expectedCompletions = habits.length * 30;
    const habitConsistency = expectedCompletions > 0 
      ? Math.min(100, Math.round((totalHabitCompletionsLast30Days / expectedCompletions) * 100))
      : 0;

    // Compute 30-Day Completion Heatmap (Goals + Habits)
    const heatmap: Record<string, number> = {};
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      heatmap[dateStr] = 0;
    }

    // Add goal completions to heatmap
    goals.forEach((g: any) => {
      if (g.status === 'COMPLETED' && g.updatedAt) {
        const dateStr = (typeof g.updatedAt === 'string' ? g.updatedAt : g.updatedAt.toISOString()).split('T')[0];
        if (heatmap[dateStr] !== undefined) {
          heatmap[dateStr]++;
        }
      }
    });

    // Add habit completions to heatmap
    habits.forEach((h: any) => {
      const logs = (h.logs as Record<string, boolean>) || {};
      Object.keys(logs).forEach((dateStr) => {
        if (logs[dateStr] === true && heatmap[dateStr] !== undefined) {
          heatmap[dateStr]++;
        }
      });
    });

    // Burnout Risk Assessment (Heuristic)
    const last3Days = Array.from({ length: 3 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    let highIntensityDays = 0;
    last3Days.forEach((dateStr) => {
      const dailyGoals = goals.filter((g: any) => {
        const goalStart = typeof g.startAt === 'string' ? g.startAt : g.startAt.toISOString();
        return goalStart && goalStart.startsWith(dateStr);
      });
      const totalEstimatedMinutes = dailyGoals.reduce((sum: number, g: any) => sum + (g.estimatedTime || 0), 0);
      const urgentCount = dailyGoals.filter((g: any) => g.priority === 'URGENT' || g.priority === 'HIGH').length;

      if (totalEstimatedMinutes > 360 || urgentCount >= 3) {
        highIntensityDays++;
      }
    });

    let burnoutRisk: 'Low' | 'Medium' | 'High' = 'Low';
    if (highIntensityDays === 2) burnoutRisk = 'Medium';
    else if (highIntensityDays >= 3) burnoutRisk = 'High';

    // Future Productivity Prediction
    const productivityScore = Math.round((successRate * 0.6) + (habitConsistency * 0.4));
    let predictionMessage = '';

    if (productivityScore > 80) {
      predictionMessage = 'High probability of meeting all scheduled goals tomorrow. Keep riding the momentum!';
    } else if (productivityScore > 50) {
      predictionMessage = 'Moderate probability of completion. Consider thinning out low-priority tasks.';
    } else {
      predictionMessage = 'Low consistency indicators. We recommend scheduling small, single-step tasks to rebuild streaks.';
    }

    return {
      productivityScore,
      goalStats: {
        total: totalGoals,
        completed: completedGoals,
        missed: missedGoals,
        todo: todoGoals,
        successRate,
        missRate,
      },
      habitStats: {
        longestStreak,
        consistency: habitConsistency,
      },
      heatmap,
      burnoutRisk,
      prediction: {
        score: productivityScore,
        message: predictionMessage,
      },
    };
  }
}
