import { Injectable, ConflictException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/interfaces/email-service.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/otp.dto';
import { validateEmailWithDomain } from './email-validation.util';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private formatUserResponse(user: any, profileDisplayName?: string) {
    const derivedName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      age: user.age ?? null,
      displayName: profileDisplayName || user.profile?.displayName || derivedName || user.username,
      role: user.role,
    };
  }

  private async findUserByEmail(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    if (this.prisma.isFallbackMode) {
      const users = this.prisma.getMockUsers();
      return users.find((u) => u.email?.toLowerCase() === email) ?? null;
    }

    return this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
      },
      include: { profile: true },
    });
  }

  private async isUsernameTaken(username: string): Promise<boolean> {
    const lower = username.toLowerCase();
    if (this.prisma.isFallbackMode) {
      return this.prisma.getMockUsers().some((u) => u.username?.toLowerCase() === lower);
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
      },
      select: { id: true },
    });
    return Boolean(existing);
  }

  private async generateUniqueUsername(firstName: string, lastName: string): Promise<string> {
    let base = `${firstName}_${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 20);

    if (base.length < 3) {
      base = `user_${base || 'member'}`;
    }

    if (!(await this.isUsernameTaken(base))) {
      return base;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `${base}_${crypto.randomBytes(2).toString('hex')}`;
      if (!(await this.isUsernameTaken(candidate))) {
        return candidate;
      }
    }

    return `${base}_${Date.now().toString(36)}`;
  }

  private async verifyOtpCodeInternal(email: string, code: string): Promise<void> {
    const redisKey = `otp:${email}`;
    const rawState = await this.redis.get(redisKey);

    if (!rawState) {
      throw new BadRequestException('OTP code has expired or was not requested');
    }

    const state = JSON.parse(rawState);

    if (new Date(state.expiresAt).getTime() < Date.now()) {
      await this.redis.del(redisKey);
      throw new BadRequestException('OTP code has expired');
    }

    if (state.attempts >= 5) {
      await this.redis.del(redisKey);
      throw new BadRequestException('Too many verification attempts. OTP invalidated.');
    }

    const isCodeValid = await argon2.verify(state.hashedOtp, code);
    if (!isCodeValid) {
      state.attempts += 1;
      await this.redis.set(redisKey, JSON.stringify(state), 300);
      throw new BadRequestException('Incorrect OTP code');
    }

    await this.redis.del(redisKey);
  }

  /**
   * Validates email syntax/domain and checks whether it is already registered.
   */
  async checkEmailForRegistration(rawEmail: string) {
    const validation = await validateEmailWithDomain(rawEmail);
    if (!validation.valid) {
      return {
        valid: false,
        available: false,
        reason: 'invalid_email',
        message: validation.message || 'Invalid email address',
      };
    }

    const existingUser = await this.findUserByEmail(validation.normalizedEmail);
    if (existingUser) {
      return {
        valid: true,
        available: false,
        reason: 'already_registered',
        message: 'This email is already registered. Please sign in instead.',
      };
    }

    return {
      valid: true,
      available: true,
      email: validation.normalizedEmail,
      message: 'Email is valid and available.',
    };
  }

  /**
   * Registers a new user in PostgreSQL (or local mock fallback) after email validation & OTP verification.
   */
  async register(dto: RegisterDto) {
    const validation = await validateEmailWithDomain(dto.email);
    if (!validation.valid) {
      throw new BadRequestException(validation.message || 'Invalid email address');
    }

    const email = validation.normalizedEmail;
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const displayName = `${firstName} ${lastName}`.trim();

    const existingEmail = await this.findUserByEmail(email);
    if (existingEmail) {
      throw new ConflictException('This email is already registered. Please sign in instead.');
    }

    // Require verified email OTP before completing registration
    const verifiedKey = `otp_verified:${email}`;
    const verifiedMarker = await this.redis.get(verifiedKey);
    if (verifiedMarker) {
      await this.redis.del(verifiedKey);
    } else if (dto.otpCode) {
      await this.verifyOtpCodeInternal(email, dto.otpCode);
    } else {
      throw new BadRequestException(
        'Please verify your email address with the OTP code before creating your account.',
      );
    }

    let username = dto.username?.trim();
    if (username) {
      if (await this.isUsernameTaken(username)) {
        throw new ConflictException('Username is already registered');
      }
    } else {
      username = await this.generateUniqueUsername(firstName, lastName);
    }

    const passwordHash = await argon2.hash(dto.password);
    const friendCode = `MOMENTUM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    if (this.prisma.isFallbackMode) {
      const users = this.prisma.getMockUsers();
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        username,
        firstName,
        lastName,
        age: dto.age,
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
        displayName,
        friendCode,
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
        user: this.formatUserResponse(mockUser, displayName),
        ...tokens,
      };
    }

    // Create user and profile transactionally
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        age: dto.age,
        passwordHash,
        isVerified: true,
        profile: {
          create: {
            displayName,
            friendCode,
            timezone: 'UTC',
          },
        },
      },
      include: { profile: true },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeSession(user.id, tokens.refreshToken);

    // Audit log
    await this.logEvent(user.id, 'USER_REGISTRATION', `User registered successfully with username ${username}`);

    return {
      user: this.formatUserResponse(user, displayName),
      ...tokens,
    };
  }

  /**
   * Classic password login (Identifier can be email or username).
   */
  async login(dto: LoginDto) {
    const rawIdentifier = dto.identifier.trim();
    const normalizedIdentifier = rawIdentifier.toLowerCase();

    if (this.prisma.isFallbackMode) {
      const users = this.prisma.getMockUsers();
      const user = users.find(
        (u) =>
          !u.deletedAt &&
          (u.email?.toLowerCase() === normalizedIdentifier ||
            u.username?.toLowerCase() === normalizedIdentifier),
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const profiles = this.prisma.getMockProfiles();
      const profile = profiles.find((p) => p.userId === user.id);

      const tokens = await this.generateTokens(user.id, user.email);
      await this.storeSession(user.id, tokens.refreshToken);
      await this.logEvent(user.id, 'USER_LOGIN', 'User logged in successfully (Mock fallback)');

      return {
        user: this.formatUserResponse(user, profile?.displayName),
        ...tokens,
      };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
          { username: { equals: rawIdentifier, mode: 'insensitive' } },
        ],
      },
      include: { profile: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeSession(user.id, tokens.refreshToken);

    // Audit log
    await this.logEvent(user.id, 'USER_LOGIN', 'User logged in successfully via password authentication.');

    return {
      user: this.formatUserResponse(user),
      ...tokens,
    };
  }

  /**
   * Generates and dispatches an OTP verification code, saving states inside Upstash Redis.
   */
  async requestOtp(rawEmail: string, purpose: 'login' | 'register' = 'login') {
    const validation = await validateEmailWithDomain(rawEmail);
    if (!validation.valid) {
      throw new BadRequestException(validation.message || 'Invalid email address');
    }

    const email = validation.normalizedEmail;

    if (purpose === 'register') {
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new ConflictException('This email is already registered. Please sign in instead.');
      }
    }

    const redisKey = `otp:${email}`;
    const rawState = await this.redis.get(redisKey);
    const now = Date.now();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

    let state: any;

    if (rawState) {
      state = JSON.parse(rawState);

      // Enforce 60-second cooldown
      const timeElapsed = now - new Date(state.lastSentAt).getTime();
      if (timeElapsed < 60000) {
        throw new BadRequestException(`Cooldown active. Please wait ${Math.ceil((60000 - timeElapsed) / 1000)} seconds.`);
      }

      // Enforce maximum 3 resends per 5-minute block
      if (state.resends >= 3) {
        throw new BadRequestException('Maximum resend attempts reached (3). Please try again in 5 minutes.');
      }

      state.hashedOtp = await argon2.hash(otpCode);
      state.expiresAt = new Date(now + 5 * 60 * 1000).toISOString();
      state.attempts = 0; // Reset attempts for new code
      state.resends += 1;
      state.lastSentAt = new Date(now).toISOString();
    } else {
      const hashedOtp = await argon2.hash(otpCode);
      state = {
        hashedOtp,
        expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
        attempts: 0,
        resends: 1,
        lastSentAt: new Date(now).toISOString(),
      };
    }

    // Save state in Upstash Redis with 5 minutes (300 seconds) expiration
    await this.redis.set(redisKey, JSON.stringify(state), 300);

    this.logger.log(`[OTP Verification] Generated code for ${email}: ${otpCode}`);

    // Dispatch real email or console fallback
    try {
      await this.emailService.sendOtpMail(email, otpCode);
    } catch (error: any) {
      this.logger.warn(`Failed to dispatch SMTP email to ${email}: ${error.message}. OTP code is logged above in logs.`);
    }

    return { message: 'Verification OTP code sent successfully', email };
  }

  /**
   * Verifies the OTP code.
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    await this.verifyOtpCodeInternal(email, dto.code);

    const user = await this.findUserByEmail(email);

    if (dto.purpose === 'register' && user) {
      throw new ConflictException('This email is already registered. Please sign in instead.');
    }

    if (!user) {
      // Allow 15 minutes to complete registration with verified email
      await this.redis.set(
        `otp_verified:${email}`,
        JSON.stringify({ verifiedAt: new Date().toISOString() }),
        900,
      );
      return {
        message: 'Email OTP verified successfully.',
        email,
        isNewUser: true,
        verified: true,
      };
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    let profileDisplayName: string | undefined;
    if (this.prisma.isFallbackMode) {
      const profile = this.prisma.getMockProfiles().find((p) => p.userId === user.id);
      profileDisplayName = profile?.displayName;
    }

    // Log in user (Passwordless OTP Login)
    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeSession(user.id, tokens.refreshToken);

    // Audit log
    await this.logEvent(user.id, 'USER_LOGIN_OTP', 'User logged in successfully via passwordless OTP.');

    return {
      isNewUser: false,
      user: this.formatUserResponse(user, profileDisplayName),
      ...tokens,
    };
  }

  /**
   * Refreshes access tokens using refresh token rotation.
   */
  async refreshSession(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'momentum-secure-refresh-token-secret-key-67890',
      });

      const tokenHash = this.hashToken(refreshToken);
      let session: any;
      let user: any;

      if (this.prisma.isFallbackMode) {
        const sessions = this.prisma.getMockSessions();
        session = sessions.find((s) => s.tokenHash === tokenHash);
        if (!session) {
          throw new UnauthorizedException('Session not found');
        }
        if (new Date(session.expiresAt).getTime() < Date.now()) {
          this.prisma.saveMockSessions(sessions.filter((s) => s.tokenHash !== tokenHash));
          throw new UnauthorizedException('Session has expired');
        }

        const users = this.prisma.getMockUsers();
        user = users.find((u) => u.id === session.userId);
        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        // Token rotation: delete old session
        this.prisma.saveMockSessions(sessions.filter((s) => s.tokenHash !== tokenHash));
      } else {
        session = await this.prisma.session.findUnique({ where: { tokenHash } });
        if (!session) {
          throw new UnauthorizedException('Session not found');
        }
        if (new Date(session.expiresAt).getTime() < Date.now()) {
          await this.prisma.session.delete({ where: { tokenHash } });
          throw new UnauthorizedException('Session has expired');
        }

        user = await this.prisma.user.findUnique({ where: { id: session.userId } });
        if (!user || user.deletedAt) {
          throw new UnauthorizedException('User not found or deactivated');
        }

        // Token rotation: delete old session
        await this.prisma.session.delete({ where: { tokenHash } });
      }

      const tokens = await this.generateTokens(user.id, user.email);
      await this.storeSession(user.id, tokens.refreshToken);

      return tokens;
    } catch (e: any) {
      throw new UnauthorizedException(e.message || 'Invalid or expired refresh token');
    }
  }

  /**
   * Logs out user by deleting their session.
   */
  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    if (this.prisma.isFallbackMode) {
      const sessions = this.prisma.getMockSessions();
      this.prisma.saveMockSessions(sessions.filter((s) => s.tokenHash !== tokenHash));
    } else {
      try {
        await this.prisma.session.delete({ where: { tokenHash } });
      } catch {
        // ignore
      }
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async storeSession(userId: string, refreshToken: string, ipAddress?: string, deviceInfo?: string) {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'momentum-secure-access-token-secret-key-12345',
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'momentum-secure-refresh-token-secret-key-67890',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async logEvent(userId: string | null, action: string, details: string) {
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
    } catch (err: any) {
      this.logger.error(`Failed to write audit log: ${err.message}`);
    }
  }
}
