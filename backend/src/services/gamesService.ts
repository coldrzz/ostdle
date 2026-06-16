import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { GameSuggestion, GuessResponse, IgdbGame } from '../types/index.js';

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_FIELDS = 'id,name,cover.image_id,first_release_date,platforms.name,total_rating_count';
const MIN_REQUEST_INTERVAL_MS = 260;

function formatReleaseDate(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function igdbCoverUrl(imageId?: string): string | undefined {
  if (!imageId) return undefined;
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

function mapIgdbGame(game: IgdbGame): GameSuggestion {
  return {
    id: game.id,
    name: game.name,
    released: formatReleaseDate(game.first_release_date),
    coverImage: igdbCoverUrl(game.cover?.image_id),
    platforms: game.platforms?.map((p) => p.name),
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

  if (normalizedGuess.length >= 4 && normalizedTarget.includes(normalizedGuess)) return true;
  if (normalizedTarget.length >= 4 && normalizedGuess.includes(normalizedTarget)) return true;

  return false;
}

function escapeIgdbString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function tokenizeQuery(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 2);
}

/** Use a short prefix so partial words like "gala" still match "galaxy". */
function tokenToPattern(token: string): string {
  if (token.length <= 3) return token;
  return token.slice(0, 3);
}

function buildWhereSearchBody(tokens: string[]): string {
  const conditions = tokens.map(
    (token) => `name ~ *"${escapeIgdbString(tokenToPattern(token))}"*`,
  );
  return [
    `fields ${IGDB_FIELDS};`,
    `where ${conditions.join(' & ')};`,
    'sort total_rating_count desc;',
    'limit 10;',
  ].join(' ');
}

function buildTextSearchBody(query: string): string {
  return [
    `search "${escapeIgdbString(query)}";`,
    `fields ${IGDB_FIELDS};`,
    'limit 10;',
  ].join(' ');
}

function dedupeGames(games: IgdbGame[]): IgdbGame[] {
  const seen = new Set<number>();
  return games.filter((game) => {
    if (seen.has(game.id)) return false;
    seen.add(game.id);
    return true;
  });
}

export class GamesService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private lastRequestAt = 0;

  private get clientId(): string {
    if (!config.igdbClientId) {
      throw new AppError(
        503,
        'IGDB client ID is not configured. Set IGDB_CLIENT_ID in environment.',
        'Service Unavailable',
      );
    }
    return config.igdbClientId;
  }

  private get clientSecret(): string {
    if (!config.igdbClientSecret) {
      throw new AppError(
        503,
        'IGDB client secret is not configured. Set IGDB_CLIENT_SECRET in environment.',
        'Service Unavailable',
      );
    }
    return config.igdbClientSecret;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const wait = MIN_REQUEST_INTERVAL_MS - (now - this.lastRequestAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastRequestAt = Date.now();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
    });

    const response = await fetch(TWITCH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new AppError(502, 'Failed to obtain IGDB access token', 'Bad Gateway');
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  private async igdbQuery<T>(endpoint: string, body: string, retry = true): Promise<T[]> {
    await this.throttle();

    const token = await this.getAccessToken();
    const response = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': this.clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    if (response.status === 401 && retry) {
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      return this.igdbQuery<T>(endpoint, body, false);
    }

    if (!response.ok) {
      throw new AppError(502, 'Failed to fetch games from IGDB API', 'Bad Gateway');
    }

    return (await response.json()) as T[];
  }

  async searchGames(query: string): Promise<GameSuggestion[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const tokens = tokenizeQuery(trimmed);
    let results: IgdbGame[] = [];

    if (tokens.length > 0) {
      results = await this.igdbQuery<IgdbGame>('games', buildWhereSearchBody(tokens));
    }

    if (results.length === 0) {
      results = await this.igdbQuery<IgdbGame>('games', buildTextSearchBody(trimmed));
    }

    return dedupeGames(results).map(mapIgdbGame);
  }

  async getGameById(id: number): Promise<GameSuggestion | null> {
    const body = `fields ${IGDB_FIELDS}; where id = ${id}; limit 1;`;
    const results = await this.igdbQuery<IgdbGame>('games', body);
    const game = results[0];
    return game ? mapIgdbGame(game) : null;
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
