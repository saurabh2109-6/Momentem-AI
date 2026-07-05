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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const email_service_interface_1 = require("../email/interfaces/email-service.interface");
const argon2 = __importStar(require("argon2"));
const crypto = __importStar(require("crypto"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    redis;
    jwtService;
    emailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, redis, jwtService, emailService) {
        this.prisma = prisma;
        this.redis = redis;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async register(dto) {
        if (this.prisma.isFallbackMode) {
            const users = this.prisma.getMockUsers();
            if (users.some((u) => u.email === dto.email)) {
                throw new common_1.ConflictException('Email is already registered');
            }
            if (users.some((u) => u.username === dto.username)) {
                throw new common_1.ConflictException('Username is already registered');
            }
            const passwordHash = await argon2.hash(dto.password);
            const mockUser = {
                id: crypto.randomUUID(),
                email: dto.email,
                username: dto.username,
                passwordHash,
                role: 'USER',
                isVerified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            users.push(mockUser);
            this.prisma.saveMockUsers(users);
            const profiles = this.prisma.getMockProfiles();
            profiles.push({
                id: crypto.randomUUID(),
                userId: mockUser.id,
                displayName: mockUser.username,
                friendCode: `MOMENTUM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
                timezone: 'UTC',
                bio: '',
                avatarUrl: '',
                country: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            this.prisma.saveMockProfiles(profiles);
            const tokens = await this.generateTokens(mockUser.id, mockUser.email);
            await this.storeSession(mockUser.id, tokens.refreshToken);
            await this.logEvent(mockUser.id, 'USER_REGISTRATION', `User registered successfully (Mock fallback)`);
            return {
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    username: mockUser.username,
                    role: mockUser.role,
                },
                ...tokens,
            };
        }
        const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingEmail) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const existingUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (existingUsername) {
            throw new common_1.ConflictException('Username is already registered');
        }
        const passwordHash = await argon2.hash(dto.password);
        const friendCode = `MOMENTUM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                passwordHash,
                isVerified: true,
                profile: {
                    create: {
                        displayName: dto.username,
                        friendCode,
                        timezone: 'UTC',
                    },
                },
            },
        });
        const tokens = await this.generateTokens(user.id, user.email);
        await this.storeSession(user.id, tokens.refreshToken);
        await this.logEvent(user.id, 'USER_REGISTRATION', `User registered successfully with username ${dto.username}`);
        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            },
            ...tokens,
        };
    }
    async login(dto) {
        if (this.prisma.isFallbackMode) {
            const users = this.prisma.getMockUsers();
            const user = users.find((u) => u.email === dto.identifier || u.username === dto.identifier);
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const tokens = await this.generateTokens(user.id, user.email);
            await this.storeSession(user.id, tokens.refreshToken);
            await this.logEvent(user.id, 'USER_LOGIN', 'User logged in successfully (Mock fallback)');
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                },
                ...tokens,
            };
        }
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.identifier },
                    { username: dto.identifier }
                ],
            },
        });
        if (!user || user.deletedAt) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.generateTokens(user.id, user.email);
        await this.storeSession(user.id, tokens.refreshToken);
        await this.logEvent(user.id, 'USER_LOGIN', 'User logged in successfully via password authentication.');
        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            },
            ...tokens,
        };
    }
    async requestOtp(email) {
        const redisKey = `otp:${email}`;
        const rawState = await this.redis.get(redisKey);
        const now = Date.now();
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        let state;
        if (rawState) {
            state = JSON.parse(rawState);
            const timeElapsed = now - new Date(state.lastSentAt).getTime();
            if (timeElapsed < 60000) {
                throw new common_1.BadRequestException(`Cooldown active. Please wait ${Math.ceil((60000 - timeElapsed) / 1000)} seconds.`);
            }
            if (state.resends >= 3) {
                throw new common_1.BadRequestException('Maximum resend attempts reached (3). Please try again in 5 minutes.');
            }
            state.hashedOtp = await argon2.hash(otpCode);
            state.expiresAt = new Date(now + 5 * 60 * 1000).toISOString();
            state.attempts = 0;
            state.resends += 1;
            state.lastSentAt = new Date(now).toISOString();
        }
        else {
            const hashedOtp = await argon2.hash(otpCode);
            state = {
                hashedOtp,
                expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
                attempts: 0,
                resends: 1,
                lastSentAt: new Date(now).toISOString(),
            };
        }
        await this.redis.set(redisKey, JSON.stringify(state), 300);
        this.logger.log(`[OTP Verification] Generated code for ${email}: ${otpCode}`);
        try {
            await this.emailService.sendOtpMail(email, otpCode);
        }
        catch (error) {
            this.logger.warn(`Failed to dispatch SMTP email to ${email}: ${error.message}. OTP code is logged above in logs.`);
        }
        return { message: 'Verification OTP code sent successfully' };
    }
    async verifyOtp(dto) {
        const redisKey = `otp:${dto.email}`;
        const rawState = await this.redis.get(redisKey);
        if (!rawState) {
            throw new common_1.BadRequestException('OTP code has expired or is invalid');
        }
        const state = JSON.parse(rawState);
        if (new Date(state.expiresAt).getTime() < Date.now()) {
            await this.redis.del(redisKey);
            throw new common_1.BadRequestException('OTP code has expired');
        }
        if (state.attempts >= 5) {
            await this.redis.del(redisKey);
            throw new common_1.BadRequestException('Too many verification attempts. OTP invalidated.');
        }
        const isCodeValid = await argon2.verify(state.hashedOtp, dto.code);
        if (!isCodeValid) {
            state.attempts += 1;
            await this.redis.set(redisKey, JSON.stringify(state), 300);
            throw new common_1.BadRequestException('Incorrect OTP code');
        }
        await this.redis.del(redisKey);
        let user;
        if (this.prisma.isFallbackMode) {
            const users = this.prisma.getMockUsers();
            user = users.find((u) => u.email === dto.email);
        }
        else {
            user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        }
        if (!user) {
            return {
                message: 'OTP verified successfully. Proceed to register.',
                email: dto.email,
                isNewUser: true,
            };
        }
        const tokens = await this.generateTokens(user.id, user.email);
        await this.storeSession(user.id, tokens.refreshToken);
        await this.logEvent(user.id, 'USER_LOGIN_OTP', 'User logged in successfully via passwordless OTP.');
        return {
            isNewUser: false,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            },
            ...tokens,
        };
    }
    async refreshSession(refreshToken) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'momentum-secure-refresh-token-secret-key-67890',
            });
            const tokenHash = this.hashToken(refreshToken);
            let session;
            let user;
            if (this.prisma.isFallbackMode) {
                const sessions = this.prisma.getMockSessions();
                session = sessions.find((s) => s.tokenHash === tokenHash);
                if (!session) {
                    throw new common_1.UnauthorizedException('Session not found');
                }
                if (new Date(session.expiresAt).getTime() < Date.now()) {
                    this.prisma.saveMockSessions(sessions.filter((s) => s.tokenHash !== tokenHash));
                    throw new common_1.UnauthorizedException('Session has expired');
                }
                const users = this.prisma.getMockUsers();
                user = users.find((u) => u.id === session.userId);
                if (!user) {
                    throw new common_1.UnauthorizedException('User not found');
                }
                this.prisma.saveMockSessions(sessions.filter((s) => s.tokenHash !== tokenHash));
            }
            else {
                session = await this.prisma.session.findUnique({ where: { tokenHash } });
                if (!session) {
                    throw new common_1.UnauthorizedException('Session not found');
                }
                if (new Date(session.expiresAt).getTime() < Date.now()) {
                    await this.prisma.session.delete({ where: { tokenHash } });
                    throw new common_1.UnauthorizedException('Session has expired');
                }
                user = await this.prisma.user.findUnique({ where: { id: session.userId } });
                if (!user || user.deletedAt) {
                    throw new common_1.UnauthorizedException('User not found or deactivated');
                }
                await this.prisma.session.delete({ where: { tokenHash } });
            }
            const tokens = await this.generateTokens(user.id, user.email);
            await this.storeSession(user.id, tokens.refreshToken);
            return tokens;
        }
        catch (e) {
            throw new common_1.UnauthorizedException(e.message || 'Invalid or expired refresh token');
        }
    }
    async logout(refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        if (this.prisma.isFallbackMode) {
            const sessions = this.prisma.getMockSessions();
            this.prisma.saveMockSessions(sessions.filter((s) => s.tokenHash !== tokenHash));
        }
        else {
            try {
                await this.prisma.session.delete({ where: { tokenHash } });
            }
            catch {
            }
        }
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    async storeSession(userId, refreshToken, ipAddress, deviceInfo) {
        const tokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (this.prisma.isFallbackMode) {
            const sessions = this.prisma.getMockSessions();
            sessions.push({
                id: crypto.randomUUID(),
                userId,
                tokenHash,
                ipAddress: ipAddress || null,
                deviceInfo: deviceInfo || null,
                expiresAt: expiresAt.toISOString(),
                createdAt: new Date().toISOString(),
            });
            this.prisma.saveMockSessions(sessions);
            return;
        }
        await this.prisma.session.create({
            data: {
                userId,
                tokenHash,
                ipAddress: ipAddress || null,
                deviceInfo: deviceInfo || null,
                expiresAt,
            },
        });
    }
    async generateTokens(userId, email) {
        const payload = { sub: userId, email };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_SECRET || 'momentum-secure-access-token-secret-key-12345',
                expiresIn: (process.env.JWT_EXPIRES_IN || '15m'),
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET || 'momentum-secure-refresh-token-secret-key-67890',
                expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async logEvent(userId, action, details) {
        if (this.prisma.isFallbackMode) {
            const logs = this.prisma.getMockAuditLogs();
            logs.push({
                id: crypto.randomUUID(),
                userId,
                action,
                details,
                timestamp: new Date().toISOString(),
            });
            this.prisma.saveMockAuditLogs(logs);
            return;
        }
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    details,
                },
            });
        }
        catch (err) {
            this.logger.error(`Failed to write audit log: ${err.message}`);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        jwt_1.JwtService,
        email_service_interface_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map