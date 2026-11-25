import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private config;
    private prisma?;
    private readonly logger;
    private client?;
    private isFallbackMode;
    private localCache;
    constructor(config: ConfigService, prisma?: PrismaService | undefined);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    private setFallback;
    private getFallback;
    private delFallback;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
}
