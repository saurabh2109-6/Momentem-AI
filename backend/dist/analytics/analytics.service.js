"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserAnalytics(userId) {
        let goals = [];
        let habits = [];
        if (this.prisma.isFallbackMode) {
            goals = this.prisma.getMockGoals().filter((g) => g.userId === userId);
            habits = this.prisma.getMockHabits().filter((h) => h.userId === userId);
        }
        else {
            [goals, habits] = await Promise.all([
                this.prisma.goal.findMany({ where: { userId } }),
                this.prisma.habit.findMany({ where: { userId } }),
            ]);
        }
        const totalGoals = goals.length;
        const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
        const missedGoals = goals.filter((g) => g.status === 'MISSED').length;
        const todoGoals = goals.filter((g) => g.status === 'TODO' || g.status === 'IN_PROGRESS').length;
        const successRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        const missRate = totalGoals > 0 ? Math.round((missedGoals / totalGoals) * 100) : 0;
        let longestStreak = 0;
        let totalHabitCompletionsLast30Days = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
        habits.forEach((habit) => {
            longestStreak = Math.max(longestStreak, habit.longestStreak || 0);
            const logs = habit.logs || {};
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
        const heatmap = {};
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            heatmap[dateStr] = 0;
        }
        goals.forEach((g) => {
            if (g.status === 'COMPLETED' && g.updatedAt) {
                const dateStr = (typeof g.updatedAt === 'string' ? g.updatedAt : g.updatedAt.toISOString()).split('T')[0];
                if (heatmap[dateStr] !== undefined) {
                    heatmap[dateStr]++;
                }
            }
        });
        habits.forEach((h) => {
            const logs = h.logs || {};
            Object.keys(logs).forEach((dateStr) => {
                if (logs[dateStr] === true && heatmap[dateStr] !== undefined) {
                    heatmap[dateStr]++;
                }
            });
        });
        const last3Days = Array.from({ length: 3 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return d.toISOString().split('T')[0];
        });
        let highIntensityDays = 0;
        last3Days.forEach((dateStr) => {
            const dailyGoals = goals.filter((g) => {
                const goalStart = typeof g.startAt === 'string' ? g.startAt : g.startAt.toISOString();
                return goalStart && goalStart.startsWith(dateStr);
            });
            const totalEstimatedMinutes = dailyGoals.reduce((sum, g) => sum + (g.estimatedTime || 0), 0);
            const urgentCount = dailyGoals.filter((g) => g.priority === 'URGENT' || g.priority === 'HIGH').length;
            if (totalEstimatedMinutes > 360 || urgentCount >= 3) {
                highIntensityDays++;
            }
        });
        let burnoutRisk = 'Low';
        if (highIntensityDays === 2)
            burnoutRisk = 'Medium';
        else if (highIntensityDays >= 3)
            burnoutRisk = 'High';
        const productivityScore = Math.round((successRate * 0.6) + (habitConsistency * 0.4));
        let predictionMessage = '';
        if (productivityScore > 80) {
            predictionMessage = 'High probability of meeting all scheduled goals tomorrow. Keep riding the momentum!';
        }
        else if (productivityScore > 50) {
            predictionMessage = 'Moderate probability of completion. Consider thinning out low-priority tasks.';
        }
        else {
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map