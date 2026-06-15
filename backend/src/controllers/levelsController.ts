import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { levelsService } from '../services/levelsService.js';
import type { CreateLevelDto, ReorderLevelsDto, UpdateLevelDto } from '../types/index.js';
import { paramId } from '../utils/params.js';

export class LevelsController {
  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const levels = await levelsService.getAllLevels();
    res.json(levels);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const level = await levelsService.getLevelById(paramId(req.params.id));
    if (!level) {
      res.status(404).json({ error: 'Not Found', message: 'Level not found', statusCode: 404 });
      return;
    }
    res.json(level);
  });

  getDaily = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await levelsService.getDailyLevel();
    if (!result) {
      res.status(404).json({ error: 'Not Found', message: 'No levels available', statusCode: 404 });
      return;
    }
    res.json({
      level: result.level,
      levelNumber: result.levelNumber,
      date: new Date().toISOString().split('T')[0],
    });
  });

  getByNumber = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const levelNumber = parseInt(paramId(req.params.number), 10);
    const result = await levelsService.getLevelByIndex(levelNumber - 1);
    if (!result) {
      res.status(404).json({ error: 'Not Found', message: 'Level not found', statusCode: 404 });
      return;
    }
    res.json(result);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as CreateLevelDto;
    const level = await levelsService.createLevel(dto);
    res.status(201).json(level);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as UpdateLevelDto;
    const level = await levelsService.updateLevel(paramId(req.params.id), dto);
    res.json(level);
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await levelsService.deleteLevel(paramId(req.params.id));
    res.status(204).send();
  });

  reorder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderedIds } = req.body as ReorderLevelsDto;
    const levels = await levelsService.reorderLevels(orderedIds);
    res.json(levels);
  });
}

export const levelsController = new LevelsController();
