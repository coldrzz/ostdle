import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { adminService } from '../services/adminService.js';
import { gamesService } from '../services/gamesService.js';
import type { GenerateLevelRequest } from '../types/index.js';

export class AdminController {
  searchYouTube = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body as { query: string };
    const results = await adminService.searchYouTube(query);
    res.json(results);
  });

  getVideoInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { url } = req.body as { url: string };
    const info = await adminService.getVideoInfo(url);
    res.json(info);
  });

  getStreamUrl = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { url } = req.query as { url: string };
    const streamUrl = adminService.getStreamUrl(url);
    res.json({ streamUrl });
  });

  generateLevel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as GenerateLevelRequest;
    const result = await adminService.generateLevel(dto);
    res.status(201).json(result);
  });

  detectGame = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { videoTitle } = req.body as { videoTitle: string };
    const result = await gamesService.detectGameFromTitle(videoTitle);
    res.json(result);
  });
}

export const adminController = new AdminController();
