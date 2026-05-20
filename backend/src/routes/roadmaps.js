import express from 'express';
import Roadmap from '../models/Roadmap.js';
import { generateRoadmap } from '../services/geminiService.js';

const router = express.Router();

/**
 * POST /api/roadmaps/generate
 * Generate a new roadmap for a topic
 */
router.post('/generate', async (req, res) => {
  try {
    const { userId, topicName } = req.body;

    if (!topicName) {
      return res.status(400).json({ error: 'Topic name is required' });
    }

    // Generate roadmap with AI
    const sets = await generateRoadmap(topicName);

    if (!sets) {
      return res.status(500).json({ error: 'Failed to generate roadmap. Please try again.' });
    }

    const roadmapData = {
      userId: userId || null,
      topicName,
      overallProgress: 0,
      difficultySets: {
        easy: (sets.easy || []).map(p => ({ ...p, solved: false })),
        medium: (sets.medium || []).map(p => ({ ...p, solved: false })),
        hard: (sets.hard || []).map(p => ({ ...p, solved: false })),
      },
    };

    let roadmap;
    if (userId) {
      roadmap = await Roadmap.findOneAndUpdate(
        { userId, topicName },
        roadmapData,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      roadmap: roadmap || roadmapData,
    });
  } catch (error) {
    console.error('Roadmap Generate Error:', error);
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

/**
 * GET /api/roadmaps
 * Get all roadmaps for a user
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const roadmaps = userId
      ? await Roadmap.find({ userId }).sort({ updatedAt: -1 })
      : [];
    res.json(roadmaps);
  } catch (error) {
    console.error('Fetch Roadmaps Error:', error);
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

/**
 * PUT /api/roadmaps/:id/progress
 * Update progress on a roadmap problem
 */
router.put('/:id/progress', async (req, res) => {
  try {
    const { difficulty, problemIndex, solved } = req.body;
    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Update the specific problem
    if (roadmap.difficultySets[difficulty]?.[problemIndex]) {
      roadmap.difficultySets[difficulty][problemIndex].solved = solved;
    }

    // Recalculate progress
    const allProblems = [
      ...roadmap.difficultySets.easy,
      ...roadmap.difficultySets.medium,
      ...roadmap.difficultySets.hard,
    ];
    const solvedCount = allProblems.filter(p => p.solved).length;
    roadmap.overallProgress = Math.round((solvedCount / allProblems.length) * 100);

    await roadmap.save();
    res.json({ success: true, roadmap });
  } catch (error) {
    console.error('Update Progress Error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;
