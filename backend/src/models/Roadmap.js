import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topicName: { type: String, required: true },
  overallProgress: { type: Number, default: 0, min: 0, max: 100 },

  difficultySets: {
    easy: [{
      title: String,
      problemId: String,
      platform: { type: String, default: 'LeetCode' },
      solved: { type: Boolean, default: false },
      hint: String,
    }],
    medium: [{
      title: String,
      problemId: String,
      platform: { type: String, default: 'LeetCode' },
      solved: { type: Boolean, default: false },
      hint: String,
    }],
    hard: [{
      title: String,
      problemId: String,
      platform: { type: String, default: 'LeetCode' },
      solved: { type: Boolean, default: false },
      hint: String,
    }],
  },

  revisionSchedule: { type: Date },
}, { timestamps: true });

// One roadmap per topic per user
roadmapSchema.index({ userId: 1, topicName: 1 }, { unique: true });

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;
