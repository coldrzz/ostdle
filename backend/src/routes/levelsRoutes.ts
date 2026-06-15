import { Router } from 'express';
import { levelsController } from '../controllers/levelsController.js';

const router = Router();

router.get('/', levelsController.getAll);
router.get('/daily', levelsController.getDaily);
router.get('/number/:number', levelsController.getByNumber);
router.put('/reorder/all', levelsController.reorder);
router.get('/:id', levelsController.getById);
router.post('/', levelsController.create);
router.put('/:id', levelsController.update);
router.delete('/:id', levelsController.delete);

export default router;
