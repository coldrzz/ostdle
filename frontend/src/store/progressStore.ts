import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameStatus, GuessResponse } from '@/types';

export type LevelOutcome = 'won' | 'lost';

export interface LevelAttempt {
  livesRemaining: number;
  attempts: number;
  wrongGuesses: number;
  skips: number;
  wrongGuessHistory: string[];
  status: GameStatus;
  winResult?: GuessResponse;
  completedAt?: number;
}

interface ProgressStore {
  attempts: Record<string, LevelAttempt>;
  saveAttempt: (levelId: string, attempt: LevelAttempt) => void;
  getAttempt: (levelId: string) => LevelAttempt | undefined;
  isCompleted: (levelId: string) => boolean;
  getOutcome: (levelId: string) => LevelOutcome | undefined;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      attempts: {},

      saveAttempt: (levelId, attempt) => {
        set((state) => ({
          attempts: {
            ...state.attempts,
            [levelId]: {
              ...attempt,
              completedAt:
                attempt.status !== 'playing'
                  ? (attempt.completedAt ?? Date.now())
                  : undefined,
            },
          },
        }));
      },

      getAttempt: (levelId) => get().attempts[levelId],

      isCompleted: (levelId) => {
        const status = get().attempts[levelId]?.status;
        return status === 'won' || status === 'lost';
      },

      getOutcome: (levelId) => {
        const status = get().attempts[levelId]?.status;
        return status === 'won' || status === 'lost' ? status : undefined;
      },
    }),
    {
      name: 'ostdle-progress',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as {
          solved?: Record<string, { outcome: LevelOutcome; solvedAt: number }>;
          attempts?: Record<string, LevelAttempt>;
        };

        if (version < 1 && state.solved) {
          const attempts: Record<string, LevelAttempt> = {};
          for (const [levelId, entry] of Object.entries(state.solved)) {
            attempts[levelId] = {
              livesRemaining: 0,
              attempts: 0,
              wrongGuesses: 0,
              skips: 0,
              wrongGuessHistory: [],
              status: entry.outcome,
              completedAt: entry.solvedAt,
            };
          }
          return { attempts };
        }

        if (version < 2 && state.attempts) {
          for (const attempt of Object.values(state.attempts)) {
            attempt.wrongGuessHistory = attempt.wrongGuessHistory ?? [];
          }
        }

        return persisted as ProgressStore;
      },
    },
  ),
);
