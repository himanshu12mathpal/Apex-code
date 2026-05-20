import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  Swords, Play, Clock, Trophy, Target, TrendingUp,
  ChevronRight, AlertCircle, CheckCircle2, XCircle,
  Timer, Medal, BarChart3, Flame, Calendar, ArrowUpRight, Bell, BellRing
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Contests() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [abcContests, setAbcContests] = useState([]);
  const [division, setDivision] = useState('2');
  const [ratingData, setRatingData] = useState([]);
  const [cfUser, setCfUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registeredIds, setRegisteredIds] = useState(new Set());

  useEffect(() => {
    fetchContestData();
    fetchRegistered();
  }, [user.codeforcesHandle, division]);

  async function fetchContestData() {
    setLoading(true);
    try {
      const [upRes, recRes, abcRes] = await Promise.all([
        fetch('/api/contests/upcoming'),
        fetch(`/api/contests/recent/${division}?days=180`),
        fetch('/api/contests/atcoder/abc?limit=25'),
      ]);
      if (upRes.ok) setUpcoming((await upRes.json()).slice(0, 8));
      if (recRes.ok) setRecent(await recRes.json());
      if (abcRes.ok) setAbcContests(await abcRes.json());

      if (user.codeforcesHandle) {
        const ratingRes = await fetch(`/api/contests/rating/${user.codeforcesHandle}`);
        if (ratingRes.ok) {
          const data = await ratingRes.json();
          setCfUser(data.user);
          setRatingData(data.ratingHistory.map(r => ({ contest: `CF #${r.contestId}`, rating: r.newRating })));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load contest data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRegistered() {
    try {
      const res = await fetch('/api/contests/registered', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setRegisteredIds(new Set(data.map(c => c.contestId)));
      }
    } catch (err) { console.error(err); }
  }

  async function handleRegister(contest) {
    try {
      const res = await fetch('/api/contests/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contestId: String(contest.id),
          contestName: contest.name,
          startTimeSeconds: contest.startTimeSeconds,
          platform: contest.platform || 'Codeforces',
          url: contest.url || `https://codeforces.com/contest/${contest.id}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRegisteredIds(prev => new Set([...prev, String(contest.id)]));
      toast.success('Registered! Reminder set ✅');

      // Schedule browser notification
      const msUntilContest = contest.startTimeSeconds * 1000 - Date.now();
      const reminderMs = msUntilContest - 15 * 60 * 1000; // 15 min before
      if (reminderMs > 0 && 'Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            setTimeout(() => {
              new Notification('🏆 Contest Starting Soon!', {
                body: `${contest.name} starts in 15 minutes!`,
                icon: '/favicon.ico',
              });
            }, reminderMs);
          }
        });
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  }

  // Virtual contest form
  const [vContestId, setVContestId] = useState('');
  const [vSolved, setVSolved] = useState('');
  const [vPenalty, setVPenalty] = useState('');

  async function submitVirtualContest(e) {
    e.preventDefault();
    if (!vContestId || !vSolved) return toast.error('Contest ID and Solved Count required');
    const toastId = toast.loading('Calculating virtual rating...');
    try {
      const res = await fetch('/api/contests/virtual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contestId: vContestId, solvedProblems: parseInt(vSolved), totalPenalty: parseInt(vPenalty || 0) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Virtual Rating: ${data.estimatedRating} (Rank ~${data.userPoints}) — Saved! ✅`, { id: toastId });
      setVContestId(''); setVSolved(''); setVPenalty('');
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  }

  const formatDuration = (s) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  const formatDate = (s) => new Date(s * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'start', label: 'Virtual Calculator', icon: Play },
    { id: 'recent', label: 'CF Contests', icon: Clock },
    { id: 'atcoder', label: 'AtCoder ABC', icon: Trophy },
  ];

  return (
    <motion.div className="p-6 max-md:pt-16 max-md:px-4 max-md:pb-4 w-full max-w-[1400px] mx-auto box-border" variants={containerVariants} initial="hidden" animate="show">
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="flex items-center gap-3 text-3xl max-md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          <Swords size={28} className="text-[var(--color-primary)]" /> Contest Hub
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-1 ml-10 max-md:ml-0">
          Codeforces + AtCoder — Track rating, register for contests, and estimate virtual performance
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div className="flex flex-wrap gap-2 mb-8 bg-[var(--bg-card)] p-1.5 rounded-lg border border-[var(--border-primary)] w-max max-md:w-full" variants={itemVariants}>
        {tabs.map((tab) => (
          <button key={tab.id}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 border-none cursor-pointer max-md:flex-1 max-md:justify-center
              ${activeTab === tab.id ? 'bg-[var(--color-primary)] text-white shadow-[0_2px_8px_rgba(99,102,241,0.4)]' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
            onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6">
            {/* Stats Row */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 max-md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] max-md:gap-3">
              <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]" variants={itemVariants}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]"><Trophy size={20} /></div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full tracking-wide uppercase bg-[var(--color-primary-light)] text-[var(--color-primary)]">{cfUser?.rank || 'Unrated'}</span>
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">{cfUser?.rating || 0}</div>
                <div className="text-[13px] font-medium text-[var(--text-secondary)]">Current Rating</div>
              </motion.div>
              <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]" variants={itemVariants}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg text-[var(--color-success)] bg-[var(--color-success-light)] border border-[var(--color-success)]"><Medal size={20} /></div>
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">{cfUser?.maxRating || 0}</div>
                <div className="text-[13px] font-medium text-[var(--text-secondary)]">Max Rating</div>
              </motion.div>
              <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]" variants={itemVariants}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg text-[var(--color-warning)] bg-[var(--color-warning-light)] border border-[var(--color-warning)]"><Flame size={20} /></div>
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">{ratingData.length}</div>
                <div className="text-[13px] font-medium text-[var(--text-secondary)]">Contests Given</div>
              </motion.div>
              <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]" variants={itemVariants}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg text-[var(--color-secondary)] bg-[var(--color-primary-light)] border border-[var(--color-secondary)]"><TrendingUp size={20} /></div>
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">{user.virtualRating || 0}</div>
                <div className="text-[13px] font-medium text-[var(--text-secondary)]">Virtual Rating</div>
              </motion.div>
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-6 max-lg:grid-cols-1">
              {/* Rating Graph */}
              <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 flex flex-col" variants={itemVariants}>
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-primary)]">
                  <h3 className="flex items-center gap-2 text-base font-semibold m-0 text-[var(--text-primary)]"><TrendingUp size={18} className="text-[var(--text-tertiary)]" /> Rating History</h3>
                </div>
                <div className="h-[280px] flex-1">
                  {ratingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ratingData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                        <XAxis dataKey="contest" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13 }} />
                        <Line type="monotone" dataKey="rating" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ fill: 'var(--color-primary)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: 'var(--color-primary)', strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] text-sm">{loading ? 'Loading...' : 'No rating history found.'}</div>
                  )}
                </div>
              </motion.div>

              {/* Upcoming Contests with Register */}
              <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 flex flex-col" variants={itemVariants}>
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-primary)]">
                  <h3 className="flex items-center gap-2 text-base font-semibold m-0 text-[var(--text-primary)]"><Clock size={18} className="text-[var(--text-tertiary)]" /> Upcoming Contests</h3>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[320px]">
                  {loading && upcoming.length === 0 ? (
                    <div className="text-center text-[var(--text-tertiary)] py-4 text-sm">Loading API...</div>
                  ) : upcoming.length === 0 ? (
                    <div className="text-center text-[var(--text-tertiary)] py-4 text-sm">No upcoming contests found.</div>
                  ) : (
                    upcoming.map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg transition-all hover:border-[var(--border-hover)]">
                        <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                          <span className="text-[13px] font-bold text-[var(--text-primary)] leading-snug truncate">{c.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${c.platform === 'AtCoder' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'}`}>
                              {c.platform || 'CF'}
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1"><Calendar size={10}/> {formatDate(c.startTimeSeconds)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRegister(c)}
                          disabled={registeredIds.has(String(c.id))}
                          className={`shrink-0 ml-2 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold border-none cursor-pointer transition-all ${
                            registeredIds.has(String(c.id))
                              ? 'bg-[var(--color-success-light)] text-[var(--color-success)] cursor-default'
                              : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                          }`}
                        >
                          {registeredIds.has(String(c.id)) ? <><CheckCircle2 size={12}/> Done</> : <><Bell size={12}/> Register</>}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'start' && (
          <motion.div key="start" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center justify-center min-h-[500px]">
            <div className="w-full max-w-[500px] glass-panel rounded-2xl shadow-[var(--shadow-md)] overflow-hidden">
              <div className="p-8 pb-6 flex flex-col items-center text-center border-b border-[var(--border-primary)] relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-10%] w-full h-[200%] bg-gradient-to-b from-[var(--color-primary-light)] to-transparent opacity-50 pointer-events-none -z-10" />
                <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center border-4 border-[var(--bg-card)] shadow-md mb-4 text-[var(--color-primary)]"><Play size={32} className="ml-1" /></div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Virtual Estimator</h2>
                <p className="text-sm text-[var(--text-secondary)]">Enter a CF contest ID and your score. Rating auto-saves and affects your ApexRating!</p>
              </div>
              <form className="p-8 flex flex-col gap-5" onSubmit={submitVirtualContest}>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Contest ID</label>
                  <input type="number" value={vContestId} onChange={e => setVContestId(e.target.value)} placeholder="e.g. 1920"
                    className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-light)]" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Problems Solved</label>
                    <input type="number" value={vSolved} onChange={e => setVSolved(e.target.value)} placeholder="e.g. 4"
                      className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-light)]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Penalty (opt)</label>
                    <input type="number" value={vPenalty} onChange={e => setVPenalty(e.target.value)} placeholder="e.g. 150"
                      className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-light)]" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-2 py-3.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-bold text-sm rounded-lg shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] active:translate-y-0 border-none cursor-pointer flex justify-center items-center gap-2">
                  <Target size={18} /> Calculate & Save Rating
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'recent' && (
          <motion.div key="recent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6">
            <div className="flex items-center gap-4 bg-[var(--bg-card)] p-4 border border-[var(--border-primary)] rounded-xl">
              <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Division:</span>
              <div className="flex gap-2">
                {['1', '2', '3', '4'].map(d => (
                  <button key={d} onClick={() => setDivision(d)}
                    className={`px-3 py-1.5 rounded-md text-sm font-bold border-none cursor-pointer transition-colors ${division === d ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'}`}>
                    Div {d}
                  </button>
                ))}
              </div>
            </div>
            <ContestList contests={recent} loading={loading} emptyText={`No recent contests found for Div ${division}.`} formatDate={formatDate} formatDuration={formatDuration} platform="CF" />
          </motion.div>
        )}

        {activeTab === 'atcoder' && (
          <motion.div key="atcoder" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6">
            <div className="bg-[var(--bg-card)] p-4 border border-[var(--border-primary)] rounded-xl">
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">🟢 AtCoder Beginner Contests (ABC)</span>
            </div>
            <ContestList contests={abcContests} loading={loading} emptyText="No AtCoder contests found." formatDate={formatDate} formatDuration={formatDuration} platform="AtCoder" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ContestList({ contests, loading, emptyText, formatDate, formatDuration, platform }) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[600px]">
      {loading && contests.length === 0 ? (
        <div className="p-8 text-center text-[var(--text-tertiary)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)]">Loading...</div>
      ) : contests.length === 0 ? (
        <div className="p-8 text-center text-[var(--text-tertiary)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)]">{emptyText}</div>
      ) : (
        contests.map((contest) => (
          <motion.div key={contest.id} className="glass-panel rounded-xl p-5 hover:border-[var(--color-primary)] transition-colors group flex max-md:flex-col justify-between md:items-center gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 group-hover:text-[var(--color-primary)] transition-colors">{contest.name}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md border border-[var(--border-primary)] ${platform === 'AtCoder' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'}`}>
                  {platform === 'AtCoder' ? contest.type || 'ABC' : `ID: ${contest.id}`}
                </span>
                <span className="text-[var(--text-tertiary)] font-medium flex items-center gap-1.5"><Calendar size={14}/> {formatDate(contest.startTimeSeconds)}</span>
                <span className="text-[var(--text-tertiary)] font-medium flex items-center gap-1.5"><Timer size={14}/> {formatDuration(contest.durationSeconds)}</span>
              </div>
            </div>
            <a href={contest.url || `https://codeforces.com/contest/${contest.id}`} target="_blank" rel="noreferrer"
              className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--color-primary)] text-[var(--text-primary)] hover:text-white rounded-lg text-sm font-bold transition-colors border border-[var(--border-primary)] hover:border-transparent no-underline">
              <ArrowUpRight size={16} /> Open
            </a>
          </motion.div>
        ))
      )}
    </div>
  );
}
