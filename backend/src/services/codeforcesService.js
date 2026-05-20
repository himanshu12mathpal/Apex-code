const CF_API = 'https://codeforces.com/api';

/**
 * Parse division from contest name
 * Returns an array like ['1'], ['2'], ['3'], ['4'], or ['1', '2'] for combined
 */
function parseDivision(contestName) {
  const divs = [];
  const name = contestName.toLowerCase();
  if (name.includes('div. 1') || name.includes('div.1')) divs.push('1');
  if (name.includes('div. 2') || name.includes('div.2')) divs.push('2');
  if (name.includes('div. 3') || name.includes('div.3')) divs.push('3');
  if (name.includes('div. 4') || name.includes('div.4')) divs.push('4');
  return divs;
}

let contestCache = null;
let contestCacheTime = 0;
let fetchPromise = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all contests from Codeforces API with Promise caching to prevent rate limiting
 */
export async function fetchContestList() {
  if (contestCache && Date.now() - contestCacheTime < CACHE_TTL) {
    return contestCache;
  }

  if (!fetchPromise) {
    fetchPromise = fetch(`${CF_API}/contest.list`)
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'OK') throw new Error('CF API error: ' + data.comment);
        contestCache = data.result;
        contestCacheTime = Date.now();
        fetchPromise = null;
        return contestCache;
      })
      .catch(err => {
        fetchPromise = null;
        throw err;
      });
  }

  return fetchPromise;
}

/**
 * Get upcoming (BEFORE phase) Codeforces contests
 */
export async function getUpcomingContests() {
  const contests = await fetchContestList();
  return contests
    .filter(c => c.phase === 'BEFORE')
    .map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      phase: c.phase,
      durationSeconds: c.durationSeconds,
      startTimeSeconds: c.startTimeSeconds,
      divisions: parseDivision(c.name),
    }))
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
}

/**
 * Get recent finished contests for a specific division (last N days)
 */
export async function getRecentContests(division, days = 50) {
  const contests = await fetchContestList();
  const cutoff = Math.floor(Date.now() / 1000) - (days * 86400);

  return contests
    .filter(c => {
      if (c.phase !== 'FINISHED') return false;
      if (c.startTimeSeconds < cutoff) return false;
      const divs = parseDivision(c.name);
      return divs.includes(division);
    })
    .map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      durationSeconds: c.durationSeconds,
      startTimeSeconds: c.startTimeSeconds,
      divisions: parseDivision(c.name),
    }))
    .sort((a, b) => b.startTimeSeconds - a.startTimeSeconds);
}

/**
 * Fetch user info from Codeforces (rating, rank, etc.)
 */
export async function getUserInfo(handle) {
  const res = await fetch(`${CF_API}/user.info?handles=${encodeURIComponent(handle)}`);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error('CF API error: ' + (data.comment || 'Unknown'));
  const user = data.result[0];
  return {
    handle: user.handle,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || 'unrated',
    maxRank: user.maxRank || 'unrated',
    avatar: user.avatar,
    titlePhoto: user.titlePhoto,
    contribution: user.contribution,
    friendOfCount: user.friendOfCount,
    registrationTimeSeconds: user.registrationTimeSeconds,
  };
}

/**
 * Fetch user's rating history from Codeforces
 */
export async function getUserRatingHistory(handle) {
  const res = await fetch(`${CF_API}/user.rating?handle=${encodeURIComponent(handle)}`);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error('CF API error: ' + (data.comment || 'Unknown'));
  return data.result.map(entry => ({
    contestId: entry.contestId,
    contestName: entry.contestName,
    rank: entry.rank,
    oldRating: entry.oldRating,
    newRating: entry.newRating,
    ratingChange: entry.newRating - entry.oldRating,
    timestamp: entry.ratingUpdateTimeSeconds,
  }));
}

/**
 * Fetch standings for a specific contest (for virtual rating estimation)
 */
export async function getContestStandings(contestId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
  try {
    // Codeforces now blocks extra parameters (like from/count) for non-gym contests without an API key!
    const res = await fetch(
      `${CF_API}/contest.standings?contestId=${contestId}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error('CF API error: ' + (data.comment || 'Unknown'));
    return {
      contest: data.result.contest,
      problems: data.result.problems,
      // We don't map all 10,000+ rows to save memory. We only need the length for totalParticipants.
      rows: { length: data.result.rows ? data.result.rows.length : 0 },
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Codeforces API timed out. Please try again.');
    }
    throw err;
  }
}

export function estimateVirtualRating(userPoints, userPenalty, standings, currentUserRating = 1200) {
  const solvedCount = parseInt(userPoints) || 0;
  const problems = standings.problems || [];
  
  if (solvedCount === 0 || problems.length === 0) {
    // If they solved 0, rating decreases
    return Math.max(0, currentUserRating - 50);
  }

  // Find the max rating of the problems they solved (assuming they solved the first N problems)
  let maxProblemRating = 800; // default minimum
  for (let i = 0; i < Math.min(solvedCount, problems.length); i++) {
    const prating = problems[i].rating || 800; // If unrated problem, assume 800
    if (prating > maxProblemRating) {
      maxProblemRating = prating;
    }
  }

  // Performance formula: if you solve a problem of rating X, your performance is roughly X + 150
  const performance = maxProblemRating + 150;

  // Simple Elo-like delta: 
  let delta = Math.round((performance - currentUserRating) / 4);

  // Cap delta to prevent crazy jumps from a single virtual contest
  if (delta > 100) delta = 100;
  if (delta < -100) delta = -100;

  let newRating = currentUserRating + delta;
  if (newRating < 0) newRating = 0;

  return newRating;
}
