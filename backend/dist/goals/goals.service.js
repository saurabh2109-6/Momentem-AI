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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let GoalsService = class GoalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGoal(userId, dto) {
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
    async getGoal(userId, goalId) {
        if (this.prisma.isFallbackMode) {
            const goals = this.prisma.getMockGoals();
            const goal = goals.find((g) => g.id === goalId);
            if (!goal) {
                throw new common_1.NotFoundException('Goal not found');
            }
            if (goal.userId !== userId) {
                const isFriend = await this.checkIsFriend(userId, goal.userId);
                if (!isFriend) {
                    throw new common_1.ForbiddenException('You do not have access to view this goal');
                }
            }
            return goal;
        }
        const goal = await this.prisma.goal.findUnique({
            where: { id: goalId },
        });
        if (!goal) {
            throw new common_1.NotFoundException('Goal not found');
        }
        if (goal.userId !== userId) {
            const isFriend = await this.checkIsFriend(userId, goal.userId);
            if (!isFriend) {
                throw new common_1.ForbiddenException('You do not have access to view this goal');
            }
        }
        return goal;
    }
    async updateGoal(userId, goalId, dto) {
        if (this.prisma.isFallbackMode) {
            const goals = this.prisma.getMockGoals();
            const index = goals.findIndex((g) => g.id === goalId);
            if (index === -1) {
                throw new common_1.NotFoundException('Goal not found');
            }
            const currentGoal = goals[index];
            if (currentGoal.userId !== userId) {
                throw new common_1.ForbiddenException('You are not authorized to update this goal');
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
            throw new common_1.NotFoundException('Goal not found');
        }
        if (currentGoal.userId !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to update this goal');
        }
        const dataUpdate = { ...dto };
        if (dto.startAt)
            dataUpdate.startAt = new Date(dto.startAt);
        if (dto.endAt)
            dataUpdate.endAt = new Date(dto.endAt);
        return this.prisma.goal.update({
            where: { id: goalId },
            data: dataUpdate,
        });
    }
    async deleteGoal(userId, goalId) {
        if (this.prisma.isFallbackMode) {
            const goals = this.prisma.getMockGoals();
            const index = goals.findIndex((g) => g.id === goalId);
            if (index === -1) {
                throw new common_1.NotFoundException('Goal not found');
            }
            if (goals[index].userId !== userId) {
                throw new common_1.ForbiddenException('You are not authorized to delete this goal');
            }
            this.prisma.saveMockGoals(goals.filter((g) => g.id !== goalId));
            return { message: 'Goal deleted successfully' };
        }
        const currentGoal = await this.prisma.goal.findUnique({ where: { id: goalId } });
        if (!currentGoal) {
            throw new common_1.NotFoundException('Goal not found');
        }
        if (currentGoal.userId !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to delete this goal');
        }
        await this.prisma.goal.delete({ where: { id: goalId } });
        return { message: 'Goal deleted successfully' };
    }
    async listGoals(userId, startAt, endAt) {
        if (this.prisma.isFallbackMode) {
            let goals = this.prisma.getMockGoals().filter((g) => g.userId === userId);
            if (startAt)
                goals = goals.filter((g) => g.startAt >= startAt);
            if (endAt)
                goals = goals.filter((g) => g.startAt <= endAt);
            return goals;
        }
        const filters = { userId };
        if (startAt || endAt) {
            filters.startAt = {};
            if (startAt)
                filters.startAt.gte = new Date(startAt);
            if (endAt)
                filters.startAt.lte = new Date(endAt);
        }
        return this.prisma.goal.findMany({
            where: filters,
            orderBy: { startAt: 'asc' },
        });
    }
    async addComment(userId, goalId, content) {
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
    async addReaction(userId, goalId, emoji) {
        await this.getGoal(userId, goalId);
        if (this.prisma.isFallbackMode) {
            const reactions = this.prisma.getMockReactions();
            const docId = `${goalId}_${userId}_${encodeURIComponent(emoji)}`;
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
            }
            else {
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
    async getGoalSocialDetails(goalId) {
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
    async getSocialFeed(userId) {
        const friendIds = new Set([userId]);
        if (this.prisma.isFallbackMode) {
            const friendships = this.prisma.getMockFriendships();
            const accepted = friendships.filter((f) => (f.senderId === userId || f.receiverId === userId) && f.status === 'ACCEPTED');
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
    async checkIsFriend(userId, targetId) {
        if (this.prisma.isFallbackMode) {
            const friendships = this.prisma.getMockFriendships();
            return friendships.some((f) => ((f.senderId === userId && f.receiverId === targetId) ||
                (f.senderId === targetId && f.receiverId === userId)) &&
                f.status === 'ACCEPTED');
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
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map