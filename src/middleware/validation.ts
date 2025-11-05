import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { createError } from './errorHandler';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));
    
    const error = createError('Validation failed', 400);
    return res.status(400).json({
      error: error.message,
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: req.path,
      validationErrors: errorMessages,
    });
  }
  next();
};

// Board validation rules
export const validateCreateBoard = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Board name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Board name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
  handleValidationErrors,
];

export const validateUpdateBoard = [
  param('id')
    .notEmpty()
    .withMessage('Board ID is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Board name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Board name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
  handleValidationErrors,
];

// Task validation rules
export const validateCreateTask = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('columnId')
    .notEmpty()
    .withMessage('Column ID is required'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be one of: TODO, IN_PROGRESS, DONE'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors,
];

export const validateUpdateTask = [
  param('id')
    .notEmpty()
    .withMessage('Task ID is required'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('columnId')
    .optional()
    .notEmpty()
    .withMessage('Column ID cannot be empty'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be one of: TODO, IN_PROGRESS, DONE'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors,
];

// Column validation rules
export const validateCreateColumn = [
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
  handleValidationErrors,
];

// Generic ID validation
export const validateId = [
  param('id')
    .notEmpty()
    .withMessage('ID is required'),
  handleValidationErrors,
];
