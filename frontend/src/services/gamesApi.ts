import { api } from './api';
import type { DetectGameResponse, GameSuggestion, GuessResponse } from '@/types';

export const gamesApi = {
  search: (query: string) =>
    api.get<GameSuggestion[]>(`/games/search?q=${encodeURIComponent(query)}`),
  getById: (id: number) => api.get<GameSuggestion>(`/games/${id}`),
  guess: (levelId: string, guess: string, gameId?: number) =>
    api.post<GuessResponse>('/games/guess', { levelId, guess, gameId }),
  detectFromTitle: (videoTitle: string) =>
    api.post<DetectGameResponse>('/games/detect', { videoTitle }),
};
