import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/interfaces/email-service.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/otp.dto';
export declare class AuthService {
    private prisma;
    private redis;
    private jwtService;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, jwtService: JwtService, emailService: EmailService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            email: string;
            username: string;
            role: string;
        };
    } | {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            username: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: any;
            username: any;
            role: any;
        };
    }>;
    requestOtp(email: string): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        message: string;
        email: string;
        isNewUser: boolean;
    } | {
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user: {
            id: any;
            email: any;
            username: any;
            role: any;
        };
        message?: undefined;
        email?: undefined;
    }>;
    refreshSession(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    private hashToken;
    storeSession(userId: string, refreshToken: string, ipAddress?: string, deviceInfo?: string): Promise<void>;
    generateTokens(userId: string, email: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private logEvent;
}
