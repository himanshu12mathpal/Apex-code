import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Flame, Trophy, Zap, Target, TrendingUp, BookOpen,
  Calendar, Clock, Star, CheckCircle2, BarChart3, ChevronRight, Plus, Trash2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
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

const heatmapColors = {
  0: 'var(--bg-tertiary)', // Adapts to light/dark mode for 0 submissions
  1: '#26a641', // Visibly green for 1 submission
  2: '#39d353', // Lighter green
  3: '#4ade80', // Even lighter green
  4: '#86efac', // Very light green
};

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskType, setNewTaskType] = useState('topic');
  const [loading, setLoading] = useState(true);
  const [recentProblems, setRecentProblems] = useState([]);
  const [apexData, setApexData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchTasks();
    fetchRecentProblems();
    fetchApexRating();
  }, [user]);

  async function fetchApexRating() {
    try {
      const res = await fetch(`${API_BASE}/api/rating/unified`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setApexData(await res.json());
    } catch (err) { console.error('ApexRating fetch error:', err); }
  }

  async function fetchDashboardData() {
    try {
      const resStats = await fetch(`${API_BASE}/api/dashboard/stats?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataStats = await resStats.json();
      setStats(dataStats);

      const resWeekly = await fetch(`${API_BASE}/api/dashboard/weekly?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataWeekly = await resWeekly.json();
      
      // format weekly data to match chart
      const formattedWeekly = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
        const found = dataWeekly.find(w => w._id === idx + 1); // mongo dayOfWeek is 1-7 starting Sunday
        return { day, problems: found?.problems || 0, xp: found?.xp || 0 };
      });
      setWeeklyData(formattedWeekly);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTasks() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE}/api/tasks?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRecentProblems() {
    try {
      const res = await fetch(`${API_BASE}/api/analyzer/problems?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRecentProblems(data.slice(0, 4));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newTaskText, type: newTaskType })
      });
      if (res.ok) {
        setNewTaskText('');
        fetchTasks();
        toast.success('Task added');
      }
    } catch (err) {
      toast.error('Failed to add task');
    }
  }

  async function toggleTask(taskId) {
    try {
      await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update task');
    }
  }

  async function deleteTask(taskId) {
    try {
      await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  }

  // Format heatmap data to 140 days
  const heatmapGrid = useMemo(() => {
    if (!stats?.heatmapData) return Array(365).fill({ count: 0, level: 0 });
    
    // Group raw dates into local YYYY-MM-DD counts
    const dataMap = new Map();
    stats.heatmapData.forEach(dateStr => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const localStr = `${year}-${month}-${day}`;
      dataMap.set(localStr, (dataMap.get(localStr) || 0) + 1);
    });

    const grid = [];
    const today = new Date();
    // Align to start on a Sunday
    const dayOfWeek = today.getDay();
    const totalDays = 52 * 7 + dayOfWeek + 1; // ~365 days aligned to weeks
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const count = dataMap.get(dateStr) || 0;
      let level = 0;
      if (count >= 5) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;
      grid.push({ date: dateStr, count, level });
    }
    return grid;
  }, [stats]);

  if (loading) {
    return <div className="p-8 text-[var(--text-primary)]">Loading dashboard...</div>;
  }

  const xpProgress = ((user.xp % 250) / 250) * 100;
  const xpForNextLevel = user.level * 250;

  return (
    <motion.div
      className="p-6 max-md:pt-16 max-md:px-4 max-md:pb-4 w-full max-w-[1400px] mx-auto box-border"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div className="mb-8 flex justify-between items-end flex-wrap gap-4" variants={itemVariants}>
        <div>
          <h1 className="text-3xl max-md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Good Morning, {user.username} 👋
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-1">
            Here's your competitive programming overview
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full text-sm text-[var(--text-secondary)] font-medium">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" variants={itemVariants}>
        <StatCard
          icon={<Flame />}
          label="Current Streak"
          value={`${user.streakCount} days`}
          accent="warning"
          badge="🔥 On Fire!"
          animated
        />

        <StatCard
          icon={<Target />}
          label="Problems Solved"
          value={stats.totalProblems || 0}
          accent="success"
          badge="Total"
        />
        <StatCard
          icon={<Trophy />}
          label="ApexRating"
          value={apexData?.apexRating || user.codeforcesRating || 'Unrated'}
          accent="secondary"
          badge="Unified"
        />
      </motion.div>

      {/* ApexRating Platform Breakdown */}
      {apexData && (apexData.platforms.codeforces.rating > 0 || apexData.platforms.atcoder.rating > 0 || apexData.platforms.leetcode.rating > 0) && (
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
          {apexData.platforms.codeforces.handle && (
            <div className="glass-panel card-hover rounded-xl p-4 flex items-center justify-between border-l-[3px] border-[#1890FF]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1890FF]/10 text-[#1890FF] flex items-center justify-center font-bold text-xs">CF</div>
                <div>
                  <div className="text-lg font-bold text-[var(--text-primary)] leading-tight">{apexData.platforms.codeforces.rating || 0}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">{apexData.platforms.codeforces.rank}</div>
                </div>
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] font-mono bg-[var(--bg-tertiary)] px-2 py-1 rounded-md">NORM: {apexData.platforms.codeforces.normalized}</div>
            </div>
          )}
          {apexData.platforms.atcoder.handle && (
            <div className="glass-panel card-hover rounded-xl p-4 flex items-center justify-between border-l-[3px] border-[#00C78B]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00C78B]/10 text-[#00C78B] flex items-center justify-center font-bold text-xs">AC</div>
                <div>
                  <div className="text-lg font-bold text-[var(--text-primary)] leading-tight">{apexData.platforms.atcoder.rating || 0}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">{apexData.platforms.atcoder.contestsAttended} CONTESTS</div>
                </div>
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] font-mono bg-[var(--bg-tertiary)] px-2 py-1 rounded-md">NORM: {apexData.platforms.atcoder.normalized}</div>
            </div>
          )}
          {apexData.platforms.leetcode.username && (
            <div className="glass-panel card-hover rounded-xl p-4 flex items-center justify-between border-l-[3px] border-[#FFA116]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFA116]/10 text-[#FFA116] flex items-center justify-center font-bold text-xs">LC</div>
                <div>
                  <div className="text-lg font-bold text-[var(--text-primary)] leading-tight">{apexData.platforms.leetcode.rating || 0}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">{apexData.platforms.leetcode.contestsAttended} CONTESTS</div>
                </div>
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] font-mono bg-[var(--bg-tertiary)] px-2 py-1 rounded-md">NORM: {apexData.platforms.leetcode.normalized}</div>
            </div>
          )}
        </motion.div>
      )}

      {/* Main Grid: Left (chart + heatmap) + Right (tasks + recent) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">
        {/* Left Column */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Weekly Activity Chart */}
          <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]" variants={itemVariants}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-primary)]">
              <h3 className="flex items-center gap-2 text-base font-semibold m-0 text-[var(--text-primary)]">
                <TrendingUp size={18} className="text-[var(--text-tertiary)]" /> Weekly XP
              </h3>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientXP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                  <Area type="monotone" dataKey="xp" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#gradientXP)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* LeetCode-Style Contribution Heatmap */}
          <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]" variants={itemVariants}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-primary)]">
              <h3 className="flex items-center gap-2 text-base font-semibold m-0 text-[var(--text-primary)]">
                <Calendar size={18} className="text-[var(--text-tertiary)]" /> {heatmapGrid.reduce((s, d) => s + d.count, 0)} submissions in the last year
              </h3>
            </div>
            <div className="overflow-x-auto pb-2">
              {/* Month Labels */}
              <div className="flex ml-[30px] mb-1">
                {(() => {
                  const months = [];
                  const today = new Date();
                  let lastMonth = -1;
                  for (let i = 0; i < 365; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - (364 - i));
                    const weekIdx = Math.floor(i / 7);
                    if (d.getMonth() !== lastMonth && d.getDay() === 0) {
                      lastMonth = d.getMonth();
                      months.push({ name: d.toLocaleString('default', { month: 'short' }), col: weekIdx });
                    }
                  }
                  return months.map((m, i) => (
                    <span key={i} className="text-[11px] text-[var(--text-tertiary)] font-medium" style={{ position: 'relative', left: `${m.col * 15 - (i > 0 ? months[i-1].col * 15 + 30 : 0)}px`, width: '30px' }}>
                      {m.name}
                    </span>
                  ));
                })()}
              </div>
              <div className="flex gap-0">
                {/* Weekday labels */}
                <div className="flex flex-col gap-[3px] mr-[6px] justify-start pt-0">
                  {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                    <div key={i} className="h-[13px] flex items-center">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-medium w-[24px] text-right">{d}</span>
                    </div>
                  ))}
                </div>
                {/* Grid */}
                <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-max">
                  {heatmapGrid.map((cell, idx) => (
                    <motion.div
                      key={idx}
                      className="w-[13px] h-[13px] rounded-[2px] transition-all hover:outline hover:outline-2 hover:outline-[#39d353] hover:outline-offset-1"
                      style={{ background: heatmapColors[cell.level] }}
                      title={`${cell.date}: ${cell.count} submissions`}
                      whileHover={{ scale: 1.5, zIndex: 10 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[var(--text-tertiary)] justify-end">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((l) => (
                  <div key={l} className="w-[13px] h-[13px] rounded-[2px]" style={{ background: heatmapColors[l] }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 min-w-0">

          {/* Daily Tasks */}
          <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]" variants={itemVariants}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-primary)]">
              <h3 className="flex items-center gap-2 text-base font-semibold m-0 text-[var(--text-primary)]">
                <Target size={18} className="text-[var(--text-tertiary)]" /> Today's Tasks
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[12px] font-medium rounded-full tracking-wide bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </span>
            </div>
            
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                placeholder="Add a task..." 
                className="flex-1 w-full px-3 py-2 text-sm font-sans bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-light)]" 
              />
              <select 
                value={newTaskType}
                onChange={e => setNewTaskType(e.target.value)}
                className="px-2 py-2 text-sm font-sans bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="topic">Topic</option>
                <option value="revision">Revision</option>
                <option value="upsolve">Upsolve</option>
                <option value="contest">Contest</option>
              </select>
              <button type="submit" className="flex items-center justify-center p-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-hover)] cursor-pointer">
                <Plus size={16} />
              </button>
            </form>

            <div className="flex flex-col gap-2">
              {tasks.length === 0 && <p className="text-sm text-[var(--text-tertiary)] text-center py-2">No tasks for today.</p>}
              {tasks.map((task) => (
                <motion.div
                  key={task._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] cursor-pointer transition-all ${task.completed ? 'opacity-70 bg-[var(--bg-tertiary)] border-transparent' : 'hover:border-[var(--border-hover)]'}`}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div 
                    onClick={() => toggleTask(task._id)}
                    className={`flex items-center justify-center w-5 h-5 min-w-5 rounded-[4px] border border-[var(--border-secondary)] bg-[var(--bg-primary)] transition-all ${task.completed ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white' : ''}`}
                  >
                    {task.completed && <CheckCircle2 size={14} />}
                  </div>
                  <div className="flex-1 flex justify-between items-center overflow-hidden">
                    <span className={`text-sm font-medium text-[var(--text-primary)] truncate ${task.completed ? 'line-through text-[var(--text-secondary)]' : ''}`}>{task.text}</span>
                    <span className={`shrink-0 ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full tracking-wide 
                      ${task.type === 'contest' ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)]' : 
                        task.type === 'revision' ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]' : 
                        task.type === 'upsolve' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 
                        'bg-[var(--color-success-light)] text-[var(--color-success)]'}`}>
                      {task.type}
                    </span>
                  </div>
                  <button onClick={() => deleteTask(task._id)} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--color-danger)] bg-transparent border-none cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Problems */}
          <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]" variants={itemVariants}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-primary)]">
              <h3 className="flex items-center gap-2 text-base font-semibold m-0 text-[var(--text-primary)]">
                <BookOpen size={18} className="text-[var(--text-tertiary)]" /> Recent Submissions
              </h3>
              <Link to="/submissions" className="flex items-center justify-center gap-1 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer no-underline">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentProblems.length === 0 && <p className="text-sm text-[var(--text-tertiary)] text-center py-2">No recent submissions.</p>}
              {recentProblems.map((prob) => (
                <motion.div
                  key={prob._id}
                  className="flex justify-between items-center p-3 rounded-lg border border-transparent bg-[var(--bg-secondary)] transition-all cursor-pointer hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-primary)]"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="flex flex-col gap-1.5 overflow-hidden">
                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{prob.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full tracking-wide bg-[var(--color-primary-light)] text-[var(--color-primary)]">{prob.platform}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full tracking-wide ${prob.difficulty === 'Easy' ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : prob.difficulty === 'Medium' ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]' : 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'}`}>
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 bg-[var(--bg-tertiary)] px-2 py-1 rounded-md border border-[var(--border-primary)]">
                    <Clock size={12} className="text-[var(--text-tertiary)]" />
                    <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                      {new Date(prob.solvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, accent, badge, progress, animated }) {
  const accentColors = {
    primary: 'var(--accent-primary)',
    success: 'var(--accent-success)',
    warning: 'var(--accent-warning)',
    secondary: 'var(--accent-secondary)',
  };
  
  const color = accentColors[accent];

  return (
    <motion.div
      className="glass-panel card-hover rounded-[var(--radius-xl)] p-5 relative overflow-hidden flex flex-col justify-between"
      variants={itemVariants}
    >
      <div className="flex justify-between items-start mb-6">
        <div 
          className={`flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] ${animated ? 'animate-[streak-fire_2s_infinite]' : ''}`}
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {icon}
        </div>
        {badge && (
          <span 
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full tracking-wider uppercase border"
            style={{ backgroundColor: `${color}10`, color: color, borderColor: `${color}20` }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-extrabold text-display tracking-tight mb-1">{value}</div>
        <div className="text-[13px] font-medium text-[var(--text-secondary)]">{label}</div>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      )}
    </motion.div>
  );
}
