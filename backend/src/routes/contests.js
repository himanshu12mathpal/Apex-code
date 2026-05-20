import express from 'express';
import {
  getUpcomingContests,
  getRecentContests,
  getUserInfo,
  getUserRatingHistory,
  getContestStandings,
  estimateVirtualRating,
} from '../services/codeforcesService.js';
import {
  getUpcomingAtcoderContests,
  getRecentABCContests,
} from '../services/atcoderService.js';
import { authMiddleware } from '../utils/jwt.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/contests/upcoming
 * Fetch upcoming Codeforces + AtCoder contests combined
 */
router.get('/upcoming', async (req, res) => {
  try {
    const [cfContests, atContests] = await Promise.allSettled([
      getUpcomingContests(),
      getUpcomingAtcoderContests(),
    ]);

    const cf = cfContests.status === 'fulfilled' 
      ? cfContests.value.map(c => ({ ...c, platform: 'Codeforces' })) 
      : [];
    const at = atContests.status === 'fulfilled' ? atContests.value : [];

    const combined = [...cf, ...at].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    res.json(combined);
  } catch (error) {
    console.error('Upcoming Contests Error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming contests' });
  }
});

/**
 * GET /api/contests/atcoder/abc
 * Fetch recent AtCoder Beginner Contests
 */
router.get('/atcoder/abc', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const contests = await getRecentABCContests(limit);
    res.json(contests);
  } catch (error) {
    console.error('AtCoder ABC Error:', error);
    res.status(500).json({ error: 'Failed to fetch AtCoder contests' });
  }
});

/**
 * GET /api/contests/recent/:division
 * Fetch recent 50-day contests for a specific division
 */
router.get('/recent/:division', async (req, res) => {
  try {
    const { division } = req.params;
    const days = parseInt(req.query.days) || 50;
    const contests = await getRecentContests(division, days);
    res.json(contests);
  } catch (error) {
    console.error('Recent Contests Error:', error);
    res.status(500).json({ error: 'Failed to fetch recent contests' });
  }
});

/**
 * GET /api/contests/rating/:handle
 * Fetch a Codeforces user's real rating and info
 */
router.get('/rating/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const [userInfo, ratingHistory] = await Promise.all([
      getUserInfo(handle),
      getUserRatingHistory(handle),
    ]);

    res.json({
      user: userInfo,
      ratingHistory: ratingHistory.slice(-20), // Last 20 contests
    });
  } catch (error) {
    console.error('Rating Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch rating. Check the handle.' });
  }
});

/**
 * POST /api/contests/virtual
 * Submit virtual contest results, auto-calculate and save rating
 */
router.post('/virtual', authMiddleware, async (req, res) => {
  try {
    const { contestId, solvedProblems, totalPenalty } = req.body;

    if (!contestId) {
      return res.status(400).json({ error: 'Contest ID is required' });
    }

    // Get real standings for comparison
    let standings;
    try {
      standings = await getContestStandings(contestId);
    } catch (cfErr) {
      console.error('CF Standings Error:', cfErr.message);
      return res.status(400).json({ error: `Could not fetch contest #${contestId}: ${cfErr.message}` });
    }

    // Calculate user's points (each solved problem = its points from standings)
    const userPoints = solvedProblems || 0;
    const userPenalty = totalPenalty || 0;

    // Fetch user to get current rating
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const currentRating = user.virtualRating || user.codeforcesRating || 1200;

    // Estimate virtual rating based on problem ratings
    const estimatedRating = estimateVirtualRating(userPoints, userPenalty, standings, currentRating);

    // Auto-save virtual rating to user profile
    await User.findByIdAndUpdate(req.userId, {
      virtualRating: estimatedRating,
    });

    res.json({
      contestId,
      contestName: standings.contest.name,
      totalParticipants: standings.rows.length,
      userPoints,
      userPenalty,
      estimatedRating,
      problems: standings.problems.map(p => ({
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags,
      })),
    });
  } catch (error) {
    console.error('Virtual Contest Error:', error.message, error.stack);
    res.status(500).json({ error: error.message || 'Failed to process virtual contest' });
  }
});

/**
 * POST /api/contests/register
 * Register for an upcoming contest (save reminder)
 */
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { contestId, contestName, startTimeSeconds, platform, url } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if already registered
    const already = user.registeredContests?.find(c => c.contestId === String(contestId));
    if (already) return res.status(400).json({ error: 'Already registered for this contest' });

    user.registeredContests.push({
      contestId: String(contestId),
      contestName,
      startTimeSeconds,
      platform: platform || 'Codeforces',
      url: url || '',
      registeredAt: new Date(),
    });
    
    await user.save();
    res.json({ success: true, message: 'Registered! You will get a reminder.' });
  } catch (error) {
    console.error('Register Contest Error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

/**
 * GET /api/contests/registered
 * Get user's registered contests
 */
router.get('/registered', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user.registeredContests || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registered contests' });
  }
});

export default router;
