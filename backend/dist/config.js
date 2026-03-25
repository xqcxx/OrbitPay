"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
exports.config = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: toNumber(process.env.PORT, 3001),
    indexerPort: toNumber(process.env.INDEXER_PORT, 3002),
    databaseUrl: process.env.DATABASE_URL ?? '',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    rateLimit: {
        maxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
        windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_SECONDS, 60) * 1000,
        backoffBaseMs: toNumber(process.env.RATE_LIMIT_BACKOFF_BASE_SECONDS, 60) * 1000,
    },
    indexerPollIntervalMs: toNumber(process.env.INDEXER_POLL_INTERVAL_MS, 5000),
};
