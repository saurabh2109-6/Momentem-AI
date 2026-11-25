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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("../prisma/prisma.service");
let RedisService = RedisService_1 = class RedisService {
    config;
    prisma;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    isFallbackMode = false;
    localCache = new Map();
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
    }
    onModuleInit() {
        const redisUrl = this.config.get('REDIS_URL')?.trim();
        if (!redisUrl || (process.env.VERCEL && redisUrl.includes('localhost'))) {
            this.logger.warn('No external REDIS_URL configured. Using PostgreSQL/in-memory cache fallback.');
            this.isFallbackMode = true;
            return;
        }
        try {
            this.client = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 1,
                connectTimeout: 5000,
                retryStrategy(times) {
                    if (times > 3)
                        return null;
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
        }
        catch (err) {
            this.logger.warn(`Failed to instantiate Redis client: ${err.message}. Enabling cache fallback.`);
            this.isFallbackMode = true;
        }
    }
    async onModuleDestroy() {
        if (this.client && !this.isFallbackMode) {
            await this.client.quit();
        }
    }
    async setFallback(key, value, ttlSeconds) {
        if (this.prisma && !this.prisma.isFallbackMode) {
            try {
                const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
                await this.prisma.$executeRawUnsafe('INSERT INTO "AppCache" ("key", "value", "expiresAt") VALUES ($1, $2, $3) ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "expiresAt" = EXCLUDED."expiresAt"', key, value, expiresAt);
                return;
            }
            catch (err) {
                this.logger.warn(`PostgreSQL cache fallback write failed: ${err.message}`);
            }
        }
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
        this.localCache.set(key, { value, expiresAt });
    }
    async getFallback(key) {
        if (this.prisma && !this.prisma.isFallbackMode) {
            try {
                const rows = await this.prisma.$queryRawUnsafe('SELECT "value", "expiresAt" FROM "AppCache" WHERE "key" = $1 LIMIT 1', key);
                const row = rows?.[0];
                if (!row)
                    return null;
                if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
                    await this.delFallback(key);
                    return null;
                }
                return row.value;
            }
            catch (err) {
                this.logger.warn(`PostgreSQL cache fallback read failed: ${err.message}`);
            }
        }
        const cacheVal = this.localCache.get(key);
        if (!cacheVal)
            return null;
        if (cacheVal.expiresAt < Date.now()) {
            this.localCache.delete(key);
            return null;
        }
        return cacheVal.value;
    }
    async delFallback(key) {
        if (this.prisma && !this.prisma.isFallbackMode) {
            try {
                await this.prisma.$executeRawUnsafe('DELETE FROM "AppCache" WHERE "key" = $1', key);
            }
            catch (err) {
                this.logger.warn(`PostgreSQL cache fallback delete failed: ${err.message}`);
            }
        }
        this.localCache.delete(key);
    }
    async set(key, value, ttlSeconds) {
        if (this.isFallbackMode || !this.client) {
            await this.setFallback(key, value, ttlSeconds);
            return;
        }
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (err) {
            this.logger.error(`Redis set operation failed: ${err.message}. Saving to fallback cache.`);
            await this.setFallback(key, value, ttlSeconds);
        }
    }
    async get(key) {
        if (this.isFallbackMode || !this.client) {
            return this.getFallback(key);
        }
        try {
            return await this.client.get(key);
        }
        catch (err) {
            this.logger.error(`Redis get operation failed: ${err.message}. Reading from fallback cache.`);
            return this.getFallback(key);
        }
    }
    async del(key) {
        if (this.isFallbackMode || !this.client) {
            await this.delFallback(key);
            return;
        }
        try {
            await this.client.del(key);
        }
        catch (err) {
            this.logger.error(`Redis delete operation failed: ${err.message}`);
            await this.delFallback(key);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], RedisService);
//# sourceMappingURL=redis.service.js.map