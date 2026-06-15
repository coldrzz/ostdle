import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateLevelDto, Level, UpdateLevelDto } from '../types/index.js';

export class LevelsService {
  private async ensureDataDir(): Promise<void> {
    await fs.mkdir(config.dataDir, { recursive: true });
  }

  async readLevels(): Promise<Level[]> {
    await this.ensureDataDir();
    try {
      const content = await fs.readFile(config.levelsFile, 'utf-8');
      return JSON.parse(content) as Level[];
    } catch {
      return [];
    }
  }

  private async writeLevels(levels: Level[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(config.levelsFile, JSON.stringify(levels, null, 2), 'utf-8');
  }

  async getAllLevels(): Promise<Level[]> {
    return this.readLevels();
  }

  async getLevelById(id: string): Promise<Level | null> {
    const levels = await this.readLevels();
    return levels.find((l) => l.id === id) ?? null;
  }

  async getLevelByIndex(index: number): Promise<{ level: Level; levelNumber: number } | null> {
    const levels = await this.readLevels();
    if (index < 0 || index >= levels.length) return null;
    return { level: levels[index], levelNumber: index + 1 };
  }

  async getDailyLevel(): Promise<{ level: Level; levelNumber: number } | null> {
    // For now, daily level is always the first level
    return this.getLevelByIndex(0);
  }

  async createLevel(dto: CreateLevelDto): Promise<Level> {
    const levels = await this.readLevels();
    const level: Level = {
      id: uuidv4(),
      gameTitle: dto.gameTitle,
      gameId: dto.gameId,
      coverImage: dto.coverImage,
      audioFile: dto.audioFile,
    };
    levels.push(level);
    await this.writeLevels(levels);
    return level;
  }

  async updateLevel(id: string, dto: UpdateLevelDto): Promise<Level> {
    const levels = await this.readLevels();
    const index = levels.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new AppError(404, `Level with id ${id} not found`, 'Not Found');
    }
    levels[index] = { ...levels[index], ...dto };
    await this.writeLevels(levels);
    return levels[index];
  }

  async deleteLevel(id: string): Promise<void> {
    const levels = await this.readLevels();
    const index = levels.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new AppError(404, `Level with id ${id} not found`, 'Not Found');
    }
    const [removed] = levels.splice(index, 1);
    await this.writeLevels(levels);

    // Attempt to remove audio file
    if (removed.audioFile) {
      const audioPath = path.join(config.audioDir, removed.audioFile);
      try {
        await fs.unlink(audioPath);
      } catch {
        // File may not exist
      }
    }
  }

  async reorderLevels(orderedIds: string[]): Promise<Level[]> {
    const levels = await this.readLevels();
    const levelMap = new Map(levels.map((l) => [l.id, l]));

    if (orderedIds.length !== levels.length) {
      throw new AppError(400, 'Ordered IDs must match all existing levels', 'Bad Request');
    }

    const reordered: Level[] = [];
    for (const id of orderedIds) {
      const level = levelMap.get(id);
      if (!level) {
        throw new AppError(400, `Unknown level id: ${id}`, 'Bad Request');
      }
      reordered.push(level);
    }

    await this.writeLevels(reordered);
    return reordered;
  }
}

export const levelsService = new LevelsService();
