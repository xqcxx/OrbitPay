"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiApp = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const rateLimit_1 = require("./middleware/rateLimit");
const health_1 = __importDefault(require("./routes/health"));
const history_1 = __importDefault(require("./routes/history"));
const proposals_1 = __importDefault(require("./routes/proposals"));
const vesting_1 = __importDefault(require("./routes/vesting"));
const createApiApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(rateLimit_1.rateLimitMiddleware);
    app.use('/health', health_1.default);
    app.use('/api/vesting', vesting_1.default);
    app.use('/api/proposals', proposals_1.default);
    app.use('/api', history_1.default);
    return app;
};
exports.createApiApp = createApiApp;
