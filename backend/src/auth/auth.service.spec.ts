import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/interfaces/email-service.interface';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let redisStore: Map<string, string>;
  let redisMock: any;
  let emailMock: any;

  beforeEach(async () => {
    redisStore = new Map<string, string>();
    prismaMock = {
      isFallbackMode: false,
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
      session: {
        create: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    redisMock = {
      set: jest.fn((key: string, val: string) => {
        redisStore.set(key, val);
        return Promise.resolve();
      }),
      get: jest.fn((key: string) => Promise.resolve(redisStore.get(key) ?? null)),
      del: jest.fn((key: string) => {
        redisStore.delete(key);
        return Promise.resolve();
      }),
    };
    emailMock = {
      sendOtpMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
        { provide: EmailService, useValue: emailMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects invalid email formats and domain typos in checkEmailForRegistration', async () => {
    const badFormat = await service.checkEmailForRegistration('not-an-email');
    expect(badFormat.valid).toBe(false);
    expect(badFormat.reason).toBe('invalid_email');

    const typoEmail = await service.checkEmailForRegistration('alice@gmial.com');
    expect(typoEmail.valid).toBe(false);
    expect(typoEmail.message).toContain('gmail.com');
  });

  it('flags already registered emails in checkEmailForRegistration and requestOtp(register)', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'alice@gmail.com',
      username: 'alice',
    });

    const checkRes = await service.checkEmailForRegistration('Alice@Gmail.com');
    expect(checkRes.valid).toBe(true);
    expect(checkRes.available).toBe(false);
    expect(checkRes.reason).toBe('already_registered');

    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'alice@gmail.com',
      username: 'alice',
    });

    await expect(service.requestOtp('alice@gmail.com', 'register')).rejects.toThrow(
      ConflictException,
    );
  });

  it('requires email OTP verification before registration', async () => {
    await expect(
      service.register({
        firstName: 'Saurabh',
        lastName: 'Chakarvarti',
        age: 22,
        email: 'saurabh@gmail.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('registers user with firstName, lastName, age after OTP verification and auto-generates username', async () => {
    const hashedOtp = await argon2.hash('654321');
    redisStore.set(
      'otp:saurabh@gmail.com',
      JSON.stringify({
        hashedOtp,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
        attempts: 0,
        resends: 1,
        lastSentAt: new Date().toISOString(),
      }),
    );

    const verifyRes = await service.verifyOtp({
      email: 'saurabh@gmail.com',
      code: '654321',
      purpose: 'register',
    });
    expect(verifyRes.isNewUser).toBe(true);

    prismaMock.user.create.mockResolvedValueOnce({
      id: 'user-new',
      email: 'saurabh@gmail.com',
      username: 'saurabh_chakarvarti',
      firstName: 'Saurabh',
      lastName: 'Chakarvarti',
      age: 22,
      role: 'USER',
      profile: { displayName: 'Saurabh Chakarvarti' },
    });

    const regRes = await service.register({
      firstName: 'Saurabh',
      lastName: 'Chakarvarti',
      age: 22,
      email: 'Saurabh@Gmail.com',
      password: 'Password123!',
    });

    expect(regRes.user.firstName).toBe('Saurabh');
    expect(regRes.user.lastName).toBe('Chakarvarti');
    expect(regRes.user.age).toBe(22);
    expect(regRes.user.displayName).toBe('Saurabh Chakarvarti');
    expect(regRes.accessToken).toBe('mock-jwt-token');
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'saurabh@gmail.com',
          firstName: 'Saurabh',
          lastName: 'Chakarvarti',
          age: 22,
          isVerified: true,
        }),
      }),
    );
  });
});
