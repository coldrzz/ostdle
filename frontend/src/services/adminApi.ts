import { api } from './api';
import type {
  DetectGameResponse,
  GenerateLevelRequest,
  Level,
  YouTubeSearchResult,
  YouTubeVideoInfo,
} from '@/types';

export const adminApi = {
  searchYouTube: (query: string) =>
    api.post<YouTubeSearchResult[]>('/admin/youtube/search', { query }),
  getVideoInfo: (url: string) =>
    api.post<YouTubeVideoInfo>('/admin/youtube/info', { url }),
  getStreamUrl: (url: string) =>
    api.get<{ streamUrl: string }>(`/admin/youtube/stream-url?url=${encodeURIComponent(url)}`),
  generateLevel: (data: GenerateLevelRequest) =>
    api.post<{ level: Level; audioFile: string }>('/admin/levels/generate', data),
  detectGame: (videoTitle: string) =>
    api.post<DetectGameResponse>('/admin/games/detect', { videoTitle }),
};
