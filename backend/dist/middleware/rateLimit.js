"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const config_1 = require("../config");
const entries = new Map();
const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};
const rateLimitMiddleware = (req, res, next) => {
    if (req.path === '/health') {
        next();
        return;
    }
    const now = Date.now();
    const ip = getClientIp(req);
    const current = entries.get(ip);
    if (!current || now - current.windowStartedAt >= config_1.config.rateLimit.windowMs) {
        entries.set(ip, {
            count: 1,
            windowStartedAt: now,
            blockedUntil: 0,
            violations: current?.violations ?? 0,
        });
        next();
        return;
    }
    if (current.blockedUntil > now) {
        const retryAfter = Math.ceil((current.blockedUntil - now) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please retry after the backoff period.',
            retryAfter,
        });
        return;
    }
    current.count += 1;
    if (current.count > config_1.config.rateLimit.maxRequests) {
        current.violations += 1;
        const backoffMs = config_1.config.rateLimit.backoffBaseMs * 2 ** (current.violations - 1);
        current.blockedUntil = now + backoffMs;
        const retryAfter = Math.ceil(backoffMs / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please retry after the backoff period.',
            retryAfter,
        });
        return;
    }
    entries.set(ip, current);
    next();
};
exports.rateLimitMiddleware = rateLimitMiddleware;
