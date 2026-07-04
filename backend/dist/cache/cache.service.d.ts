import { RedisService } from '../redis/redis.service';
export declare class CacheService {
    private redis;
    constructor(redis: RedisService);
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
}
