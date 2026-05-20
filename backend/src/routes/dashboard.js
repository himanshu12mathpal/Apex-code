import express from 'express';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { authMiddleware } from '../utils/jwt.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/dashboard/stats
 * Get user dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    const totalProblems = await Problem.countDocuments({ userId });
    
    // Total contests might need a Contests model, mock for now
    const totalContests = 0; 

    // Problem count by difficulty
    const difficultyStats = await Problem.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]);

    // Heatmap data (last 365 days)
    const heatmapStart = new Date();
    heatmapStart.setDate(heatmapStart.getDate() - 365);
    const heatmapProblems = await Problem.find(
      { userId: user._id, solvedAt: { $gte: heatmapStart } },
      'solvedAt'
    );
    const heatmapData = heatmapProblems.map(p => p.solvedAt);

    res.json({
      user: {
        username: user.username,
        xp: user.xp,
        level: user.level,
        streakCount: user.streakCount,
        consistencyScore: user.consistencyScore,
      },
      totalProblems,
      totalContests,
      difficultyStats,
      heatmapData,
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/dashboard/weekly
 * Get weekly activity data
 */
router.get('/weekly', async (req, res) => {
  try {
    const userId = req.userId;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weeklyData = await Problem.aggregate([
      { $match: { userId: (await User.findById(userId))._id, solvedAt: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dayOfWeek: '$solvedAt' },
          problems: { $sum: 1 },
          xp: { $sum: '$xpEarned' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(weeklyData);
  } catch (error) {
    console.error('Weekly Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

export default router;
