import express from 'express';
import { authMiddleware } from '../utils/jwt.js';
import User from '../models/User.js';
import { getUserInfo } from '../services/codeforcesService.js';
import { getAtcoderUserRating } from '../services/atcoderService.js';
import { getLeetCodeContestInfo } from '../services/leetcodeService.js';

const router = express.Router();

/**
 * Normalize ratings to CF-equivalent scale
 */
function normalizeRating(cfRating, acRating, lcRating) {
  const cfStd = cfRating || 0;
  const acStd = acRating ? Math.round(acRating * 1.05) : 0;
  const lcStd = lcRating ? Math.round(lcRating * 0.65 + 200) : 0;
  return { cfStd, acStd, lcStd };
}

/**
 * Calculate ApexRating using Maximum Skill Index
 */
function calculateApexRating(cfStd, acStd, lcStd, vrStd) {
  const ratings = [cfStd, acStd, lcStd].filter(r => r > 0);
  let baseRating = ratings.length > 0 ? Math.max(...ratings) : 0;
  
  // If user has a virtual rating, it affects the overall rating (adding or decreasing)
  if (vrStd > 0) {
    if (baseRating === 0) baseRating = vrStd;
    else {
      // Blend virtual rating with base rating (gives it a 25% weight so it can increase or decrease overall)
      baseRating = Math.round((baseRating * 0.75) + (vrStd * 0.25));
    }
  }
  return Math.round(baseRating);
}

/**
 * GET /api/rating/unified
 * Fetch all platform ratings and return unified ApexRating
 */
router.get('/unified', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Parallel fetch all platform ratings
    const [cfData, acData, lcData] = await Promise.allSettled([
      user.codeforcesHandle ? getUserInfo(user.codeforcesHandle) : Promise.resolve(null),
      user.atcoderHandle ? getAtcoderUserRating(user.atcoderHandle) : Promise.resolve(null),
      user.leetcodeUsername ? getLeetCodeContestInfo(user.leetcodeUsername) : Promise.resolve(null),
    ]);

    const cf = cfData.status === 'fulfilled' ? cfData.value : null;
    const ac = acData.status === 'fulfilled' ? acData.value : null;
    const lc = lcData.status === 'fulfilled' ? lcData.value : null;

    const cfRating = cf?.rating || 0;
    const acRating = ac?.rating || 0;
    const lcRating = lc?.rating || 0;
    const vrRating = user.virtualRating || 0;

    const { cfStd, acStd, lcStd } = normalizeRating(cfRating, acRating, lcRating);
    const apexRating = calculateApexRating(cfStd, acStd, lcStd, vrRating);

    // Save to user
    user.codeforcesRating = cfRating;
    await user.save();

    res.json({
      apexRating,
      virtualRating: vrRating,
      platforms: {
        codeforces: {
          handle: user.codeforcesHandle || null,
          rating: cfRating,
          normalized: cfStd,
          rank: cf?.rank || 'unrated',
          maxRating: cf?.maxRating || 0,
        },
        atcoder: {
          handle: user.atcoderHandle || null,
          rating: acRating,
          normalized: acStd,
          maxRating: ac?.maxRating || 0,
          contestsAttended: ac?.contestsAttended || 0,
        },
        leetcode: {
          username: user.leetcodeUsername || null,
          rating: lcRating,
          normalized: lcStd,
          contestsAttended: lc?.contestsAttended || 0,
          globalRanking: lc?.globalRanking || 0,
        },
      },
    });
  } catch (error) {
    console.error('Unified Rating Error:', error);
    res.status(500).json({ error: 'Failed to fetch unified rating' });
  }
});

export default router;
