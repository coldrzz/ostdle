import { checkGuess } from '@/lib/guess';
import type { GameSuggestion, GuessResponse } from '@/types';
import { getLevelById } from './levelsData';

export class GameNotFoundError extends Error {
  constructor(message = 'Level not found') {
    super(message);
    this.name = 'GameNotFoundError';
  }
}

/** Static deploy: no IGDB — free-text guessing only. */
export const gamesApi = {
  search: async (_query: string): Promise<GameSuggestion[]> => [],

  getById: async (_id: number): Promise<GameSuggestion | null> => null,

  guess: async (levelId: string, guess: string, gameId?: number): Promise<GuessResponse> => {
    const level = await getLevelById(levelId);
    if (!level) throw new GameNotFoundError();
    return checkGuess(guess, level, gameId);
  },
};
