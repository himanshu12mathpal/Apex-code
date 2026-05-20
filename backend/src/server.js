import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import analyzerRoutes from './routes/analyzer.js';
import dashboardRoutes from './routes/dashboard.js';
import roadmapRoutes from './routes/roadmaps.js';
import taskRoutes from './routes/tasks.js';
import contestRoutes from './routes/contests.js';
import ratingRoutes from './routes/rating.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow configured origins and any Vercel deployment
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ApexCode API is running 🚀' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analyzer', analyzerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/rating', ratingRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n⚡ ApexCode API running on http://localhost:${PORT}\n`);
});
