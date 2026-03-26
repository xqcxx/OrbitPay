"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = require("../lib/health");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    const health = await (0, health_1.getHealthCheckResult)('api');
    res.status(health.status === 'ok' ? 200 : 503).json(health);
});
exports.default = router;
