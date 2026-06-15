/** Shared level definition persisted in levels.json */
export interface Level {
  id: string;
  gameTitle: string;
  gameId?: string;
  coverImage?: string;
  audioFile: string;
}

export interface CreateLevelDto {
  gameTitle: string;
  gameId?: string;
  coverImage?: string;
  audioFile: string;
}

export interface UpdateLevelDto {
  gameTitle?: string;
  gameId?: string;
  coverImage?: string;
  audioFile?: string;
}

export interface ReorderLevelsDto {
  orderedIds: string[];
}

export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  released?: string;
  background_image?: string | null;
  platforms?: Array<{ platform: { id: number; name: string; slug: string } }>;
}

export interface RawgSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
}

export interface GameSuggestion {
  id: number;
  name: string;
  released?: string;
  coverImage?: string;
  platforms?: string[];
}

export interface GuessRequest {
  levelId: string;
  guess: string;
  gameId?: number;
}

export interface GuessResponse {
  correct: boolean;
  gameTitle?: string;
  coverImage?: string;
  released?: string;
  platforms?: string[];
}

export interface GameState {
  levelId: string;
  attempts: number;
  skips: number;
  clipDuration: number;
  livesRemaining: number;
  status: 'playing' | 'won' | 'lost';
  revealedAnswer?: boolean;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  url: string;
}

export interface YouTubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  duration?: number;
  url: string;
}

export interface GenerateLevelRequest {
  videoUrl: string;
  startTime: number;
  endTime: number;
  gameTitle: string;
  gameId?: string;
  coverImage?: string;
}

export interface GenerateLevelResponse {
  level: Level;
  audioFile: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface DailyLevelResponse {
  level: Level;
  levelNumber: number;
  date: string;
}

export interface DetectGameRequest {
  videoTitle: string;
}

export interface DetectGameResponse {
  suggestions: GameSuggestion[];
  cleanedTitle: string;
}
