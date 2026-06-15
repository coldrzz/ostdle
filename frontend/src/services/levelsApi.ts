import { api } from './api';
import type { DailyLevelResponse, Level } from '@/types';

export const levelsApi = {
  getAll: () => api.get<Level[]>('/levels'),
  getById: (id: string) => api.get<Level>(`/levels/${id}`),
  getDaily: () => api.get<DailyLevelResponse>('/levels/daily'),
  getByNumber: (number: number) =>
    api.get<{ level: Level; levelNumber: number }>(`/levels/number/${number}`),
  create: (data: Omit<Level, 'id'>) => api.post<Level>('/levels', data),
  update: (id: string, data: Partial<Level>) => api.put<Level>(`/levels/${id}`, data),
  delete: (id: string) => api.delete(`/levels/${id}`),
  reorder: (orderedIds: string[]) => api.put<Level[]>('/levels/reorder/all', { orderedIds }),
};
