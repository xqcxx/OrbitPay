"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const health_1 = require("./lib/health");
const state = {
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
    }
    catch (error) {
        state.lastError =
            error instanceof Error ? error.message : 'Unknown indexer error';
    }
};
setInterval(() => {
    void pollContracts();
}, config_1.config.indexerPollIntervalMs);
void pollContracts();
const app = (0, express_1.default)();
app.get('/health', async (_req, res) => {
    const baseHealth = await (0, health_1.getHealthCheckResult)('indexer');
    const status = baseHealth.status === 'ok' && !state.lastError ? 'ok' : 'degraded';
    res.status(status === 'ok' ? 200 : 503).json({
        ...baseHealth,
        status,
        indexer: state,
    });
});
app.listen(config_1.config.indexerPort, () => {
    console.log(`OrbitPay indexer is running on port ${config_1.config.indexerPort}`);
});
