import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { GameSuggestion, GuessResponse, RawgGame, RawgSearchResponse } from '../types/index.js';

const RAWG_BASE_URL = 'https://api.rawg.io/api';

function mapRawgGame(game: RawgGame): GameSuggestion {
  return {
    id: game.id,
    name: game.name,
    released: game.released,
    coverImage: game.background_image ?? undefined,
    platforms: game.platforms?.map((p) => p.platform.name),
  };
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function compareGames(guess: string, target: string): boolean {
  const normalizedGuess = normalizeString(guess);
  const normalizedTarget = normalizeString(target);

  if (normalizedGuess === normalizedTarget) return true;

  // Allow partial match if guess is substantial
  if (normalizedGuess.length >= 4 && normalizedTarget.includes(normalizedGuess)) return true;
  if (normalizedTarget.length >= 4 && normalizedGuess.includes(normalizedTarget)) return true;

  return false;
}

export class GamesService {
  private get apiKey(): string {
    if (!config.rawgApiKey) {
      throw new AppError(
        503,
        'RAWG API key is not configured. Set RAWG_API_KEY in environment.',
        'Service Unavailable',
      );
    }
    return config.rawgApiKey;
  }

  async searchGames(query: string): Promise<GameSuggestion[]> {
    if (!query.trim()) return [];

    const url = new URL(`${RAWG_BASE_URL}/games`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('search', query.trim());
    url.searchParams.set('page_size', '10');
    url.searchParams.set('search_precise', 'true');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new AppError(502, 'Failed to fetch games from RAWG API', 'Bad Gateway');
    }

    const data = (await response.json()) as RawgSearchResponse;
    return data.results.map(mapRawgGame);
  }

  async getGameById(id: number): Promise<GameSuggestion | null> {
    const url = new URL(`${RAWG_BASE_URL}/games/${id}`);
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new AppError(502, 'Failed to fetch game from RAWG API', 'Bad Gateway');
    }

    const data = (await response.json()) as RawgGame;
    return mapRawgGame(data);
  }

  async checkGuess(
    guess: string,
    targetTitle: string,
    gameId?: number,
    targetGameId?: string,
  ): Promise<GuessResponse> {
    let correct = false;

    if (gameId && targetGameId && String(gameId) === targetGameId) {
      correct = true;
    } else {
      correct = compareGames(guess, targetTitle);
    }

    if (correct) {
      let gameInfo: GameSuggestion | null = null;
      if (targetGameId) {
        gameInfo = await this.getGameById(parseInt(targetGameId, 10));
      }
      if (!gameInfo) {
        const results = await this.searchGames(targetTitle);
        gameInfo = results[0] ?? null;
      }

      return {
        correct: true,
        gameTitle: gameInfo?.name ?? targetTitle,
        coverImage: gameInfo?.coverImage,
        released: gameInfo?.released,
        platforms: gameInfo?.platforms,
      };
    }

    return { correct: false };
  }

  cleanVideoTitle(title: string): string {
    return title
      .replace(/\s*[\[\(].*?[\]\)]\s*/g, ' ')
      .replace(/\b(OST|Soundtrack|Original|Theme|Music|BGM|Extended|Full|HQ|HD|4K|Official)\b/gi, '')
      .replace(/\s*[-–—|]\s*.+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async detectGameFromTitle(videoTitle: string): Promise<{ suggestions: GameSuggestion[]; cleanedTitle: string }> {
    const cleanedTitle = this.cleanVideoTitle(videoTitle);
    const suggestions = await this.searchGames(cleanedTitle);
    return { suggestions, cleanedTitle };
  }
}

export const gamesService = new GamesService();
