import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cron job running every minute to search for goals starting in the next 15 minutes
   * that haven't triggered a notification alert yet.
   */
  @Cron('*/1 * * * *')
  async handleGoalReminders() {
    this.logger.debug('Scanning database for upcoming goals to send reminders...');

    const now = new Date();
    const fifteenMinutes = 15 * 60 * 1000;
    const alertThreshold = new Date(now.getTime() + fifteenMinutes);

    let upcomingGoals: any[] = [];

    if (this.prisma.isFallbackMode) {
      const goals = this.prisma.getMockGoals();
      upcomingGoals = goals.filter((g: any) => {
        if (g.status !== 'TODO' && g.status !== 'IN_PROGRESS') return false;
        if (g.notified === true) return false;
        if (!g.startAt) return false;

        const startTime = new Date(g.startAt).getTime();
        return startTime >= now.getTime() && startTime <= alertThreshold.getTime();
      });

      if (upcomingGoals.length > 0) {
        this.logger.log(`Found ${upcomingGoals.length} upcoming goal(s) requiring reminders (Mock).`);
        const users = this.prisma.getMockUsers();

        for (const goal of upcomingGoals) {
          try {
            const user = users.find((u) => u.id === goal.userId) || {};
            this.sendEmailReminder(user.email || 'mock@example.com', goal.title, goal.startAt);
            this.sendPushReminder(goal.userId, goal.title);

            // Mark notified
            const goalIndex = goals.findIndex((g) => g.id === goal.id);
            goals[goalIndex].notified = true;
          } catch (err: any) {
            this.logger.error(`Error sending reminder for goal ${goal.id}: ${err.message}`);
          }
        }
        this.prisma.saveMockGoals(goals);
      }
      return;
    }

    // --- PostgreSQL Implementation ---
    upcomingGoals = await this.prisma.goal.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        notified: false,
        startAt: {
          gte: now,
          lte: alertThreshold,
        },
      },
      include: {
        user: true,
      },
    });

    if (upcomingGoals.length === 0) {
      return;
    }

    this.logger.log(`Found ${upcomingGoals.length} upcoming goal(s) requiring reminders.`);

    for (const goal of upcomingGoals) {
      try {
        this.sendEmailReminder(goal.user.email, goal.title, goal.startAt.toISOString());
        this.sendPushReminder(goal.userId, goal.title);

        await this.prisma.goal.update({
          where: { id: goal.id },
          data: { notified: true },
        });
      } catch (err: any) {
        this.logger.error(`Error sending reminder for goal ${goal.id}: ${err.message}`);
      }
    }
  }

  private sendEmailReminder(email: string, title: string, startAt: string) {
    const timeStr = new Date(startAt).toLocaleTimeString();
    this.logger.log(`[EMAIL SENT] To: ${email} | Subject: Reminder: ${title} | Content: Your task "${title}" starts at ${timeStr}.`);
  }

  private sendPushReminder(userId: string, title: string) {
    this.logger.log(`[PUSH SENT] To User: ${userId} | Message: Dynamic Alert: "${title}" is starting in less than 15 minutes!`);
  }
}
