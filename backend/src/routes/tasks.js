import express from 'express';
import Task from '../models/Task.js';
import { authMiddleware } from '../utils/jwt.js';

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

/**
 * POST /api/tasks
 * Create a new daily task
 */
router.post('/', async (req, res) => {
  try {
    const { text, type, date } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const task = await Task.create({
      userId: req.userId,
      text: text.trim(),
      type: type || 'topic',
      date: date || new Date().toISOString().split('T')[0],
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * GET /api/tasks
 * Get user's tasks, optionally filtered by date
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { userId: req.userId };

    if (date) {
      filter.date = date;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/tasks/weekly
 * Get task completion data for the past 7 days
 */
router.get('/weekly', async (req, res) => {
  try {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = await Task.find({ userId: req.userId, date: dateStr });
      const completed = dayTasks.filter(t => t.completed).length;

      days.push({
        day: dayNames[d.getDay()],
        date: dateStr,
        tasks: completed,
        total: dayTasks.length,
      });
    }

    res.json(days);
  } catch (error) {
    console.error('Weekly Tasks Error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly tasks' });
  }
});

/**
 * PUT /api/tasks/:id
 * Toggle task completion
 */
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.completed = !task.completed;
    await task.save();

    res.json(task);
  } catch (error) {
    console.error('Toggle Task Error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
