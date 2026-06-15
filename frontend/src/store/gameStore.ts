import { create } from 'zustand';
import type { GameSession, GameStatus, GuessResponse } from '@/types';
import { INITIAL_CLIP_DURATION, INITIAL_LIVES } from '@/types';

interface GameStore {
  session: GameSession | null;
  lastGuessResult: GuessResponse | null;
  initSession: (levelId: string) => void;
  recordWrongGuess: () => void;
  recordSkip: () => void;
  recordWin: (result: GuessResponse) => void;
  recordLoss: () => void;
  reset: () => void;
}

function createInitialSession(levelId: string): GameSession {
  return {
    levelId,
    attempts: 0,
    wrongGuesses: 0,
    skips: 0,
    clipDuration: INITIAL_CLIP_DURATION,
    livesRemaining: INITIAL_LIVES,
    status: 'playing',
    revealedAnswer: false,
  };
}

function isGameOver(session: GameSession): boolean {
  return session.livesRemaining <= 0;
}

export const useGameStore = create<GameStore>((set) => ({
  session: null,
  lastGuessResult: null,

  initSession: (levelId) => {
    set({
      session: createInitialSession(levelId),
      lastGuessResult: null,
    });
  },

  recordWrongGuess: () => {
    set((state) => {
      if (!state.session || state.session.status !== 'playing') return state;

      const session: GameSession = {
        ...state.session,
        attempts: state.session.attempts + 1,
        wrongGuesses: state.session.wrongGuesses + 1,
        clipDuration: state.session.clipDuration + 1,
        livesRemaining: state.session.livesRemaining - 1,
      };

      if (isGameOver(session)) {
        return {
          session: { ...session, status: 'lost' as GameStatus, revealedAnswer: true },
        };
      }

      return { session };
    });
  },

  recordSkip: () => {
    set((state) => {
      if (!state.session || state.session.status !== 'playing') return state;

      const session: GameSession = {
        ...state.session,
        attempts: state.session.attempts + 1,
        skips: state.session.skips + 1,
        clipDuration: state.session.clipDuration + 1,
        livesRemaining: state.session.livesRemaining - 1,
      };

      if (isGameOver(session)) {
        return {
          session: { ...session, status: 'lost' as GameStatus, revealedAnswer: true },
        };
      }

      return { session };
    });
  },

  recordWin: (result) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: { ...state.session, status: 'won' as GameStatus },
        lastGuessResult: result,
      };
    });
  },

  recordLoss: () => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          status: 'lost' as GameStatus,
          revealedAnswer: true,
        },
      };
    });
  },

  reset: () => {
    set({ session: null, lastGuessResult: null });
  },
}));
