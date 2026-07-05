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
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let FriendsService = class FriendsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendFriendRequest(senderId, friendCode) {
        const codeUpper = friendCode.toUpperCase();
        let receiverId = '';
        if (this.prisma.isFallbackMode) {
            const profiles = this.prisma.getMockProfiles();
            const profile = profiles.find((p) => p.friendCode === codeUpper);
            if (!profile) {
                throw new common_1.NotFoundException('No user found with that friend code');
            }
            receiverId = profile.userId;
            if (senderId === receiverId) {
                throw new common_1.ConflictException('You cannot send a friend request to yourself');
            }
            const friendships = this.prisma.getMockFriendships();
            const friendshipIndex = friendships.findIndex((f) => (f.senderId === senderId && f.receiverId === receiverId) ||
                (f.senderId === receiverId && f.receiverId === senderId));
            if (friendshipIndex > -1) {
                const friendship = friendships[friendshipIndex];
                if (friendship.status === 'ACCEPTED') {
                    throw new common_1.ConflictException('You are already friends with this user');
                }
                if (friendship.status === 'PENDING') {
                    if (friendship.senderId === senderId) {
                        throw new common_1.ConflictException('Friend request already sent and pending');
                    }
                    else {
                        friendships[friendshipIndex].status = 'ACCEPTED';
                        friendships[friendshipIndex].updatedAt = new Date().toISOString();
                        this.prisma.saveMockFriendships(friendships);
                        return { message: 'Friend request accepted automatically', status: 'ACCEPTED' };
                    }
                }
                if (friendship.status === 'BLOCKED') {
                    throw new common_1.ForbiddenException('Cannot send friend request');
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
        const profile = await this.prisma.profile.findUnique({
            where: { friendCode: codeUpper },
        });
        if (!profile) {
            throw new common_1.NotFoundException('No user found with that friend code');
        }
        receiverId = profile.userId;
        if (senderId === receiverId) {
            throw new common_1.ConflictException('You cannot send a friend request to yourself');
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
                throw new common_1.ConflictException('You are already friends with this user');
            }
            if (existing.status === 'PENDING') {
                if (existing.senderId === senderId) {
                    throw new common_1.ConflictException('Friend request already sent and pending');
                }
                else {
                    await this.prisma.friendship.update({
                        where: { id: existing.id },
                        data: { status: 'ACCEPTED' },
                    });
                    return { message: 'Friend request accepted automatically', status: 'ACCEPTED' };
                }
            }
            if (existing.status === 'BLOCKED') {
                throw new common_1.ForbiddenException('Cannot send friend request');
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
    async acceptFriendRequest(userId, senderId) {
        if (this.prisma.isFallbackMode) {
            const friendships = this.prisma.getMockFriendships();
            const index = friendships.findIndex((f) => f.senderId === senderId && f.receiverId === userId && f.status === 'PENDING');
            if (index === -1) {
                throw new common_1.NotFoundException('Friend request not found');
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
            throw new common_1.NotFoundException('Friend request not found');
        }
        await this.prisma.friendship.update({
            where: { id: friendship.id },
            data: { status: 'ACCEPTED' },
        });
        return { message: 'Friend request accepted successfully' };
    }
    async rejectFriendRequest(userId, friendId) {
        if (this.prisma.isFallbackMode) {
            const friendships = this.prisma.getMockFriendships();
            const index = friendships.findIndex((f) => ((f.senderId === userId && f.receiverId === friendId) ||
                (f.senderId === friendId && f.receiverId === userId)) &&
                f.status === 'PENDING');
            if (index === -1) {
                throw new common_1.NotFoundException('Friend request not found');
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
            throw new common_1.NotFoundException('Friend request not found');
        }
        await this.prisma.friendship.delete({
            where: { id: friendship.id },
        });
        return { message: 'Friend request rejected/cancelled successfully' };
    }
    async blockUser(userId, friendId) {
        if (this.prisma.isFallbackMode) {
            const friendships = this.prisma.getMockFriendships();
            const index = friendships.findIndex((f) => (f.senderId === userId && f.receiverId === friendId) ||
                (f.senderId === friendId && f.receiverId === userId));
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
            }
            else {
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
                    senderId: userId,
                    receiverId: friendId,
                },
            });
        }
        else {
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
    async unblockUser(userId, friendId) {
        if (this.prisma.isFallbackMode) {
            const friendships = this.prisma.getMockFriendships();
            const index = friendships.findIndex((f) => (f.senderId === userId && f.receiverId === friendId && f.status === 'BLOCKED') ||
                (f.senderId === friendId && f.receiverId === userId && f.status === 'BLOCKED'));
            if (index === -1) {
                throw new common_1.NotFoundException('Friendship record not found');
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
            throw new common_1.NotFoundException('Friendship record not found');
        }
        await this.prisma.friendship.delete({
            where: { id: friendship.id },
        });
        return { message: 'User unblocked successfully' };
    }
    async listFriends(userId) {
        if (this.prisma.isFallbackMode) {
            const friendships = this.prisma.getMockFriendships();
            const accepted = friendships.filter((f) => (f.senderId === userId || f.receiverId === userId) && f.status === 'ACCEPTED');
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
    async listPendingRequests(userId) {
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
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FriendsService);
//# sourceMappingURL=friends.service.js.map