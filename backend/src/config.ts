import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3001),
  indexerPort: toNumber(process.env.INDEXER_PORT, 3002),
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  rateLimit: {
    maxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_SECONDS, 60) * 1000,
    backoffBaseMs:
      toNumber(process.env.RATE_LIMIT_BACKOFF_BASE_SECONDS, 60) * 1000,
  },
  indexerPollIntervalMs: toNumber(process.env.INDEXER_POLL_INTERVAL_MS, 5000),
};
