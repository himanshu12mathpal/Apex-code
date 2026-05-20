import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Trophy, ArrowUpRight, Calendar, Target, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../config';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Analytics() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cfContests, setCfContests] = useState([]);
  const [acContests, setAcContests] = useState([]);
  const [apexData, setApexData] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  async function fetchAnalyticsData() {
    try {
      // Fetch 6 months CF contests (~180 days)
      const cfRes = await fetch(`${API_BASE}/api/contests/recent/2?days=180`);
      // Fetch ~25 AtCoder ABC contests (which is approx 6 months of weekly contests)
      const acRes = await fetch(`${API_BASE}/api/contests/atcoder/abc?limit=25`);
      // Fetch Real User Rating
      const apexRes = await fetch(`${API_BASE}/api/rating/unified`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (cfRes.ok) setCfContests(await cfRes.json());
      if (acRes.ok) setAcContests(await acRes.json());
      if (apexRes.ok) setApexData(await apexRes.json());
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (s) => new Date(s * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return <div className="p-8 text-[var(--text-primary)]">Loading analytics & 6-month contest history...</div>;
  }

  return (
    <motion.div
      className="p-6 max-md:pt-16 max-md:px-4 max-md:pb-4 w-full max-w-[1400px] mx-auto box-border"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="flex items-center gap-3 text-3xl max-md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          <BarChart3 size={28} className="text-[var(--color-primary)]" />
          Analytics & 6-Month History
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-1 ml-10 max-md:ml-0">
          Your real performance data and recent contest history
        </p>
      </motion.div>

      {/* Real ApexRating Overview */}
      {apexData && (
        <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-6 mb-8" variants={itemVariants}>
           <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] mb-6">
            <Target size={18} className="text-[var(--text-tertiary)]" /> Linked Accounts & Real Ratings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] border-l-[4px] border-l-[#1890FF]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#1890FF]">Codeforces</span>
                {apexData.platforms.codeforces.handle ? <span className="text-xs bg-[#1890FF]/10 text-[#1890FF] px-2 py-1 rounded">Linked</span> : <span className="text-xs text-[var(--text-tertiary)]">Not Linked</span>}
              </div>
              <div className="text-3xl font-extrabold text-[var(--text-primary)]">{apexData.platforms.codeforces.rating || 0}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Handle: {apexData.platforms.codeforces.handle || 'N/A'}</div>
            </div>

            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] border-l-[4px] border-l-[#00C78B]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#00C78B]">AtCoder</span>
                {apexData.platforms.atcoder.handle ? <span className="text-xs bg-[#00C78B]/10 text-[#00C78B] px-2 py-1 rounded">Linked</span> : <span className="text-xs text-[var(--text-tertiary)]">Not Linked</span>}
              </div>
              <div className="text-3xl font-extrabold text-[var(--text-primary)]">{apexData.platforms.atcoder.rating || 0}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Handle: {apexData.platforms.atcoder.handle || 'N/A'}</div>
            </div>

            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] border-l-[4px] border-l-[#FFA116]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#FFA116]">LeetCode</span>
                {apexData.platforms.leetcode.username ? <span className="text-xs bg-[#FFA116]/10 text-[#FFA116] px-2 py-1 rounded">Linked</span> : <span className="text-xs text-[var(--text-tertiary)]">Not Linked</span>}
              </div>
              <div className="text-3xl font-extrabold text-[var(--text-primary)]">{apexData.platforms.leetcode.rating || 0}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Handle: {apexData.platforms.leetcode.username || 'N/A'}</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 flex items-center justify-between bg-gradient-to-r from-[var(--color-primary)] to-[#8B5CF6] rounded-lg text-white">
            <div>
              <div className="text-sm font-bold uppercase tracking-wider mb-1">ApexRating (Calculated using Maximum Skill Index Formula)</div>
              <div className="text-3xl font-extrabold">{apexData.apexRating || 0}</div>
            </div>
            <Globe size={48} className="opacity-20" />
          </div>
        </motion.div>
      )}

      {/* 6 Months Contests History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
        {/* AtCoder Last 6 Months */}
        <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-6 flex flex-col" variants={itemVariants}>
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-primary)]">
            <h3 className="flex items-center gap-2 text-base font-semibold m-0 text-[var(--text-primary)]">
              <Trophy size={18} className="text-[#00C78B]" /> AtCoder ABC (Last 6 Months)
            </h3>
            <span className="text-xs font-bold text-[var(--text-tertiary)]">{acContests.length} Contests</span>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[500px]">
            {acContests.length === 0 ? (
              <div className="text-center text-[var(--text-tertiary)] py-4 text-sm">No contests found.</div>
            ) : (
              acContests.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg transition-all hover:border-[var(--border-hover)]">
                  <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] leading-snug truncate">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-[#00C78B]/10 text-[#00C78B]">
                        AtCoder
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1"><Calendar size={10}/> {formatDate(c.startTimeSeconds)}</span>
                    </div>
                  </div>
                  <a href={c.url} target="_blank" rel="noreferrer" className="shrink-0 ml-2 flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-tertiary)] hover:bg-[#00C78B] text-[var(--text-primary)] hover:text-white transition-colors border border-[var(--border-primary)] hover:border-transparent">
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Codeforces Last 6 Months */}
        <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-6 flex flex-col" variants={itemVariants}>
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-primary)]">
            <h3 className="flex items-center gap-2 text-base font-semibold m-0 text-[var(--text-primary)]">
              <Clock size={18} className="text-[#1890FF]" /> Codeforces Div.2 (Last 6 Months)
            </h3>
            <span className="text-xs font-bold text-[var(--text-tertiary)]">{cfContests.length} Contests</span>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[500px]">
            {cfContests.length === 0 ? (
              <div className="text-center text-[var(--text-tertiary)] py-4 text-sm">No contests found.</div>
            ) : (
              cfContests.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg transition-all hover:border-[var(--border-hover)]">
                  <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] leading-snug truncate">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-[#1890FF]/10 text-[#1890FF]">
                        CF {c.id}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1"><Calendar size={10}/> {formatDate(c.startTimeSeconds)}</span>
                    </div>
                  </div>
                  <a href={`https://codeforces.com/contest/${c.id}`} target="_blank" rel="noreferrer" className="shrink-0 ml-2 flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-tertiary)] hover:bg-[#1890FF] text-[var(--text-primary)] hover:text-white transition-colors border border-[var(--border-primary)] hover:border-transparent">
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
