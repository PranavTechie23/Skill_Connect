
import { Router } from 'express';
import { db } from '../db';
import {
    userGrowth,
    jobCategories,
    applicationStatus,
    engagement,
    quickStats,
    topJobListings
} from '../schema';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const userGrowthData = await db.select().from(userGrowth);
        const jobCategoriesData = await db.select().from(jobCategories);
        const applicationStatusData = await db.select().from(applicationStatus);
        const engagementData = await db.select().from(engagement);
        const quickStatsData = await db.select().from(quickStats);
        const topJobListingsData = await db.select().from(topJobListings);

        res.json({
            userGrowthData,
            jobCategoriesData,
            applicationStatusData,
            engagementData,
            quickStatsData,
            topJobListingsData,
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
