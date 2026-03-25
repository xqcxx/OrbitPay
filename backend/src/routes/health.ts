import { Router } from 'express';
import { getHealthCheckResult } from '../lib/health';

const router = Router();

router.get('/', async (_req, res) => {
  const health = await getHealthCheckResult('api');
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

export default router;
