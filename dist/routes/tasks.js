"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const validation_2 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Task routes
router.get('/', taskController_1.getAllTasks);
router.get('/:id', validation_1.validateId, taskController_1.getTaskById);
router.post('/', validation_1.validateCreateTask, taskController_1.createTask);
router.put('/:id', validation_1.validateUpdateTask, taskController_1.updateTask);
router.delete('/:id', validation_1.validateId, taskController_1.deleteTask);
// Move task route with specific validation
router.patch('/:id/move', [
    validation_1.validateId[0], // Only the param validation, not the middleware
    (0, express_validator_1.body)('columnId')
        .notEmpty()
        .withMessage('Column ID is required'),
    (0, express_validator_1.body)('position')
        .isInt({ min: 0 })
        .withMessage('Position must be a non-negative integer'),
    validation_2.handleValidationErrors
], taskController_1.moveTask);
exports.default = router;
//# sourceMappingURL=tasks.js.map