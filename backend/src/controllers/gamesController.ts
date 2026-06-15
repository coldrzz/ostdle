import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { gamesService } from '../services/gamesService.js';
import { levelsService } from '../services/levelsService.js';
import type { GuessRequest } from '../types/index.js';
import { paramId } from '../utils/params.js';

export class GamesController {
  search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query.q as string) ?? '';
    const results = await gamesService.searchGames(query);
    res.json(results);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(paramId(req.params.id), 10);
    const game = await gamesService.getGameById(id);
    if (!game) {
      res.status(404).json({ error: 'Not Found', message: 'Game not found', statusCode: 404 });
      return;
    }
    res.json(game);
  });

  guess = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { levelId, guess, gameId } = req.body as GuessRequest;
    const level = await levelsService.getLevelById(levelId);
    if (!level) {
      res.status(404).json({ error: 'Not Found', message: 'Level not found', statusCode: 404 });
      return;
    }

    const result = await gamesService.checkGuess(
      guess,
      level.gameTitle,
      gameId,
      level.gameId,
    );
    res.json(result);
  });

  detectFromTitle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { videoTitle } = req.body as { videoTitle: string };
    const result = await gamesService.detectGameFromTitle(videoTitle);
    res.json(result);
  });
}

export const gamesController = new GamesController();
