import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;
  private isFallbackMode = false;
  private localCache = new Map<string, { value: string; expiresAt: number }>();

  constructor(
    private config: ConfigService,
    @Optional() private prisma?: PrismaService,
  ) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL')?.trim();

    if (!redisUrl || (process.env.VERCEL && redisUrl.includes('localhost'))) {
      this.logger.warn('No external REDIS_URL configured. Using PostgreSQL/in-memory cache fallback.');
      this.isFallbackMode = true;
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => {
        this.logger.log('Successfully connected to Redis server.');
        this.isFallbackMode = false;
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis connection failed: ${err.message}. Enabling cache fallback.`);
        this.isFallbackMode = true;
      });
    } catch (err: any) {
      this.logger.warn(`Failed to instantiate Redis client: ${err.message}. Enabling cache fallback.`);
      this.isFallbackMode = true;
    }
  }

  async onModuleDestroy() {
    if (this.client && !this.isFallbackMode) {
      await this.client.quit();
    }
  }

  private async setFallback(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.prisma && !this.prisma.isFallbackMode) {
      try {
        const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
        await this.prisma.$executeRawUnsafe(
          'INSERT INTO "AppCache" ("key", "value", "expiresAt") VALUES ($1, $2, $3) ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "expiresAt" = EXCLUDED."expiresAt"',
          key,
          value,
          expiresAt,
        );
        return;
      } catch (err: any) {
        this.logger.warn(`PostgreSQL cache fallback write failed: ${err.message}`);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.localCache.set(key, { value, expiresAt });
  }

  private async getFallback(key: string): Promise<string | null> {
    if (this.prisma && !this.prisma.isFallbackMode) {
      try {
        const rows = await this.prisma.$queryRawUnsafe<Array<{ value: string; expiresAt: Date | null }>>(
          'SELECT "value", "expiresAt" FROM "AppCache" WHERE "key" = $1 LIMIT 1',
          key,
        );
        const row = rows?.[0];
        if (!row) return null;
        if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
          await this.delFallback(key);
          return null;
        }
        return row.value;
      } catch (err: any) {
        this.logger.warn(`PostgreSQL cache fallback read failed: ${err.message}`);
      }
    }

    const cacheVal = this.localCache.get(key);
    if (!cacheVal) return null;

    if (cacheVal.expiresAt < Date.now()) {
      this.localCache.delete(key);
      return null;
    }
    return cacheVal.value;
  }

  private async delFallback(key: string): Promise<void> {
    if (this.prisma && !this.prisma.isFallbackMode) {
      try {
        await this.prisma.$executeRawUnsafe('DELETE FROM "AppCache" WHERE "key" = $1', key);
      } catch (err: any) {
        this.logger.warn(`PostgreSQL cache fallback delete failed: ${err.message}`);
      }
    }
    this.localCache.delete(key);
  }

  /**
   * Set a key with optional TTL (time to live in seconds).
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isFallbackMode || !this.client) {
      await this.setFallback(key, value, ttlSeconds);
      return;
    }

    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.error(`Redis set operation failed: ${err.message}. Saving to fallback cache.`);
      await this.setFallback(key, value, ttlSeconds);
    }
  }

  /**
   * Get a key's value. Returns null if expired or missing.
   */
  async get(key: string): Promise<string | null> {
    if (this.isFallbackMode || !this.client) {
      return this.getFallback(key);
    }

    try {
      return await this.client.get(key);
    } catch (err: any) {
      this.logger.error(`Redis get operation failed: ${err.message}. Reading from fallback cache.`);
      return this.getFallback(key);
    }
  }

  /**
   * Delete a key.
   */
  async del(key: string): Promise<void> {
    if (this.isFallbackMode || !this.client) {
      await this.delFallback(key);
      return;
    }

    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.error(`Redis delete operation failed: ${err.message}`);
      await this.delFallback(key);
    }
  }
}
