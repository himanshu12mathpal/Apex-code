const LC_API = 'https://leetcode.com/graphql';

let lcCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Fetch LeetCode user contest rating and stats via GraphQL
 */
export async function getLeetCodeContestInfo(username) {
  if (!username) return null;

  const cacheKey = `lc_${username}`;
  const cached = lcCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

  const query = `
    query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        rating
        globalRanking
        totalParticipants
        attendedContestsCount
        topPercentage
      }
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        contest { title startTime }
      }
    }
  `;

  try {
    const res = await fetch(LC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
      body: JSON.stringify({ query, variables: { username } }),
    });
    const json = await res.json();
    const ranking = json?.data?.userContestRanking;
    const history = (json?.data?.userContestRankingHistory || []).filter(h => h.attended);

    const result = {
      rating: Math.round(ranking?.rating || 0),
      globalRanking: ranking?.globalRanking || 0,
      contestsAttended: ranking?.attendedContestsCount || 0,
      topPercentage: ranking?.topPercentage || 0,
      history: history.slice(-20).map(h => ({
        contestName: h.contest.title,
        rating: Math.round(h.rating),
        ranking: h.ranking,
        startTime: h.contest.startTime,
      })),
    };

    lcCache.set(cacheKey, { data: result, time: Date.now() });
    return result;
  } catch (err) {
    console.error('LeetCode API Error:', err.message);
    return null;
  }
}

/**
 * Fetch LeetCode user profile stats
 */
export async function getLeetCodeProfile(username) {
  if (!username) return null;

  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStatsGlobal { acSubmissionNum { difficulty count } }
        profile { ranking }
      }
    }
  `;

  try {
    const res = await fetch(LC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
      body: JSON.stringify({ query, variables: { username } }),
    });
    const json = await res.json();
    const user = json?.data?.matchedUser;
    if (!user) return null;

    const stats = user.submitStatsGlobal?.acSubmissionNum || [];
    return {
      username: user.username,
      ranking: user.profile?.ranking || 0,
      solved: {
        all: stats.find(s => s.difficulty === 'All')?.count || 0,
        easy: stats.find(s => s.difficulty === 'Easy')?.count || 0,
        medium: stats.find(s => s.difficulty === 'Medium')?.count || 0,
        hard: stats.find(s => s.difficulty === 'Hard')?.count || 0,
      },
    };
  } catch (err) {
    console.error('LeetCode Profile Error:', err.message);
    return null;
  }
}
