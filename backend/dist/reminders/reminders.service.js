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
var RemindersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
let RemindersService = RemindersService_1 = class RemindersService {
    prisma;
    logger = new common_1.Logger(RemindersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleGoalReminders() {
        this.logger.debug('Scanning database for upcoming goals to send reminders...');
        const now = new Date();
        const fifteenMinutes = 15 * 60 * 1000;
        const alertThreshold = new Date(now.getTime() + fifteenMinutes);
        let upcomingGoals = [];
        if (this.prisma.isFallbackMode) {
            const goals = this.prisma.getMockGoals();
            upcomingGoals = goals.filter((g) => {
                if (g.status !== 'TODO' && g.status !== 'IN_PROGRESS')
                    return false;
                if (g.notified === true)
                    return false;
                if (!g.startAt)
                    return false;
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
                        const goalIndex = goals.findIndex((g) => g.id === goal.id);
                        goals[goalIndex].notified = true;
                    }
                    catch (err) {
                        this.logger.error(`Error sending reminder for goal ${goal.id}: ${err.message}`);
                    }
                }
                this.prisma.saveMockGoals(goals);
            }
            return;
        }
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
            }
            catch (err) {
                this.logger.error(`Error sending reminder for goal ${goal.id}: ${err.message}`);
            }
        }
    }
    sendEmailReminder(email, title, startAt) {
        const timeStr = new Date(startAt).toLocaleTimeString();
        this.logger.log(`[EMAIL SENT] To: ${email} | Subject: Reminder: ${title} | Content: Your task "${title}" starts at ${timeStr}.`);
    }
    sendPushReminder(userId, title) {
        this.logger.log(`[PUSH SENT] To User: ${userId} | Message: Dynamic Alert: "${title}" is starting in less than 15 minutes!`);
    }
};
exports.RemindersService = RemindersService;
__decorate([
    (0, schedule_1.Cron)('*/1 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RemindersService.prototype, "handleGoalReminders", null);
exports.RemindersService = RemindersService = RemindersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map