import { Redis, RedisOptions } from "ioredis";

/**
 * Redis & BullMQ Connection Management
 *
 * Provides dedicated connection instances for Producers (Queue) and Consumers (Worker)
 * with robust auto-reconnection, error interception, and ping-based health check.
 */

const DEFAULT_REDIS_URL = "redis://127.0.0.1:6379";

export const getRedisUrl = (): string => {
    return process.env.REDIS_URL?.trim() || DEFAULT_REDIS_URL;
};

/**
 * Builds standard Redis connection options.
 * Automatically enables TLS if rediss:// scheme is used.
 */
const buildRedisOptions = (customOptions: Partial<RedisOptions> = {}): RedisOptions => {
    const redisUrl = getRedisUrl();
    const isTls = redisUrl.startsWith("rediss://");
    const rejectUnauthorized = process.env.REDIS_TLS_INSECURE !== "true";

    const baseOptions: RedisOptions = {
        family: 4, // Force IPv4 on Windows to prevent transient getaddrinfo ENOTFOUND
        keepAlive: 10000, // Keep TCP socket alive on Upstash / cloud Redis
        connectTimeout: 10000,
        retryStrategy(times: number) {
            // Exponential backoff with a cap at 3000ms
            const delay = Math.min(times * 150, 3000);
            return delay;
        },
        enableReadyCheck: true,
        reconnectOnError(err) {
            const targetError = "READONLY";
            if (err.message.includes(targetError)) {
                return true; // Reconnect when replica switches to master
            }
            return false;
        },
        // Auto-configure TLS for rediss:// (verifies certs by default unless REDIS_TLS_INSECURE=true)
        ...(isTls ? { tls: { rejectUnauthorized } } : {}),
        ...customOptions
    };

    return baseOptions;
};

/**
 * Singleton producer connection for Queue enqueue operations.
 */
let queueRedisInstance: Redis | null = null;

export const getQueueRedisConnection = (): Redis => {
    if (queueRedisInstance) {
        return queueRedisInstance;
    }

    const redisUrl = getRedisUrl();
    const options = buildRedisOptions({
        maxRetriesPerRequest: 20
    });

    const client = new Redis(redisUrl, options);

    // Register error handler to avoid unhandled crash
    client.on("error", (err) => {
        console.warn("[Redis:Queue] Connection warning:", err.message);
    });

    client.on("connect", () => {
        console.log("[Redis:Queue] Connected successfully");
    });

    queueRedisInstance = client;
    return client;
};

/**
 * Factory for dedicated Worker connection.
 * BullMQ Worker requires maxRetriesPerRequest: null.
 */
export const createWorkerRedisConnection = (): Redis => {
    const redisUrl = getRedisUrl();
    const options = buildRedisOptions({
        maxRetriesPerRequest: null // STRICT BullMQ Worker requirement
    });

    const client = new Redis(redisUrl, options);

    client.on("error", (err) => {
        console.warn("[Redis:Worker] Connection warning:", err.message);
    });

    client.on("connect", () => {
        console.log("[Redis:Worker] Connected successfully");
    });

    return client;
};

/**
 * Checks if Redis is currently reachable and responsive to PING within timeoutMs.
 * Returns false on timeout or error; never throws.
 */
export const isRedisHealthy = async (timeoutMs: number = 1000): Promise<boolean> => {
    let testClient: Redis | null = null;
    try {
        const client = queueRedisInstance || getQueueRedisConnection();

        const pingPromise = client.ping();
        const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error("PING_TIMEOUT")), timeoutMs);
        });

        const reply = await Promise.race([pingPromise, timeoutPromise]);
        return reply === "PONG";
    } catch {
        return false;
    }
};

/**
 * Graceful close of all active connections on process termination.
 */
export const closeRedisConnections = async (): Promise<void> => {
    if (queueRedisInstance) {
        try {
            await queueRedisInstance.quit();
        } catch {
            queueRedisInstance.disconnect();
        } finally {
            queueRedisInstance = null;
        }
    }
};

export default {
    getRedisUrl,
    getQueueRedisConnection,
    createWorkerRedisConnection,
    isRedisHealthy,
    closeRedisConnections
};
