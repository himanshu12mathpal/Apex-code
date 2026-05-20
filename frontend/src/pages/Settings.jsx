import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon, User, Globe, Bell,
  Shield, Key, Save, Moon, Sun, Loader2
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    codeforcesHandle: user?.codeforcesHandle || '',
    leetcodeUsername: user?.leetcodeUsername || '',
    atcoderHandle: user?.atcoderHandle || '',
    dailySolvedTarget: user?.dailySolvedTarget || 2,
    roastMode: user?.roastMode || false,
    notifications: user?.notifications || true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(formData);
      toast.success('Settings saved successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="p-6 max-md:pt-16 max-md:px-4 max-md:pb-4 w-full max-w-[900px] mx-auto box-border"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="mb-8 flex justify-between items-end max-md:flex-col max-md:items-start max-md:gap-4" variants={itemVariants}>
        <div>
          <h1 className="flex items-center gap-3 text-3xl max-md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            <SettingsIcon size={28} className="text-[var(--color-primary)]" />
            Account Settings
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-1 ml-10 max-md:ml-0">
            Manage your profile, platform handles, and preferences.
          </p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-secondary)] text-[var(--text-primary)] font-bold text-sm rounded-lg shadow-sm hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-secondary)] text-[var(--text-secondary)] font-bold text-sm rounded-lg shadow-sm hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white font-bold text-sm rounded-lg shadow-md hover:bg-[var(--color-primary-hover)] transition-all border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col gap-6">
        {/* Profile Card */}
        <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-6" variants={itemVariants}>
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border-primary)]">
            <User size={18} className="text-[var(--text-tertiary)]" /> Profile Information
          </h2>
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Email Address</label>
              <input type="text" value={user?.email || ''} disabled className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-secondary)] opacity-70 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} disabled={!isEditing} className={`w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Daily Problem Target</label>
              <input type="number" name="dailySolvedTarget" value={formData.dailySolvedTarget} onChange={handleChange} min="1" max="20" disabled={!isEditing} className={`w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`} />
            </div>
          </div>
        </motion.div>

        {/* Platform Handles */}
        <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-6" variants={itemVariants}>
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border-primary)]">
            <Globe size={18} className="text-[var(--text-tertiary)]" /> Platform Integration
          </h2>
          <div className="grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#1890FF] uppercase tracking-wider mb-2">Codeforces Handle</label>
              <input type="text" name="codeforcesHandle" value={formData.codeforcesHandle} onChange={handleChange} disabled={!isEditing} placeholder="e.g. tourist" className={`w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#1890FF] transition-all ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`} />
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">For real rating & virtual contests.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#FFA116] uppercase tracking-wider mb-2">LeetCode Username</label>
              <input type="text" name="leetcodeUsername" value={formData.leetcodeUsername} onChange={handleChange} disabled={!isEditing} placeholder="e.g. neetcode" className={`w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#FFA116] transition-all ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#00C78B] uppercase tracking-wider mb-2">AtCoder Handle</label>
              <input type="text" name="atcoderHandle" value={formData.atcoderHandle} onChange={handleChange} disabled={!isEditing} placeholder="e.g. chokudai" className={`w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#00C78B] transition-all ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`} />
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div className="glass-panel rounded-xl shadow-[var(--shadow-sm)] p-6" variants={itemVariants}>
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)] mb-5 pb-3 border-b border-[var(--border-primary)]">
            <Shield size={18} className="text-[var(--text-tertiary)]" /> Preferences
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] m-0 mb-1 flex items-center gap-2">Theme</h4>
                <p className="text-xs text-[var(--text-secondary)] m-0">Toggle between light and dark mode.</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-md text-sm font-bold text-[var(--text-primary)] cursor-pointer"
              >
                {theme === 'dark' ? <><Sun size={14}/> Light</> : <><Moon size={14}/> Dark</>}
              </button>
            </div>

            <label className={`flex items-center justify-between p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg ${isEditing ? 'cursor-pointer hover:border-[var(--border-hover)]' : 'cursor-not-allowed opacity-70'} transition-all`}>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-warning)] m-0 mb-1 flex items-center gap-2">AI Roast Mode</h4>
                <p className="text-xs text-[var(--text-secondary)] m-0">The AI Analyzer will be brutally honest about your code.</p>
              </div>
              <div className="relative inline-block w-10 h-6">
                <input type="checkbox" name="roastMode" checked={formData.roastMode} onChange={handleChange} disabled={!isEditing} className="peer opacity-0 w-0 h-0" />
                <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--border-secondary)] rounded-full transition-all peer-checked:bg-[var(--color-warning)] before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all peer-checked:before:translate-x-4"></span>
              </div>
            </label>

            <label className={`flex items-center justify-between p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg ${isEditing ? 'cursor-pointer hover:border-[var(--border-hover)]' : 'cursor-not-allowed opacity-70'} transition-all`}>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] m-0 mb-1 flex items-center gap-2"><Bell size={14}/> Notifications</h4>
                <p className="text-xs text-[var(--text-secondary)] m-0">Receive alerts for upcoming contests and daily goals.</p>
              </div>
              <div className="relative inline-block w-10 h-6">
                <input type="checkbox" name="notifications" checked={formData.notifications} onChange={handleChange} disabled={!isEditing} className="peer opacity-0 w-0 h-0" />
                <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--border-secondary)] rounded-full transition-all peer-checked:bg-[var(--color-primary)] before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all peer-checked:before:translate-x-4"></span>
              </div>
            </label>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
