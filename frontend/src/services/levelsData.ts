import { assetUrl } from '@/lib/assets';
import type { DailyLevelResponse, Level } from '@/types';

let levelsCache: Level[] | null = null;

export async function loadLevels(): Promise<Level[]> {
  if (levelsCache) return levelsCache;

  const response = await fetch(assetUrl('data/levels.json'));
  if (!response.ok) {
    throw new Error(`Failed to load levels: ${response.status}`);
  }

  levelsCache = (await response.json()) as Level[];
  return levelsCache;
}

export async function getAllLevels(): Promise<Level[]> {
  return loadLevels();
}

export async function getLevelById(id: string): Promise<Level | null> {
  const levels = await loadLevels();
  return levels.find((level) => level.id === id) ?? null;
}

export async function getLevelByNumber(
  number: number,
): Promise<{ level: Level; levelNumber: number } | null> {
  const levels = await loadLevels();
  const index = number - 1;
  if (index < 0 || index >= levels.length) return null;
  return { level: levels[index], levelNumber: number };
}

export async function getDailyLevel(): Promise<DailyLevelResponse | null> {
  const result = await getLevelByNumber(1);
  if (!result) return null;

  return {
    level: result.level,
    levelNumber: result.levelNumber,
    date: new Date().toISOString().slice(0, 10),
  };
}
