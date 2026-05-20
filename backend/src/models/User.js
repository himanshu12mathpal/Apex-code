import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, default: null },

  // Gamification
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streakCount: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },
  consistencyScore: { type: Number, default: 100, min: 0, max: 100 },
  dailySolvedTarget: { type: Number, default: 2 },

  // Codeforces Integration
  codeforcesHandle: { type: String, default: '' },
  codeforcesRating: { type: Number, default: 0 },
  virtualRating: { type: Number, default: 0 },
  totalProblemsSolved: { type: Number, default: 0 },

  // Profiles
  leetcodeUsername: { type: String, default: '' },
  atcoderHandle: { type: String, default: '' },

  // Preferences
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
  roastMode: { type: Boolean, default: false },
  notifications: { type: Boolean, default: true },

  // Registered Contests (for reminders)
  registeredContests: [{
    contestId: String,
    contestName: String,
    startTimeSeconds: Number,
    platform: { type: String, default: 'Codeforces' },
    url: { type: String, default: '' },
    registeredAt: { type: Date, default: Date.now },
  }],

  // Achievements
  badges: [{
    name: String,
    icon: String,
    description: String,
    unlockedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// XP to Level calculation
userSchema.methods.calculateLevel = function () {
  this.level = Math.floor(this.xp / 250) + 1;
  return this.level;
};

const User = mongoose.model('User', userSchema);
export default User;
