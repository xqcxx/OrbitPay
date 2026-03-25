import { prisma } from './prisma';
import { getRedisClient } from './redis';

export type DependencyStatus = 'ok' | 'error';

export interface HealthCheckResult {
  service: string;
  status: 'ok' | 'degraded';
  checks: {
    database: DependencyStatus;
    redis: DependencyStatus;
  };
  details: {
    uptimeSeconds: number;
    timestamp: string;
  };
}

export const probeDatabase = async (): Promise<DependencyStatus> => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    return 'ok';
  } catch (error) {
    console.error('Database health check failed', error);
    return 'error';
  }
};

export const probeRedis = async (): Promise<DependencyStatus> => {
  try {
    const redis = await getRedisClient();
    const response = await redis.ping();
    return response === 'PONG' ? 'ok' : 'error';
  } catch (error) {
    console.error('Redis health check failed', error);
    return 'error';
  }
};

export const getHealthCheckResult = async (
  service: string,
): Promise<HealthCheckResult> => {
  const [database, redis] = await Promise.all([probeDatabase(), probeRedis()]);
  const status =
    database === 'ok' && redis === 'ok' ? 'ok' : 'degraded';

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
