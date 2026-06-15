import { Router } from 'express';
import { gamesController } from '../controllers/gamesController.js';

const router = Router();

router.get('/search', gamesController.search);
router.get('/:id', gamesController.getById);
router.post('/guess', gamesController.guess);
router.post('/detect', gamesController.detectFromTitle);

export default router;
