import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { beneficiary } = req.query;
    if (!beneficiary) {
      return res.status(400).json({ error: 'beneficiary query parameter is required' });
    }
    const schedules = await prisma.vestingSchedule.findMany({
      where: { beneficiary: String(beneficiary) },
    });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await prisma.vestingSchedule.findUnique({
      where: { id },
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Vesting schedule not found' });
    }

    const now = new Date();
    const totalDuration = schedule.endTime.getTime() - schedule.startTime.getTime();
    const elapsed = now.getTime() - schedule.startTime.getTime();
    
    let progress = elapsed / totalDuration;
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;

    const vestedAmount = schedule.amount * progress;

    res.json({
      scheduleId: id,
      totalAmount: schedule.amount,
      vestedAmount: vestedAmount,
      progressPercentage: progress * 100,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
