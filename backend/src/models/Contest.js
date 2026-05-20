import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  platform: { type: String, enum: ['Codeforces', 'AtCoder', 'LeetCode'], required: true },
  contestId: { type: String, required: true },
  title: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  durationMinutes: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },

  problems: [{
    problemId: String,
    title: String,
    status: { type: String, enum: ['Solved', 'Unsolved', 'Attempted'], default: 'Unsolved' },
    points: { type: Number, default: 0 },
    solvedTimeMinutes: Number,
  }],

  // Post-contest analytics
  temperamentScore: { type: Number, min: 1, max: 10 },
  aiPostMortem: {
    panicDetections: { type: String, default: '' },
    speedVsAccuracy: { type: String, default: '' },
    recommendedStrategy: { type: String, default: '' },
  },

  ratingBefore: { type: Number, default: 0 },
  ratingAfter: { type: Number, default: 0 },
  ratingChange: { type: Number, default: 0 },
}, { timestamps: true });

const Contest = mongoose.model('Contest', contestSchema);
export default Contest;
