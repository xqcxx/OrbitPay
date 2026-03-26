"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const proposals = await prisma_1.prisma.proposal.findMany();
        res.json(proposals);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const proposal = await prisma_1.prisma.proposal.findUnique({
            where: { id },
            include: { votes: true },
        });
        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }
        res.json(proposal);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/votes', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '10' } = req.query;
        const pageNumber = parseInt(String(page), 10);
        const limitNumber = parseInt(String(limit), 10);
        const skip = (pageNumber - 1) * limitNumber;
        const votes = await prisma_1.prisma.vote.findMany({
            where: { proposalId: id },
            skip,
            take: limitNumber,
            orderBy: { createdAt: 'desc' },
        });
        const total = await prisma_1.prisma.vote.count({ where: { proposalId: id } });
        res.json({
            data: votes,
            meta: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
