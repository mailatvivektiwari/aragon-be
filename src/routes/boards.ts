import { Router } from 'express';
import {
  getAllBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn
} from '../controllers/boardController';
import {
  validateCreateBoard,
  validateUpdateBoard,
  validateCreateColumn,
  validateId
} from '../middleware/validation';

const router = Router();

// Board routes
router.get('/', getAllBoards);
router.get('/:id', validateId, getBoardById);
router.post('/', validateCreateBoard, createBoard);
router.put('/:id', validateUpdateBoard, updateBoard);
router.delete('/:id', validateId, deleteBoard);

// Column routes (nested under boards)
router.post('/:id/columns', validateId, validateCreateColumn, createColumn);
router.put('/:id/columns/:columnId', validateId, updateColumn);
router.delete('/:id/columns/:columnId', validateId, deleteColumn);

export default router;
