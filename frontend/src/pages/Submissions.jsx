import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../config';
import {
  History, Code2, BrainCircuit, Clock, Cpu, 
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Submissions() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analyzer/problems`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmissions(data);
    } catch (err) {
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <motion.div
      className="p-6 max-md:pt-16 max-md:px-4 max-md:pb-4 w-full max-w-[1200px] mx-auto box-border min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="flex items-center gap-3 text-3xl max-md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          <History size={28} className="text-[var(--color-primary)]" />
          Submission History
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-1 ml-10 max-md:ml-0">
          Review all your analyzed code submissions and reports
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20 text-[var(--text-secondary)]">Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-[var(--bg-card)] border border-dashed border-[var(--border-secondary)] rounded-xl p-12 text-center">
          <History size={40} className="text-[var(--text-tertiary)] mb-4" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No Submissions Yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">Go to the Analyzer to submit your first code!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((sub) => (
            <motion.div key={sub._id} variants={itemVariants} className="glass-panel rounded-xl overflow-hidden shadow-sm">
              {/* Header area - click to expand */}
              <div 
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                onClick={() => toggleExpand(sub._id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${sub.aiAnalysis?.isOptimal ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'}`}>
                    {sub.aiAnalysis?.isOptimal ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
                      {sub.title} 
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-secondary)] text-[var(--text-secondary)]">
                        {sub.platform}
                      </span>
                    </h3>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">
                      {new Date(sub.solvedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-sm font-mono font-bold text-[var(--text-primary)] max-sm:hidden">
                    <span className="flex items-center gap-1.5"><Clock size={16} className="text-[var(--color-info)]"/> {sub.aiAnalysis?.timeComplexity || 'N/A'}</span>
                    <span className="flex items-center gap-1.5"><Cpu size={16} className="text-[var(--color-secondary)]"/> {sub.aiAnalysis?.spaceComplexity || 'N/A'}</span>
                  </div>
                  <div className="text-[var(--text-tertiary)]">
                    {expandedId === sub._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedId === sub._id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[var(--border-primary)]"
                  >
                    <div className="p-5 grid grid-cols-[1fr_1fr] max-lg:grid-cols-1 gap-6">
                      
                      {/* Code Area */}
                      <div className="flex flex-col gap-3">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] m-0">
                          <Code2 size={16} className="text-[var(--text-tertiary)]"/> Submitted Code
                        </h4>
                        <div className="flex-1 bg-[#0d1117] border border-[var(--border-primary)] rounded-lg p-4 max-h-[300px] overflow-y-auto">
                          <pre className="text-[13px] text-[#e6edf3] font-mono whitespace-pre-wrap m-0">
                            {sub.submittedCode}
                          </pre>
                        </div>
                      </div>

                      {/* Analysis Area */}
                      <div className="flex flex-col gap-4">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] m-0">
                          <BrainCircuit size={16} className="text-[var(--color-primary)]"/> AI Report
                        </h4>
                        
                        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 max-h-[120px] overflow-y-auto border border-[var(--border-primary)]">
                          <h5 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Coach Feedback</h5>
                          <p className="text-sm text-[var(--text-primary)] leading-relaxed m-0">
                            {sub.aiAnalysis?.thinkingFeedback || 'No feedback available.'}
                          </p>
                        </div>

                        {sub.aiAnalysis?.missedObservations?.length > 0 && (
                          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 max-h-[120px] overflow-y-auto border border-[var(--border-primary)]">
                            <h5 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Missed Observations</h5>
                            <ul className="m-0 pl-5 text-sm text-[var(--text-primary)] leading-relaxed">
                              {sub.aiAnalysis.missedObservations.map((obs, i) => (
                                <li key={i}>{obs}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {sub.aiAnalysis?.alternativeApproaches?.length > 0 && (
                          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 max-h-[150px] overflow-y-auto border border-[var(--border-primary)]">
                            <h5 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Alternative Approaches</h5>
                            <div className="flex flex-col gap-3">
                              {sub.aiAnalysis.alternativeApproaches.map((alt, i) => (
                                <div key={i}>
                                  <div className="font-bold text-sm text-[var(--text-primary)]">{alt.name} <span className="font-mono font-normal text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] px-1 rounded ml-1">{alt.complexity}</span></div>
                                  <div className="text-[13px] text-[var(--text-secondary)]">{alt.note}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
