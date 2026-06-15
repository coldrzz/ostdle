import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { levelsService } from './levelsService.js';
import type {
  GenerateLevelRequest,
  GenerateLevelResponse,
  YouTubeSearchResult,
  YouTubeVideoInfo,
} from '../types/index.js';

export class AdminService {
  private async fetchPython<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${config.pythonServiceUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
    } catch {
      throw new AppError(
        503,
        'Python media service is unavailable. Ensure it is running on port 5001.',
        'Service Unavailable',
      );
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as { message?: string };
      throw new AppError(
        response.status,
        errorBody.message ?? 'Python media service error',
        'Media Service Error',
      );
    }

    return response.json() as Promise<T>;
  }

  async searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
    return this.fetchPython<YouTubeSearchResult[]>('/api/youtube/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    return this.fetchPython<YouTubeVideoInfo>('/api/youtube/info', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async generateLevel(dto: GenerateLevelRequest): Promise<GenerateLevelResponse> {
    const result = await this.fetchPython<{ audioFile: string }>('/api/audio/extract', {
      method: 'POST',
      body: JSON.stringify({
        videoUrl: dto.videoUrl,
        startTime: dto.startTime,
        endTime: dto.endTime,
      }),
    });

    const level = await levelsService.createLevel({
      gameTitle: dto.gameTitle,
      gameId: dto.gameId,
      coverImage: dto.coverImage,
      audioFile: result.audioFile,
    });

    return { level, audioFile: result.audioFile };
  }

  getStreamUrl(videoUrl: string): string {
    const encoded = encodeURIComponent(videoUrl);
    return `${config.pythonServiceUrl}/api/youtube/stream?url=${encoded}`;
  }
}

export const adminService = new AdminService();
