"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', async (req, res) => {
    try {
        const proposals = await prisma.proposal.findMany();
        res.json(proposals);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const proposal = await prisma.proposal.findUnique({
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
        const votes = await prisma.vote.findMany({
            where: { proposalId: id },
            skip,
            take: limitNumber,
            orderBy: { createdAt: 'desc' },
        });
        const total = await prisma.vote.count({ where: { proposalId: id } });
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
