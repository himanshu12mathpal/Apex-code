import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  platform: { type: String, enum: ['LeetCode', 'Codeforces', 'AtCoder', 'Manual'], required: true },
  problemId: { type: String, required: true },
  problemUrl: { type: String, default: '' },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  tags: [{ type: String }],
  submittedCode: { type: String, required: true },
  language: { type: String, default: 'cpp' },
  starred: { type: Boolean, default: false },

  // User's self-reflection
  userNotes: {
    intuition: { type: String, default: '' },
    approach: { type: String, default: '' },
    mistakes: { type: String, default: '' },
    edgeCases: { type: String, default: '' },
    observations: { type: String, default: '' },
  },

  // AI Analysis
  aiAnalysis: {
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    isOptimal: { type: Boolean, default: false },
    optimizations: { type: String, default: '' },
    patternDetected: { type: String, default: '' },
    missedObservations: [{ type: String }],
    thinkingFeedback: { type: String, default: '' },
    alternativeApproaches: [{
      name: String,
      complexity: String,
      note: String,
    }],
    similarProblems: [{
      title: String,
      url: String,
      difficulty: String,
    }],
    weaknessDetected: { type: String, default: '' },
  },

  xpEarned: { type: Number, default: 0 },
  solvedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for unique problems per user
problemSchema.index({ userId: 1, platform: 1, problemId: 1 }, { unique: true });

const Problem = mongoose.model('Problem', problemSchema);
export default Problem;
