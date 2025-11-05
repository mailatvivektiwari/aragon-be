"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const columnController_1 = require("../controllers/columnController");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Column routes
router.post('/', [
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
    validation_1.handleValidationErrors
], columnController_1.createColumn);
router.put('/:id', [
    validation_1.validateId[0], // Only the param validation, not the middleware
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Column name must be between 1 and 100 characters'),
    (0, express_validator_1.body)('position')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Position must be a non-negative integer'),
    validation_1.handleValidationErrors
], columnController_1.updateColumn);
router.delete('/:id', validation_1.validateId, columnController_1.deleteColumn);
router.patch('/:id/reorder', [
    validation_1.validateId[0], // Only the param validation, not the middleware
    (0, express_validator_1.body)('position')
        .isInt({ min: 0 })
        .withMessage('Position must be a non-negative integer'),
    validation_1.handleValidationErrors
], columnController_1.reorderColumn);
exports.default = router;
//# sourceMappingURL=columns.js.map