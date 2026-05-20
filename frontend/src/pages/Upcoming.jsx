import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowUpRight, Bell, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Upcoming() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cfContests, setCfContests] = useState([]);
  const [atcoderContests, setAtcoderContests] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());

  useEffect(() => {
    fetchUpcoming();
    fetchRegistered();
  }, []);

  async function fetchUpcoming() {
    try {
      setLoading(true);
      const res = await fetch('/api/contests/upcoming');
      if (res.ok) {
        const data = await res.json();
        // Separate by platform
        const cf = data.filter(c => c.platform === 'Codeforces');
        const at = data.filter(c => c.platform === 'AtCoder');
        setCfContests(cf);
        setAtcoderContests(at);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load upcoming contests');
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
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  }

  const formatDate = (s) => new Date(s * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <div className="p-8 text-[var(--text-primary)]">Loading upcoming contests...</div>;
  }

  return (
    <motion.div className="p-6 max-md:pt-16 max-md:px-4 max-md:pb-4 w-full max-w-[1400px] mx-auto box-border" variants={containerVariants} initial="hidden" animate="show">
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="flex items-center gap-3 text-3xl max-md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          <Calendar size={28} className="text-[var(--color-primary)]" /> Upcoming Contests
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-1 ml-10 max-md:ml-0">
          Track and register for upcoming contests across platforms.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Codeforces Column */}
        <motion.div className="flex flex-col gap-4" variants={itemVariants}>
          <div className="bg-[var(--bg-card)] p-4 border border-[#1890FF]/30 rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold text-[#1890FF] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1890FF] animate-pulse"></span> Codeforces
            </span>
            <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-md">{cfContests.length} Contests</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {cfContests.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-tertiary)] glass-panel rounded-xl">No upcoming Codeforces contests.</div>
            ) : (
              cfContests.map(c => (
                <ContestCard key={c.id} contest={c} registeredIds={registeredIds} handleRegister={handleRegister} formatDate={formatDate} color="#1890FF" />
              ))
            )}
          </div>
        </motion.div>

        {/* AtCoder Column */}
        <motion.div className="flex flex-col gap-4" variants={itemVariants}>
          <div className="bg-[var(--bg-card)] p-4 border border-[#00C78B]/30 rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold text-[#00C78B] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C78B] animate-pulse"></span> AtCoder
            </span>
            <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-md">{atcoderContests.length} Contests</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {atcoderContests.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-tertiary)] glass-panel rounded-xl">No upcoming AtCoder contests.</div>
            ) : (
              atcoderContests.map(c => (
                <ContestCard key={c.id} contest={c} registeredIds={registeredIds} handleRegister={handleRegister} formatDate={formatDate} color="#00C78B" />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ContestCard({ contest, registeredIds, handleRegister, formatDate, color }) {
  const isRegistered = registeredIds.has(String(contest.id));
  
  return (
    <div className="glass-panel rounded-xl p-5 hover:border-[var(--color-primary)] transition-all group border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start gap-4 mb-4">
        <h3 className="text-base font-bold text-[var(--text-primary)] m-0 leading-snug">{contest.name}</h3>
        <button
          onClick={() => handleRegister(contest)}
          disabled={isRegistered}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold border-none cursor-pointer transition-all ${
            isRegistered
              ? 'bg-[var(--color-success-light)] text-[var(--color-success)] cursor-default'
              : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg'
          }`}
        >
          {isRegistered ? <><CheckCircle2 size={14}/> Registered</> : <><Bell size={14}/> Notify Me</>}
        </button>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-4">
          <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
            <Clock size={14} className="text-[var(--text-tertiary)]" /> {formatDate(contest.startTimeSeconds)}
          </span>
        </div>
        <a href={contest.url || `https://codeforces.com/contest/${contest.id}`} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md text-xs font-bold transition-colors border border-[var(--border-primary)] no-underline">
          Visit <ArrowUpRight size={14} />
        </a>
      </div>
    </div>
  );
}
