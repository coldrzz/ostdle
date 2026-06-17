export interface Level {
  id: string;
  gameTitle: string;
  gameId?: string;
  coverImage?: string;
  audioFile: string;
}

export interface GameSuggestion {
  id: number;
  name: string;
  released?: string;
  coverImage?: string;
  platforms?: string[];
}

export interface DailyLevelResponse {
  level: Level;
  levelNumber: number;
  date: string;
}

export interface GuessResponse {
  correct: boolean;
  gameTitle?: string;
  coverImage?: string;
  released?: string;
  platforms?: string[];
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  url: string;
  embedUrl?: string;
}

export interface YouTubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  duration?: number;
  url: string;
}

export interface DetectGameResponse {
  suggestions: GameSuggestion[];
  cleanedTitle: string;
}

export interface GenerateLevelRequest {
  videoUrl: string;
  startTime: number;
  endTime: number;
  gameTitle: string;
  gameId?: string;
  coverImage?: string;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameSession {
  levelId: string;
  attempts: number;
  wrongGuesses: number;
  skips: number;
  wrongGuessHistory: string[];
  clipDuration: number;
  livesRemaining: number;
  status: GameStatus;
  revealedAnswer: boolean;
}

export const INITIAL_LIVES = 5;
export const CLIP_DURATIONS = [1, 2, 4, 7, 10] as const;
export const LEVEL_AUDIO_DURATION = 10;

export function getClipDurationForLives(livesRemaining: number): number {
  const livesLost = INITIAL_LIVES - livesRemaining;
  const index = Math.min(Math.max(livesLost, 0), CLIP_DURATIONS.length - 1);
  return CLIP_DURATIONS[index];
}
