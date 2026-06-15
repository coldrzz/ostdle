import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDevelopment: (process.env.NODE_ENV ?? 'development') === 'development',
  rawgApiKey: process.env.RAWG_API_KEY ?? '',
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL ?? 'http://localhost:5001',
  dataDir: path.resolve(__dirname, '../../../data'),
  assetsDir: path.resolve(__dirname, '../../../assets'),
  audioDir: path.resolve(__dirname, '../../../assets/audio'),
  levelsFile: path.resolve(__dirname, '../../../data/levels.json'),
} as const;
