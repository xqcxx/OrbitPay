"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// GET /api/streams?sender={addr} or ?recipient={addr}
router.get('/streams', async (req, res) => {
    try {
        const { sender, recipient, cursor, limit = 10 } = req.query;
        const take = Number(limit);
        const skip = cursor ? 1 : 0;
        const cursorObj = cursor ? { id: String(cursor) } : undefined;
        const where = {};
        if (sender)
            where.sender = String(sender);
        if (recipient)
            where.recipient = String(recipient);
        const streams = await prisma_1.prisma.stream.findMany({
            where,
            take,
            skip,
            cursor: cursorObj,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { claimHistory: true }
                }
            }
        });
        const nextCursor = streams.length === take ? streams[streams.length - 1].id : null;
        res.json({
            data: streams,
            nextCursor
        });
    }
    catch (error) {
        console.error('Error fetching streams:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/streams/{id} — stream detail with claim history
router.get('/streams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const stream = await prisma_1.prisma.stream.findUnique({
            where: { id },
            include: {
                claimHistory: {
                    orderBy: { timestamp: 'desc' }
                }
            }
        });
        if (!stream) {
            return res.status(404).json({ error: 'Stream not found' });
        }
        res.json(stream);
    }
    catch (error) {
        console.error('Error fetching stream detail:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/treasury/{addr}/events — treasury event log
router.get('/treasury/:addr/events', async (req, res) => {
    try {
        const { addr } = req.params;
        const { cursor, limit = 10 } = req.query;
        const take = Number(limit);
        const skip = cursor ? 1 : 0;
        const cursorObj = cursor ? { id: String(cursor) } : undefined;
        const events = await prisma_1.prisma.treasuryEvent.findMany({
            where: { treasuryAddress: addr },
            take,
            skip,
            cursor: cursorObj,
            orderBy: { timestamp: 'desc' }
        });
        const nextCursor = events.length === take ? events[events.length - 1].id : null;
        res.json({
            data: events,
            nextCursor
        });
    }
    catch (error) {
        console.error('Error fetching treasury events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
