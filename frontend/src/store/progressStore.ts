import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LevelOutcome = 'won' | 'lost';

export interface LevelProgress {
  outcome: LevelOutcome;
  solvedAt: number;
}

interface ProgressStore {
  solved: Record<string, LevelProgress>;
  markSolved: (levelId: string, outcome: LevelOutcome) => void;
  getProgress: (levelId: string) => LevelProgress | undefined;
  isSolved: (levelId: string) => boolean;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      solved: {},

      markSolved: (levelId, outcome) => {
        set((state) => ({
          solved: {
            ...state.solved,
            [levelId]: { outcome, solvedAt: Date.now() },
          },
        }));
      },

      getProgress: (levelId) => get().solved[levelId],

      isSolved: (levelId) => levelId in get().solved,
    }),
    { name: 'ostdle-progress' },
  ),
);
