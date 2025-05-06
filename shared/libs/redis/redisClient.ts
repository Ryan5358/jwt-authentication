import { Redis } from "@upstash/redis";

const CONNECTION_INFO = `
[Upstash Redis Server]: 
   <*> Host: "${process.env.UPSTASH_REDIS_REST_URL}"
   <*> Token: "${process.env.UPSTASH_REDIS_REST_TOKEN}"
`

export class RedisClient {
    private static instance: Redis

    static getInstance(): Redis {
        if (!RedisClient.instance) {
            RedisClient.instance = Redis.fromEnv(); // Assuming Upstash Redis uses environment variables
            console.log("Redis client initialized.");
        }
        return RedisClient.instance;
    }

    static async isConnected(): Promise<boolean> {
        try {
            const client = RedisClient.getInstance()
            // Attempt to ping Redis to check if the connection is alive
            const response = await client.ping();
            
            // If Redis responds with "PONG", the connection is successful
            if (response === "PONG") {
                console.log("Successfully connected to Redis server.");
                return true
            } else {
                console.warn("Unexpected response from Redis server:", response);
                return false
            }
        } catch (error) {
            // Catch any errors thrown by ping() and handle gracefully
            console.error("Failed to connect to Redis:", error);
            throw new Error("Unable to establish Redis connection. Please check your Redis configuration.");
        }
    }
}