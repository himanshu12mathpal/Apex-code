import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../config';
import {
  BrainCircuit, Code2, Lightbulb, AlertTriangle,
  CheckCircle2, Zap, Clock, ArrowRight, Cpu, Eye,
  Target, TrendingUp, BookOpen, Sparkles, Loader2, Download
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const platforms = [
  { id: 'Codeforces', label: 'Codeforces', color: '#1890FF', placeholder: 'Problem name or link' },
  { id: 'LeetCode', label: 'LeetCode', color: '#FFA116', placeholder: 'Problem name or number' },
  { id: 'AtCoder', label: 'AtCoder', color: '#66BB6A', placeholder: 'Problem name or link' },
];

export default function Analyzer() {
  const { user, token } = useAuth();
  const [platform, setPlatform] = useState('Codeforces');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [intuition, setIntuition] = useState('');
  const [approach, setApproach] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [edgeCases, setEdgeCases] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);

  const handleAnalyze = async () => {
    if (!title.trim() || !code.trim()) return toast.error('Title and code are required');
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await fetch(`${API_BASE}/api/analyzer/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: user.id,
          platform,
          title,
          code,
          language,
          userNotes: { intuition, approach, mistakes, edgeCases }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAnalysis(data.analysis);
      setXpEarned(data.xpEarned);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePushToExcel = async () => {
    if (!analysis) return;
    try {
      // Open file picker to let user choose the CSV file
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'CSV Files', accept: { 'text/csv': ['.csv'] } }],
        multiple: false,
      });

      // Request write permission
      const writable = await fileHandle.createWritable({ keepExistingData: true });
      
      // Read existing content
      const file = await fileHandle.getFile();
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a valid .csv file, not .xlsx!');
        return;
      }
      
      const text = await file.text();
      
      let newContent = '';
      // If file is totally empty or missing headers, add headers
      if (text.trim() === '' || !text.includes('Problem Title')) {
        newContent += 'Date,Problem Title,Platform,Difficulty,Time Complexity,Space Complexity,Is Optimal,Pattern Detected,Missed Observations,Coach Feedback,Alternative Approaches\n';
      } else if (!text.endsWith('\n')) {
        newContent += '\n'; // ensure we start on a new line
      }

      // Build row data
      const missed = analysis.missedObservations && analysis.missedObservations.length > 0 
        ? analysis.missedObservations.join(' | ') : 'None';
      const alts = analysis.alternativeApproaches && analysis.alternativeApproaches.length > 0 
        ? analysis.alternativeApproaches.map(a => `${a.name} (${a.complexity}): ${a.note}`).join(' | ') : 'None';
        
      const row = [
        `"${new Date().toLocaleDateString()}"`,
        `"${(title || '').replace(/"/g, '""')}"`,
        `"${platform || ''}"`,
        `"Medium"`,
        `"${(analysis.timeComplexity || '').replace(/"/g, '""')}"`,
        `"${(analysis.spaceComplexity || '').replace(/"/g, '""')}"`,
        `"${analysis.isOptimal ? 'Yes' : 'No'}"`,
        `"${(analysis.patternDetected || 'None').replace(/"/g, '""')}"`,
        `"${missed.replace(/"/g, '""')}"`,
        `"${(analysis.thinkingFeedback || '').replace(/"/g, '""')}"`,
        `"${alts.replace(/"/g, '""')}"`
      ].join(',');

      newContent += row + '\n';

      // Seek to end and append
      await writable.write({ type: 'write', position: file.size, data: newContent });
      await writable.close();

      toast.success(`Successfully pushed report to ${file.name}`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Failed to update the selected file.');
      }
    }
  };

  const currentPlatform = platforms.find(p => p.id === platform);

  return (
    <motion.div
      className="p-6 max-md:pt-16 max-md:px-4 max-md:pb-4 w-full max-w-[1400px] mx-auto box-border min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="flex items-center gap-3 text-3xl max-md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          <BrainCircuit size={28} className="text-[var(--color-primary)]" />
          AI Problem Analyzer
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-1 ml-10 max-md:ml-0">
          Submit your solution and get deep AI-powered analysis with contest-focused feedback
        </p>
      </motion.div>

      <div className="grid grid-cols-[1fr_1fr] max-xl:grid-cols-1 gap-6 items-start">
        {/* Input Panel */}
        <motion.div className="flex flex-col gap-6" variants={itemVariants}>
          {/* Platform Selector */}
          <div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-[var(--text-primary)] mb-4">
              <Cpu size={16} className="text-[var(--text-tertiary)]" /> Platform & Problem
            </h3>
            <div className="flex gap-2 p-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg mb-5 overflow-x-auto">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  className={`flex-1 min-w-[100px] py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200 border-none cursor-pointer
                    ${platform === p.id ? 'bg-[var(--bg-card)] shadow-sm text-current' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                  `}
                  onClick={() => setPlatform(p.id)}
                  style={platform === p.id ? { color: p.color } : {}}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Problem Title / ID</label>
              <input
                className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-light)]"
                type="text"
                placeholder={currentPlatform.placeholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Code Input */}
          <div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--border-primary)]">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-[var(--text-primary)] m-0">
                <Code2 size={16} className="text-[var(--text-tertiary)]" /> Your Solution
              </h3>
              <select
                className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium cursor-pointer"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <textarea
              className="w-full flex-1 min-h-[300px] p-4 bg-[#0d1117] border border-[var(--border-primary)] rounded-lg text-[13px] text-[#e6edf3] font-mono leading-relaxed resize-y transition-all focus:outline-none focus:border-[var(--color-primary)]"
              placeholder={`// Paste your ${language} solution here...`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
            />
          </div>

          {/* Self Reflection */}
          <div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-5">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-[var(--text-primary)] mb-4">
              <Lightbulb size={16} className="text-[var(--color-warning)]" /> Self Reflection
              <span className="ml-auto bg-[var(--color-success-light)] text-[var(--color-success)] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex items-center gap-1"><Zap size={10}/> +10 XP</span>
            </h3>
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Intuition</label>
                <textarea
                  className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] resize-y min-h-[80px]"
                  placeholder="First thought?"
                  value={intuition}
                  onChange={(e) => setIntuition(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Approach</label>
                <textarea
                  className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] resize-y min-h-[80px]"
                  placeholder="Step by step"
                  value={approach}
                  onChange={(e) => setApproach(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-bold text-[15px] rounded-xl shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] active:translate-y-0 active:shadow-none border-none cursor-pointer flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !title.trim() || !code.trim()}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Analyzing with Gemini...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Analyze Solution
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Analysis Results Panel */}
        <motion.div className="h-full" variants={itemVariants}>
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                className="h-full min-h-[600px] flex items-center justify-center glass-panel rounded-xl p-8 text-center shadow-[var(--shadow-sm)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col items-center gap-4 max-w-[300px]">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="p-4 bg-[var(--color-primary-light)] rounded-full text-[var(--color-primary)]">
                    <BrainCircuit size={48} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] m-0 mt-2">AI is analyzing...</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Checking complexity, detecting patterns, and generating contest feedback.</p>
                  <div className="w-full flex flex-col gap-3 mt-4 text-left">
                    {['Parsing syntax tree', 'Analyzing complexity', 'Detecting CP patterns', 'Writing feedback'].map((step, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium text-[var(--text-tertiary)]"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.8 }}
                      >
                        <Loader2 size={14} className="animate-spin text-[var(--color-primary)]" /> {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && !analysis && (
              <motion.div
                className="h-full min-h-[600px] flex items-center justify-center bg-[var(--bg-card)] border border-dashed border-[var(--border-secondary)] rounded-xl p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex flex-col items-center gap-4 max-w-[320px]">
                  <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center text-[var(--text-tertiary)]">
                    <BrainCircuit size={32} opacity={0.5} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] m-0">No Analysis Yet</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Submit your code on the left to get AI-powered feedback on time complexity, optimal approaches, and contest tips.</p>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && analysis && (
              <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Header */}
                <div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-3">{title}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)]">{platform}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handlePushToExcel}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
                      title="Push this report to local Excel sheet"
                    >
                      <Download size={16} /> Push to Excel
                    </button>
                    <motion.div 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-danger)] text-white font-bold text-sm rounded-lg shadow-md shrink-0"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                    >
                      <Zap size={16} /> +{xpEarned} XP
                    </motion.div>
                  </div>
                </div>

                {/* Complexity Row */}
                <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-4">
                  <div className="glass-panel rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="p-2.5 bg-[var(--color-info)]/10 text-[var(--color-info)] rounded-lg"><Clock size={20} /></div>
                    <div>
                      <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Time</div>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">{analysis.timeComplexity}</div>
                    </div>
                  </div>
                  <div className="glass-panel rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="p-2.5 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded-lg"><Cpu size={20} /></div>
                    <div>
                      <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Space</div>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">{analysis.spaceComplexity}</div>
                    </div>
                  </div>
                  <div className={`bg-[var(--bg-card)] border ${analysis.isOptimal ? 'border-[var(--color-success)]/30' : 'border-[var(--color-warning)]/30'} rounded-xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none ${analysis.isOptimal ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'}`} />
                    <div className={`p-2.5 rounded-lg ${analysis.isOptimal ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'}`}>
                      {analysis.isOptimal ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Optimal?</div>
                      <div className={`text-sm font-bold ${analysis.isOptimal ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>{analysis.isOptimal ? 'Yes' : 'Needs Work'}</div>
                    </div>
                  </div>
                </div>

                {/* Pattern */}
                <div className="glass-panel rounded-xl p-6 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                    <Target size={16} className="text-[var(--text-tertiary)]" /> CP Pattern Detected
                  </h3>
                  <div className="inline-flex px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm font-bold text-[var(--text-primary)] shadow-sm">
                    {analysis.patternDetected || 'No specific pattern'}
                  </div>
                </div>

                {/* Thinking Feedback */}
                <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--color-primary-light)] border border-[var(--color-primary)]/30 rounded-xl p-6 shadow-md relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-primary)] opacity-5 blur-[40px] rounded-full pointer-events-none" />
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-3">
                    <BrainCircuit size={16} /> Coach Feedback
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto pr-2">
                    <p className="text-[15px] leading-relaxed text-[var(--text-primary)] font-medium m-0">
                      {analysis.thinkingFeedback}
                    </p>
                  </div>
                </div>

                {/* Missed Observations */}
                {analysis.missedObservations && analysis.missedObservations.length > 0 && (
                  <div className="glass-panel rounded-xl p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                      <Eye size={16} className="text-[var(--text-tertiary)]" /> Missed Observations
                    </h3>
                    <div className="max-h-[200px] overflow-y-auto pr-2">
                      <ul className="m-0 p-0 list-none flex flex-col gap-3">
                        {analysis.missedObservations.map((obs, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                            <AlertTriangle size={16} className="shrink-0 text-[var(--color-warning)] mt-0.5" />
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Alternatives */}
                {analysis.alternativeApproaches && analysis.alternativeApproaches.length > 0 && (
                  <div className="glass-panel rounded-xl p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                      <TrendingUp size={16} className="text-[var(--text-tertiary)]" /> Alternative Approaches
                    </h3>
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
                      {analysis.alternativeApproaches.map((alt, i) => (
                        <div key={i} className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm text-[var(--text-primary)]">{alt.name}</span>
                            <span className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded text-[11px] font-mono text-[var(--text-secondary)]">{alt.complexity}</span>
                          </div>
                          <p className="text-[13px] text-[var(--text-secondary)] m-0 leading-relaxed">{alt.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
