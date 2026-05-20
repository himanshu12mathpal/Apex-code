import express from 'express';
import fs from 'fs';
import path from 'path';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { analyzeCode } from '../services/geminiService.js';
import { authMiddleware } from '../utils/jwt.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * POST /api/analyzer/export-local
 * Pushes analysis to a local CSV file on the user's system
 */
router.post('/export-local', async (req, res) => {
  try {
    const { title, platform, difficulty, analysis } = req.body;
    
    // Save to the project root directory
    const filePath = path.join(process.cwd(), '..', 'ApexCode_Analysis_Reports.csv');
    
    const fileExists = fs.existsSync(filePath);
    
    const missedObservations = analysis.missedObservations && analysis.missedObservations.length > 0 
      ? analysis.missedObservations.join(' | ') 
      : 'None';
      
    const alternativeApproaches = analysis.alternativeApproaches && analysis.alternativeApproaches.length > 0 
      ? analysis.alternativeApproaches.map(a => `${a.name} (${a.complexity}): ${a.note}`).join(' | ') 
      : 'None';

    let csvContent = '';
    
    if (!fileExists) {
      csvContent += 'Date,Problem Title,Platform,Difficulty,Time Complexity,Space Complexity,Is Optimal,Pattern Detected,Missed Observations,Coach Feedback,Alternative Approaches\n';
    }

    const row = [
      `"${new Date().toLocaleDateString()}"`,
      `"${(title || '').replace(/"/g, '""')}"`,
      `"${platform || ''}"`,
      `"${difficulty || 'Medium'}"`,
      `"${(analysis.timeComplexity || '').replace(/"/g, '""')}"`,
      `"${(analysis.spaceComplexity || '').replace(/"/g, '""')}"`,
      `"${analysis.isOptimal ? 'Yes' : 'No'}"`,
      `"${(analysis.patternDetected || 'None').replace(/"/g, '""')}"`,
      `"${missedObservations.replace(/"/g, '""')}"`,
      `"${(analysis.thinkingFeedback || '').replace(/"/g, '""')}"`,
      `"${alternativeApproaches.replace(/"/g, '""')}"`
    ].join(',');

    csvContent += row + '\n';
    
    fs.appendFileSync(filePath, csvContent, 'utf8');
    
    res.json({ success: true, message: 'Appended to local Excel sheet!', filePath });
  } catch (error) {
    console.error('Export Local Error:', error);
    res.status(500).json({ error: 'Failed to push to local Excel sheet' });
  }
});

/**
 * POST /api/analyzer/analyze
 * Analyze a submitted solution with AI
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      platform, problemId, problemUrl, title,
      difficulty, tags, code, language, userNotes,
    } = req.body;
    const userId = req.userId;

    if (!title || !code || !platform) {
      return res.status(400).json({ error: 'Title, code, and platform are required' });
    }

    // Call Gemini AI for analysis
    const aiAnalysis = await analyzeCode({
      title,
      platform,
      code,
      language: language || 'cpp',
      userNotes,
    });

    // Calculate XP earned
    const baseXP = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 50 : 80;
    const reflectionBonus = (userNotes?.intuition || userNotes?.approach) ? 10 : 0;
    const xpEarned = baseXP + reflectionBonus;

    // Save problem to database
    let problem;
    if (userId) {
      problem = await Problem.findOneAndUpdate(
        { userId, platform, problemId: problemId || title },
        {
          userId,
          platform,
          problemId: problemId || title,
          problemUrl,
          title,
          difficulty: difficulty || 'Medium',
          tags: tags || [],
          submittedCode: code,
          language: language || 'cpp',
          userNotes: {
            intuition: userNotes?.intuition || '',
            approach: userNotes?.approach || '',
            mistakes: userNotes?.mistakes || '',
            edgeCases: userNotes?.edgeCases || '',
          },
          aiAnalysis: {
            timeComplexity: aiAnalysis.timeComplexity,
            spaceComplexity: aiAnalysis.spaceComplexity,
            isOptimal: aiAnalysis.isOptimal,
            optimizations: aiAnalysis.optimizations,
            patternDetected: aiAnalysis.patternDetected,
            missedObservations: aiAnalysis.missedObservations,
            thinkingFeedback: aiAnalysis.thinkingFeedback,
            alternativeApproaches: aiAnalysis.alternativeApproaches,
            similarProblems: aiAnalysis.similarProblems,
            weaknessDetected: aiAnalysis.weaknessDetected,
          },
          xpEarned,
          solvedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Update user XP
      await User.findByIdAndUpdate(userId, {
        $inc: { xp: xpEarned },
        lastActiveDate: new Date(),
      });
    }

    res.json({
      success: true,
      analysis: aiAnalysis,
      xpEarned,
      problemId: problem?._id,
    });
  } catch (error) {
    console.error('Analyzer Error:', error);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

/**
 * GET /api/analyzer/problems
 * Get all solved problems for a user
 */
router.get('/problems', async (req, res) => {
  try {
    const { platform, difficulty, search } = req.query;
    const filter = { userId: req.userId };

    if (platform && platform !== 'all') filter.platform = platform;
    if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { 'aiAnalysis.patternDetected': { $regex: search, $options: 'i' } },
      ];
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const problems = await Problem.find(filter).sort({ solvedAt: -1 }).limit(limit);
    res.json(problems);
  } catch (error) {
    console.error('Fetch Problems Error:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

export default router;
