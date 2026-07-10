import type { GuessResponse, Level } from '@/types';

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

export function checkGuess(
  guess: string,
  level: Level,
  gameId?: number,
): GuessResponse {
  let correct = false;

  if (gameId && level.gameId && String(gameId) === level.gameId) {
    correct = true;
  } else {
    correct = compareGames(guess, level.gameTitle);
  }

  if (correct) {
    return {
      correct: true,
      gameTitle: level.gameTitle,
      coverImage: level.coverImage,
    };
  }

  return { correct: false };
}
