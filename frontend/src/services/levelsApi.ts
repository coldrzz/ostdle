import type { DailyLevelResponse, Level } from '@/types';
import {
  getAllLevels,
  getDailyLevel,
  getLevelById,
  getLevelByNumber,
} from './levelsData';

export class LevelNotFoundError extends Error {
  constructor(message = 'Level not found') {
    super(message);
    this.name = 'LevelNotFoundError';
  }
}

export const levelsApi = {
  getAll: () => getAllLevels(),

  getById: async (id: string) => {
    const level = await getLevelById(id);
    if (!level) throw new LevelNotFoundError();
    return level;
  },

  getDaily: async () => {
    const daily = await getDailyLevel();
    if (!daily) throw new LevelNotFoundError('Daily level not found');
    return daily;
  },

  getByNumber: async (number: number) => {
    const result = await getLevelByNumber(number);
    if (!result) throw new LevelNotFoundError();
    return result;
  },
};

export type { DailyLevelResponse, Level };
