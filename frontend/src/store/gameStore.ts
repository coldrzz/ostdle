import { create } from 'zustand';
import type { GameSession, GameStatus, GuessResponse } from '@/types';
import { getClipDurationForLives, INITIAL_LIVES } from '@/types';
import type { LevelAttempt } from './progressStore';

interface GameStore {
  session: GameSession | null;
  lastGuessResult: GuessResponse | null;
  initSession: (levelId: string, saved?: LevelAttempt) => void;
  recordWrongGuess: (guessName: string) => void;
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
    wrongGuessHistory: [],
    clipDuration: getClipDurationForLives(INITIAL_LIVES),
    livesRemaining: INITIAL_LIVES,
    status: 'playing',
    revealedAnswer: false,
  };
}

function sessionFromAttempt(levelId: string, saved: LevelAttempt): GameSession {
  return {
    levelId,
    attempts: saved.attempts,
    wrongGuesses: saved.wrongGuesses,
    skips: saved.skips,
    wrongGuessHistory: saved.wrongGuessHistory ?? [],
    livesRemaining: saved.livesRemaining,
    clipDuration: getClipDurationForLives(saved.livesRemaining),
    status: saved.status,
    revealedAnswer: saved.status === 'lost',
  };
}

function isGameOver(session: GameSession): boolean {
  return session.livesRemaining <= 0;
}

export const useGameStore = create<GameStore>((set) => ({
  session: null,
  lastGuessResult: null,

  initSession: (levelId, saved) => {
    if (saved) {
      set({
        session: sessionFromAttempt(levelId, saved),
        lastGuessResult: saved.status === 'won' ? (saved.winResult ?? null) : null,
      });
      return;
    }

    set({
      session: createInitialSession(levelId),
      lastGuessResult: null,
    });
  },

  recordWrongGuess: (guessName) => {
    set((state) => {
      if (!state.session || state.session.status !== 'playing') return state;

      const trimmed = guessName.trim();
      const livesRemaining = state.session.livesRemaining - 1;
      const session: GameSession = {
        ...state.session,
        attempts: state.session.attempts + 1,
        wrongGuesses: state.session.wrongGuesses + 1,
        wrongGuessHistory: trimmed
          ? [...state.session.wrongGuessHistory, trimmed]
          : state.session.wrongGuessHistory,
        clipDuration: getClipDurationForLives(livesRemaining),
        livesRemaining,
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

      const livesRemaining = state.session.livesRemaining - 1;
      const session: GameSession = {
        ...state.session,
        attempts: state.session.attempts + 1,
        skips: state.session.skips + 1,
        clipDuration: getClipDurationForLives(livesRemaining),
        livesRemaining,
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

export function sessionToAttempt(
  session: GameSession,
  winResult?: GuessResponse | null,
): LevelAttempt {
  return {
    livesRemaining: session.livesRemaining,
    attempts: session.attempts,
    wrongGuesses: session.wrongGuesses,
    skips: session.skips,
    wrongGuessHistory: session.wrongGuessHistory,
    status: session.status,
    winResult: session.status === 'won' ? (winResult ?? undefined) : undefined,
  };
}
