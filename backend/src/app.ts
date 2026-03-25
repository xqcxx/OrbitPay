import cors from 'cors';
import express from 'express';
import { rateLimitMiddleware } from './middleware/rateLimit';
import healthRoutes from './routes/health';
import historyRoutes from './routes/history';
import proposalRoutes from './routes/proposals';
import vestingRoutes from './routes/vesting';

export const createApiApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(rateLimitMiddleware);

  app.use('/health', healthRoutes);
  app.use('/api/vesting', vestingRoutes);
  app.use('/api/proposals', proposalRoutes);
  app.use('/api', historyRoutes);

  return app;
};
