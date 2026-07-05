"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let HabitsService = class HabitsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createHabit(userId, dto) {
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
    async getHabit(userId, habitId) {
        if (this.prisma.isFallbackMode) {
            const habits = this.prisma.getMockHabits();
            const habit = habits.find((h) => h.id === habitId);
            if (!habit) {
                throw new common_1.NotFoundException('Habit not found');
            }
            if (habit.userId !== userId) {
                throw new common_1.ForbiddenException('You do not have access to this habit');
            }
            return habit;
        }
        const habit = await this.prisma.habit.findUnique({
            where: { id: habitId },
        });
        if (!habit) {
            throw new common_1.NotFoundException('Habit not found');
        }
        if (habit.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this habit');
        }
        return habit;
    }
    async updateHabit(userId, habitId, dto) {
        if (this.prisma.isFallbackMode) {
            const habits = this.prisma.getMockHabits();
            const index = habits.findIndex((h) => h.id === habitId);
            if (index === -1) {
                throw new common_1.NotFoundException('Habit not found');
            }
            const habit = habits[index];
            if (habit.userId !== userId) {
                throw new common_1.ForbiddenException('You are not authorized to update this habit');
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
            throw new common_1.NotFoundException('Habit not found');
        }
        if (currentHabit.userId !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to update this habit');
        }
        return this.prisma.habit.update({
            where: { id: habitId },
            data: {
                ...dto,
            },
        });
    }
    async deleteHabit(userId, habitId) {
        if (this.prisma.isFallbackMode) {
            const habits = this.prisma.getMockHabits();
            const index = habits.findIndex((h) => h.id === habitId);
            if (index === -1) {
                throw new common_1.NotFoundException('Habit not found');
            }
            if (habits[index].userId !== userId) {
                throw new common_1.ForbiddenException('You are not authorized to delete this habit');
            }
            this.prisma.saveMockHabits(habits.filter((h) => h.id !== habitId));
            return { message: 'Habit deleted successfully' };
        }
        const currentHabit = await this.prisma.habit.findUnique({ where: { id: habitId } });
        if (!currentHabit) {
            throw new common_1.NotFoundException('Habit not found');
        }
        if (currentHabit.userId !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to delete this habit');
        }
        await this.prisma.habit.delete({ where: { id: habitId } });
        return { message: 'Habit deleted successfully' };
    }
    async listHabits(userId) {
        if (this.prisma.isFallbackMode) {
            return this.prisma.getMockHabits().filter((h) => h.userId === userId);
        }
        return this.prisma.habit.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async logHabit(userId, habitId, dto) {
        const habit = await this.getHabit(userId, habitId);
        const logs = habit.logs || {};
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
        }
        else {
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
    calculateStreaks(logs) {
        const completedDates = Object.keys(logs)
            .filter((dateStr) => logs[dateStr] === true)
            .sort((a, b) => b.localeCompare(a));
        if (completedDates.length === 0) {
            return { currentStreak: 0, longestStreak: 0 };
        }
        const formatDate = (d) => d.toISOString().split('T')[0];
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
                    walkDate.setDate(walkDate.getDate() - 1);
                }
                else {
                    break;
                }
            }
        }
        const sortedAsc = [...completedDates].sort((a, b) => a.localeCompare(b));
        let longestStreak = 0;
        let tempStreak = 0;
        let prevDate = null;
        for (const dateStr of sortedAsc) {
            const currentDate = new Date(dateStr);
            if (prevDate === null) {
                tempStreak = 1;
            }
            else {
                const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                }
                else if (diffDays > 1) {
                    if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                    }
                    tempStreak = 1;
                }
            }
            prevDate = new Date(dateStr);
        }
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
        return { currentStreak, longestStreak };
    }
};
exports.HabitsService = HabitsService;
exports.HabitsService = HabitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HabitsService);
//# sourceMappingURL=habits.service.js.map