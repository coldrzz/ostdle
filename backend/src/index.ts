import path from 'node:path';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import gamesRoutes from './routes/gamesRoutes.js';
import levelsRoutes from './routes/levelsRoutes.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve audio files
app.use('/assets/audio', express.static(config.audioDir));

// API routes
app.use('/api/levels', levelsRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[Backend] Server running on http://localhost:${config.port}`);
  console.log(`[Backend] Environment: ${config.nodeEnv}`);
  if (!config.rawgApiKey) {
    console.warn('[Backend] WARNING: RAWG_API_KEY is not set');
  }
});
