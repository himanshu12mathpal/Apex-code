import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [atcoderHandle, setAtcoderHandle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto redirect if user is logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({ username, email, password, codeforcesHandle, leetcodeUsername, atcoderHandle });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--color-brand)] opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--color-secondary)] opacity-[0.04] blur-[120px]" />
      </div>

      <motion.div
        className="w-full max-w-[420px] relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-secondary)] shadow-lg"
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Zap size={28} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            ApexCode
          </h1>
          <p className="text-sm mt-2 text-[var(--text-secondary)] font-medium">
            {isRegister ? 'Create your account to start grinding' : 'Welcome back, warrior'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username (register only) */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                >
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[var(--text-tertiary)]">
                    Username
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      required={isRegister}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-light)] transition-all"
                    />
                  </div>

                  <div className="mt-4 flex flex-col gap-4 border-t border-[var(--border-primary)] pt-4">
                    <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">Platform Handles (Optional)</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="relative">
                        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1890FF]" />
                        <input
                          type="text"
                          value={codeforcesHandle}
                          onChange={e => setCodeforcesHandle(e.target.value)}
                          placeholder="Codeforces"
                          className="w-full pl-8 pr-2 py-2 rounded-lg text-xs font-medium bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#1890FF] transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FFA116]" />
                        <input
                          type="text"
                          value={leetcodeUsername}
                          onChange={e => setLeetcodeUsername(e.target.value)}
                          placeholder="LeetCode"
                          className="w-full pl-8 pr-2 py-2 rounded-lg text-xs font-medium bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#FFA116] transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00C78B]" />
                        <input
                          type="text"
                          value={atcoderHandle}
                          onChange={e => setAtcoderHandle(e.target.value)}
                          placeholder="AtCoder"
                          className="w-full pl-8 pr-2 py-2 rounded-lg text-xs font-medium bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#00C78B] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[var(--text-tertiary)]">
                Email or Username
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-light)] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[var(--text-tertiary)]">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-light)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] transition-colors bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-sm py-2.5 px-3.5 rounded-lg font-bold bg-[var(--color-danger-light)] text-[var(--color-danger)] border border-[var(--color-danger)]/20"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-secondary)] shadow-lg shadow-[var(--color-brand)]/25 hover:shadow-[var(--color-brand)]/40 transition-shadow disabled:opacity-70 disabled:cursor-not-allowed mt-2 border-none cursor-pointer"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Zap size={16} />
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-6 pt-5 border-t border-[var(--border-primary)]">
            <span className="text-sm font-medium text-[var(--text-tertiary)]">
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors bg-transparent border-none cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
