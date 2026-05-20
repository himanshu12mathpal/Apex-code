const ATCODER_API = 'https://kenkoooo.com/atcoder/resources';
const ATCODER_PROXY = 'https://kenkoooo.com/atcoder/atcoder-api/v3';

let atcoderCache = null;
let atcoderCacheTime = 0;
let atcoderFetchPromise = null;
let userRatingCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch all AtCoder contests from Kenkoooo API
 */
export async function fetchAtcoderContests() {
  if (atcoderCache && Date.now() - atcoderCacheTime < CACHE_TTL) {
    return atcoderCache;
  }

  if (!atcoderFetchPromise) {
    atcoderFetchPromise = fetch(`${ATCODER_API}/contests.json`)
      .then(res => res.json())
      .then(data => {
        atcoderCache = data;
        atcoderCacheTime = Date.now();
        atcoderFetchPromise = null;
        return atcoderCache;
      })
      .catch(err => {
        atcoderFetchPromise = null;
        throw err;
      });
  }

  return atcoderFetchPromise;
}

/**
 * Get upcoming AtCoder contests (ABC, ARC, AGC, etc.)
 */
export async function getUpcomingAtcoderContests() {
  const contests = await fetchAtcoderContests();
  const now = Math.floor(Date.now() / 1000);

  return contests
    .filter(c => c.start_epoch_second > now)
    .map(c => ({
      id: c.id,
      name: c.title,
      type: getContestType(c.id),
      platform: 'AtCoder',
      durationSeconds: c.duration_second,
      startTimeSeconds: c.start_epoch_second,
      url: `https://atcoder.jp/contests/${c.id}`,
    }))
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
    .slice(0, 10);
}

/**
 * Get recent finished AtCoder Beginner Contests (ABC)
 */
export async function getRecentABCContests(limit = 15) {
  const contests = await fetchAtcoderContests();
  const now = Math.floor(Date.now() / 1000);

  return contests
    .filter(c => c.start_epoch_second < now && c.id.startsWith('abc'))
    .map(c => ({
      id: c.id,
      name: c.title,
      type: 'ABC',
      platform: 'AtCoder',
      durationSeconds: c.duration_second,
      startTimeSeconds: c.start_epoch_second,
      url: `https://atcoder.jp/contests/${c.id}`,
    }))
    .sort((a, b) => b.startTimeSeconds - a.startTimeSeconds)
    .slice(0, limit);
}

function getContestType(id) {
  if (id.startsWith('abc')) return 'ABC';
  if (id.startsWith('arc')) return 'ARC';
  if (id.startsWith('agc')) return 'AGC';
  return 'Other';
}

/**
 * Fetch AtCoder user's contest rating history
 */
export async function getAtcoderUserRating(handle) {
  if (!handle) return null;

  const cacheKey = `ac_${handle}`;
  const cached = userRatingCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

  try {
    const res = await fetch(`${ATCODER_PROXY}/user/rating_history?user=${encodeURIComponent(handle)}`);
    if (!res.ok) return null;
    const history = await res.json();

    if (!history || history.length === 0) return { rating: 0, contestsAttended: 0, history: [] };

    const latest = history[history.length - 1];
    const result = {
      rating: latest.NewRating,
      maxRating: Math.max(...history.map(h => h.NewRating)),
      contestsAttended: history.length,
      history: history.slice(-20).map(h => ({
        contestName: h.ContestScreenName,
        oldRating: h.OldRating,
        newRating: h.NewRating,
        performance: h.Performance,
      })),
    };

    userRatingCache.set(cacheKey, { data: result, time: Date.now() });
    return result;
  } catch (err) {
    console.error('AtCoder Rating Error:', err.message);
    return null;
  }
}
