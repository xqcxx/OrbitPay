"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = globalThis.orbitPayPrisma ??
    new client_1.PrismaClient({
        log: ['warn', 'error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalThis.orbitPayPrisma = exports.prisma;
}
