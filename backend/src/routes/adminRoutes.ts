import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';

const router = Router();

router.post('/youtube/search', adminController.searchYouTube);
router.post('/youtube/info', adminController.getVideoInfo);
router.get('/youtube/stream-url', adminController.getStreamUrl);
router.post('/levels/generate', adminController.generateLevel);
router.post('/games/detect', adminController.detectGame);

export default router;
