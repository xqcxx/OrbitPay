import express from 'express';
import { config } from './config';
import { getHealthCheckResult } from './lib/health';

type IndexerState = {
  lastPollAt: string | null;
  lastSuccessfulPollAt: string | null;
  lastError: string | null;
};

const state: IndexerState = {
  lastPollAt: null,
  lastSuccessfulPollAt: null,
  lastError: null,
};

const pollContracts = async () => {
  state.lastPollAt = new Date().toISOString();

  try {
    // BK-2 will replace this shell with actual Soroban event polling.
    state.lastSuccessfulPollAt = state.lastPollAt;
    state.lastError = null;
  } catch (error) {
    state.lastError =
      error instanceof Error ? error.message : 'Unknown indexer error';
  }
};

setInterval(() => {
  void pollContracts();
}, config.indexerPollIntervalMs);

void pollContracts();

const app = express();

app.get('/health', async (_req, res) => {
  const baseHealth = await getHealthCheckResult('indexer');
  const status =
    baseHealth.status === 'ok' && !state.lastError ? 'ok' : 'degraded';

  res.status(status === 'ok' ? 200 : 503).json({
    ...baseHealth,
    status,
    indexer: state,
  });
});

app.listen(config.indexerPort, () => {
  console.log(`OrbitPay indexer is running on port ${config.indexerPort}`);
});
