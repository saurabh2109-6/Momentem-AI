import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private isFallbackMode = false;
  private localCache = new Map<string, { value: string; expiresAt: number }>();

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        retryStrategy(times) {
          if (times > 3) return null; // stop reconnecting
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => {
        this.logger.log('Successfully connected to Upstash Redis server.');
        this.isFallbackMode = false;
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Upstash Redis connection failed: ${err.message}. Enabling local in-memory fallback.`);
        this.isFallbackMode = true;
      });
    } catch (err: any) {
      this.logger.warn(`Failed to instantiate Redis client: ${err.message}. Enabling local in-memory fallback.`);
      this.isFallbackMode = true;
    }
  }

  async onModuleDestroy() {
    if (this.client && !this.isFallbackMode) {
      await this.client.quit();
    }
  }

  /**
   * Set a key with optional TTL (time to live in seconds).
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isFallbackMode) {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
      this.localCache.set(key, { value, expiresAt });
      return;
    }

    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.error(`Redis set operation failed: ${err.message}. Saving to local fallback cache.`);
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
      this.localCache.set(key, { value, expiresAt });
    }
  }

  /**
   * Get a key's value. Returns null if expired or missing.
   */
  async get(key: string): Promise<string | null> {
    if (this.isFallbackMode) {
      const cacheVal = this.localCache.get(key);
      if (!cacheVal) return null;

      if (cacheVal.expiresAt < Date.now()) {
        this.localCache.delete(key);
        return null;
      }
      return cacheVal.value;
    }

    try {
      return await this.client.get(key);
    } catch (err: any) {
      this.logger.error(`Redis get operation failed: ${err.message}. Reading from local fallback cache.`);
      const cacheVal = this.localCache.get(key);
      if (!cacheVal) return null;

      if (cacheVal.expiresAt < Date.now()) {
        this.localCache.delete(key);
        return null;
      }
      return cacheVal.value;
    }
  }

  /**
   * Delete a key.
   */
  async del(key: string): Promise<void> {
    if (this.isFallbackMode) {
      this.localCache.delete(key);
      return;
    }

    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.error(`Redis delete operation failed: ${err.message}`);
      this.localCache.delete(key);
    }
  }
}
