import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private setRefreshTokenCookie;
    private clearRefreshTokenCookie;
    register(dto: RegisterDto, res: Response): Promise<{
        user: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            email: string;
            username: string;
            role: string;
        } | {
            id: string;
            email: string;
            username: string;
            role: import("@prisma/client").$Enums.Role;
        };
        accessToken: string;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        user: {
            id: any;
            email: any;
            username: any;
            role: any;
        };
        accessToken: string;
    }>;
    refresh(req: Request, res: Response, bodyToken?: string): Promise<{
        accessToken: string;
    }>;
    logout(req: Request, res: Response, bodyToken?: string): Promise<{
        message: string;
    }>;
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto, res: Response): Promise<{
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
    } | {
        isNewUser: boolean;
        user: {
            id: string;
            email: string;
            username: string;
            role: string;
        };
        accessToken: string;
    }>;
    getMe(user: any): any;
}
