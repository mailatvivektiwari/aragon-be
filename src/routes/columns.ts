import { Router } from 'express';
import {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumn
} from '../controllers/columnController';
import { body } from 'express-validator';
import { handleValidationErrors, validateId } from '../middleware/validation';

const router = Router();

// Column routes
router.post('/', [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Column name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Column name must be between 1 and 100 characters'),
  body('boardId')
    .notEmpty()
    .withMessage('Board ID is required'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
], createColumn);

router.put('/:id', [
  validateId[0], // Only the param validation, not the middleware
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Column name must be between 1 and 100 characters'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
], updateColumn);

router.delete('/:id', validateId, deleteColumn);

router.patch('/:id/reorder', [
  validateId[0], // Only the param validation, not the middleware
  body('position')
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
], reorderColumn);

export default router;
