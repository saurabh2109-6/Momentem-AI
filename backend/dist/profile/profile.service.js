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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProfileService = class ProfileService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        if (this.prisma.isFallbackMode) {
            const profiles = this.prisma.getMockProfiles();
            const profile = profiles.find((p) => p.userId === userId);
            if (!profile) {
                throw new common_1.NotFoundException('Profile not found');
            }
            return profile;
        }
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return profile;
    }
    async updateProfile(userId, dto) {
        if (this.prisma.isFallbackMode) {
            const profiles = this.prisma.getMockProfiles();
            const index = profiles.findIndex((p) => p.userId === userId);
            if (index === -1) {
                throw new common_1.NotFoundException('Profile not found');
            }
            profiles[index] = {
                ...profiles[index],
                ...dto,
                updatedAt: new Date().toISOString(),
            };
            this.prisma.saveMockProfiles(profiles);
            return profiles[index];
        }
        const profile = await this.prisma.profile.update({
            where: { userId },
            data: {
                ...dto,
            },
        });
        return profile;
    }
    async getProfileByFriendCode(friendCode) {
        const codeUpper = friendCode.toUpperCase();
        if (this.prisma.isFallbackMode) {
            const profiles = this.prisma.getMockProfiles();
            const profile = profiles.find((p) => p.friendCode === codeUpper);
            if (!profile) {
                throw new common_1.NotFoundException('No profile found with that friend code');
            }
            const users = this.prisma.getMockUsers();
            const user = users.find((u) => u.id === profile.userId) || {};
            return {
                ...profile,
                username: user.username || '',
            };
        }
        const profile = await this.prisma.profile.findUnique({
            where: { friendCode: codeUpper },
            include: {
                user: {
                    select: {
                        username: true,
                    },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('No profile found with that friend code');
        }
        return {
            ...profile,
            username: profile.user?.username || '',
        };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map