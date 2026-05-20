import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['topic', 'revision', 'upsolve', 'contest'],
    default: 'topic',
  },
  completed: { type: Boolean, default: false },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD format
}, { timestamps: true });

// Compound index for fast user+date queries
taskSchema.index({ userId: 1, date: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
