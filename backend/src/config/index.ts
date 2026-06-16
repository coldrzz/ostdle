import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env before reading process.env (backend/.env takes priority over root .env)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDevelopment: (process.env.NODE_ENV ?? 'development') === 'development',
  igdbClientId: process.env.IGDB_CLIENT_ID ?? '',
  igdbClientSecret: process.env.IGDB_CLIENT_SECRET ?? '',
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL ?? 'http://localhost:5001',
  dataDir: path.resolve(__dirname, '../../../data'),
  assetsDir: path.resolve(__dirname, '../../../assets'),
  audioDir: path.resolve(__dirname, '../../../assets/audio'),
  levelsFile: path.resolve(__dirname, '../../../data/levels.json'),
} as const;
