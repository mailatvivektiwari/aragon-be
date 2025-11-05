"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateId = exports.validateCreateColumn = exports.validateUpdateTask = exports.validateCreateTask = exports.validateUpdateBoard = exports.validateCreateBoard = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./errorHandler");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined,
        }));
        const error = (0, errorHandler_1.createError)('Validation failed', 400);
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
exports.handleValidationErrors = handleValidationErrors;
// Board validation rules
exports.validateCreateBoard = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Board name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Board name must be between 1 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    (0, express_validator_1.body)('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color code'),
    exports.handleValidationErrors,
];
exports.validateUpdateBoard = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage('Board ID is required'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Board name cannot be empty')
        .isLength({ min: 1, max: 100 })
        .withMessage('Board name must be between 1 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    (0, express_validator_1.body)('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color code'),
    exports.handleValidationErrors,
];
// Task validation rules
exports.validateCreateTask = [
    (0, express_validator_1.body)('title')
        .trim()
        .notEmpty()
        .withMessage('Task title is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Task title must be between 1 and 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    (0, express_validator_1.body)('columnId')
        .notEmpty()
        .withMessage('Column ID is required'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
        .withMessage('Status must be one of: TODO, IN_PROGRESS, DONE'),
    (0, express_validator_1.body)('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('position')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Position must be a non-negative integer'),
    exports.handleValidationErrors,
];
exports.validateUpdateTask = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage('Task ID is required'),
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Task title cannot be empty')
        .isLength({ min: 1, max: 200 })
        .withMessage('Task title must be between 1 and 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    (0, express_validator_1.body)('columnId')
        .optional()
        .notEmpty()
        .withMessage('Column ID cannot be empty'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
        .withMessage('Status must be one of: TODO, IN_PROGRESS, DONE'),
    (0, express_validator_1.body)('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('position')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Position must be a non-negative integer'),
    exports.handleValidationErrors,
];
// Column validation rules
exports.validateCreateColumn = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Column name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Column name must be between 1 and 100 characters'),
    (0, express_validator_1.body)('boardId')
        .notEmpty()
        .withMessage('Board ID is required'),
    (0, express_validator_1.body)('position')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Position must be a non-negative integer'),
    exports.handleValidationErrors,
];
// Generic ID validation
exports.validateId = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage('ID is required'),
    exports.handleValidationErrors,
];
//# sourceMappingURL=validation.js.map