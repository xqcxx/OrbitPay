"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = void 0;
const redis_1 = require("redis");
const config_1 = require("../config");
let redisClient = null;
let redisConnectPromise = null;
const getRedisClient = async () => {
    if (redisClient?.isOpen) {
        return redisClient;
    }
    if (redisConnectPromise) {
        return redisConnectPromise;
    }
    const client = (0, redis_1.createClient)({
        url: config_1.config.redisUrl,
        socket: {
            reconnectStrategy: (retries) => Math.min(1000 * 2 ** retries, 10_000),
        },
    });
    client.on('error', (error) => {
        console.error('Redis client error', error);
    });
    redisConnectPromise = client.connect().then(() => {
        redisClient = client;
        redisConnectPromise = null;
        return client;
    });
    return redisConnectPromise;
};
exports.getRedisClient = getRedisClient;
