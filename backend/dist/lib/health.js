"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthCheckResult = exports.probeRedis = exports.probeDatabase = void 0;
const prisma_1 = require("./prisma");
const redis_1 = require("./redis");
const probeDatabase = async () => {
    try {
        await prisma_1.prisma.$queryRawUnsafe('SELECT 1');
        return 'ok';
    }
    catch (error) {
        console.error('Database health check failed', error);
        return 'error';
    }
};
exports.probeDatabase = probeDatabase;
const probeRedis = async () => {
    try {
        const redis = await (0, redis_1.getRedisClient)();
        const response = await redis.ping();
        return response === 'PONG' ? 'ok' : 'error';
    }
    catch (error) {
        console.error('Redis health check failed', error);
        return 'error';
    }
};
exports.probeRedis = probeRedis;
const getHealthCheckResult = async (service) => {
    const [database, redis] = await Promise.all([(0, exports.probeDatabase)(), (0, exports.probeRedis)()]);
    const status = database === 'ok' && redis === 'ok' ? 'ok' : 'degraded';
    return {
        service,
        status,
        checks: {
            database,
            redis,
        },
        details: {
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
        },
    };
};
exports.getHealthCheckResult = getHealthCheckResult;
