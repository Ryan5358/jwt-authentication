import { Redis } from "@upstash/redis"
import { RedisClient } from "libs/redis/redisClient"
import IListWrapper from "types/listWrapper"

export class RedisList implements IListWrapper<unknown[], string> {
    private client: Redis
    listKey: string

    value: unknown[]

    constructor(listKey: string) {
        this.client = RedisClient.getInstance()
        this.listKey = listKey
        this.value = []
    }

    async initialise() {
        this.value = await this.getValue()
        return this
    }

    private async getValue(): Promise<unknown[]> {
        try {
            return await this.client.lrange(this.listKey, 0, -1)
        } catch (error) {
            console.error('Error getting value from Redis:', error);
            throw new Error(`Failed to retrieve key "${this.listKey}" from Redis.`);
        }
    }

    async exists(item: string): Promise<boolean> {
        try {
            const list = await this.client.lrange(this.listKey, 0, -1);
            return list.includes(item);
        } catch (error) {
            console.error('Error checking if item exists:', error);
            throw new Error('Failed to check if item exists');
        }
    }

    async rpush(item: string): Promise<void> {
        try {
            await this.client.rpush(this.listKey, item)
        } catch (error) {
            console.error('Error pushing item to list:', error);
            throw new Error('Failed to push item to list');
        }
    }

    async delete(item: string): Promise<boolean> {
        try {
            const list = await this.client.lrange(this.listKey, 0, -1);
            const index = list.indexOf(item);
            if (index > -1) {
                await this.client.lrem(this.listKey, 1, item);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting item from list:', error);
            throw new Error('Failed to delete item from list');
        }
    }
}