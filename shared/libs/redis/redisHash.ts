import { Redis } from "@upstash/redis"
import IMapWrapper from "@shared-types/mapWrapper"
import { RedisClient } from "./redisClient"
import { AuxiliaryRedisMembers } from "@shared/types/auxRedis"

export class RedisHash 
implements IMapWrapper<Record<string, unknown> | null, string, string | number>, 
            AuxiliaryRedisMembers 
{
    private client: Redis
    key: string

    value: Record<string, unknown> | null

    constructor(hashKey: string) {
        this.key = hashKey
        this.client = RedisClient.getInstance()
        this.value = null
    }

    async initialise() {
        this.value = await this.getValue()
        return this
    }

    private async getValue(): Promise<Record<string, unknown> | null> {
        try {
            return await this.client.hgetall(this.key)
        } catch (error) {
            console.error('Error getting value from Redis:', error);
            throw new Error(`Failed to retrieve key "${this.key}" from Redis.`);
        }
    }

    async update() {
        this.value = await this.getValue();
        return this  // Return a new object with the updated state
    }

    async set(key: string, value: string | number){
        try {
            await this.client.hset(this.key, { [key]: value })
        } catch (error) {
            console.error('Error setting value in Redis:', error);
            throw new Error(`Failed to set key "${key}" with value "${value}" in Redis.`);
        }
    }

    async expire(ttl: number): Promise<boolean>{
        try {
            return await this.client.expire(this.key, ttl) === 1
        } catch (error) {
            console.error('Error expiring key:', error);
            throw new Error(`Failed to set TTL of ${ttl} for key "${this.key}" in Redis.`);
        }
    }

    async get(key: string): Promise<string | number | null> {
        try {
            return await this.client.hget(this.key, key);
        } catch (error) {
            console.error('Error retrieving value from Redis:', error);
            throw new Error(`Failed to get key "${key}" from Redis.`);
        }
    }
    
    async has(key: string): Promise<boolean> {
        try {
            return await this.client.hexists(this.key, key) === 1
        } catch (error) {
            console.error('Error retrieving value from Redis:', error);
            throw new Error(`Failed to get key "${key}" from Redis.`);
        }
    }
}