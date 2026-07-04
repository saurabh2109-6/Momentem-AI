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
exports.FirebaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
let FirebaseAuthGuard = class FirebaseAuthGuard {
    jwtService;
    prisma;
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Authorization token is missing or invalid');
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'momentum-secure-access-token-secret-key-12345',
            });
            let user;
            if (this.prisma.isFallbackMode) {
                const users = this.prisma.getMockUsers();
                user = users.find((u) => u.id === decoded.sub);
            }
            else {
                user = await this.prisma.user.findUnique({
                    where: { id: decoded.sub },
                    include: { profile: true },
                });
            }
            if (!user || user.deletedAt) {
                throw new common_1.UnauthorizedException('User account has been deactivated or not found');
            }
            request.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                displayName: user.profile?.displayName || user.username,
                timezone: user.profile?.timezone || 'UTC',
            };
            return true;
        }
        catch (e) {
            throw new common_1.UnauthorizedException(`Unauthorized: ${e.message}`);
        }
    }
};
exports.FirebaseAuthGuard = FirebaseAuthGuard;
exports.FirebaseAuthGuard = FirebaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], FirebaseAuthGuard);
//# sourceMappingURL=firebase-auth.guard.js.map