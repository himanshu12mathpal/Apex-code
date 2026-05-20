import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, authMiddleware } from '../utils/jwt.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, codeforcesHandle, leetcodeUsername, atcoderHandle } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} already exists` });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      codeforcesHandle: codeforcesHandle || '',
      leetcodeUsername: leetcodeUsername || '',
      atcoderHandle: atcoderHandle || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streakCount: user.streakCount,
        codeforcesHandle: user.codeforcesHandle,
        leetcodeUsername: user.leetcodeUsername,
        atcoderHandle: user.atcoderHandle,
        codeforcesRating: user.codeforcesRating,
        totalProblemsSolved: user.totalProblemsSolved,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with email/username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email },
      ],
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streakCount: user.streakCount,
        codeforcesHandle: user.codeforcesHandle,
        codeforcesRating: user.codeforcesRating,
        totalProblemsSolved: user.totalProblemsSolved,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      xp: user.xp,
      level: user.level,
      streakCount: user.streakCount,
      longestStreak: user.longestStreak,
      consistencyScore: user.consistencyScore,
      codeforcesHandle: user.codeforcesHandle,
      codeforcesRating: user.codeforcesRating,
      leetcodeUsername: user.leetcodeUsername,
      atcoderHandle: user.atcoderHandle,
      virtualRating: user.virtualRating,
      totalProblemsSolved: user.totalProblemsSolved,
      theme: user.theme,
      roastMode: user.roastMode,
      notifications: user.notifications,
      dailySolvedTarget: user.dailySolvedTarget,
      badges: user.badges,
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/auth/me
 * Update current user settings (requires auth)
 */
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['username', 'codeforcesHandle', 'leetcodeUsername', 'atcoderHandle',
                     'theme', 'roastMode', 'notifications', 'dailySolvedTarget'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        let value = req.body[key];
        // Clean handles if they are URLs
        if (['codeforcesHandle', 'leetcodeUsername', 'atcoderHandle'].includes(key) && typeof value === 'string') {
          if (value.includes('codeforces.com/profile/')) value = value.split('/profile/')[1].replace('/', '');
          else if (value.includes('leetcode.com/u/')) value = value.split('/u/')[1].replace('/', '');
          else if (value.includes('leetcode.com/')) value = value.split('.com/')[1].replace('/', '');
          else if (value.includes('atcoder.jp/users/')) value = value.split('/users/')[1].replace('/', '');
          value = value.trim();
        }
        updates[key] = value;
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (error) {
    console.error('Update Me Error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
