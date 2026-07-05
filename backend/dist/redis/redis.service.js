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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    config;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    isFallbackMode = false;
    localCache = new Map();
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const redisUrl = this.config.get('REDIS_URL') || 'redis://localhost:6379';
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
                this.logger.log('Successfully connected to Upstash Redis server.');
                this.isFallbackMode = false;
            });
            this.client.on('error', (err) => {
                this.logger.warn(`Upstash Redis connection failed: ${err.message}. Enabling local in-memory fallback.`);
                this.isFallbackMode = true;
            });
        }
        catch (err) {
            this.logger.warn(`Failed to instantiate Redis client: ${err.message}. Enabling local in-memory fallback.`);
            this.isFallbackMode = true;
        }
    }
    async onModuleDestroy() {
        if (this.client && !this.isFallbackMode) {
            await this.client.quit();
        }
    }
    async set(key, value, ttlSeconds) {
        if (this.isFallbackMode) {
            const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
            this.localCache.set(key, { value, expiresAt });
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
            this.logger.error(`Redis set operation failed: ${err.message}. Saving to local fallback cache.`);
            const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
            this.localCache.set(key, { value, expiresAt });
        }
    }
    async get(key) {
        if (this.isFallbackMode) {
            const cacheVal = this.localCache.get(key);
            if (!cacheVal)
                return null;
            if (cacheVal.expiresAt < Date.now()) {
                this.localCache.delete(key);
                return null;
            }
            return cacheVal.value;
        }
        try {
            return await this.client.get(key);
        }
        catch (err) {
            this.logger.error(`Redis get operation failed: ${err.message}. Reading from local fallback cache.`);
            const cacheVal = this.localCache.get(key);
            if (!cacheVal)
                return null;
            if (cacheVal.expiresAt < Date.now()) {
                this.localCache.delete(key);
                return null;
            }
            return cacheVal.value;
        }
    }
    async del(key) {
        if (this.isFallbackMode) {
            this.localCache.delete(key);
            return;
        }
        try {
            await this.client.del(key);
        }
        catch (err) {
            this.logger.error(`Redis delete operation failed: ${err.message}`);
            this.localCache.delete(key);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map