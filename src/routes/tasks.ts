import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask
} from '../controllers/taskController';
import {
  validateCreateTask,
  validateUpdateTask,
  validateId
} from '../middleware/validation';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Task routes
router.get('/', getAllTasks);
router.get('/:id', validateId, getTaskById);
router.post('/', validateCreateTask, createTask);
router.put('/:id', validateUpdateTask, updateTask);
router.delete('/:id', validateId, deleteTask);

// Move task route with specific validation
router.patch('/:id/move', [
  validateId[0], // Only the param validation, not the middleware
  body('columnId')
    .notEmpty()
    .withMessage('Column ID is required'),
  body('position')
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
], moveTask);

export default router;
