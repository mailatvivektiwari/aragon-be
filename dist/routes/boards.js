"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const boardController_1 = require("../controllers/boardController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Board routes
router.get('/', boardController_1.getAllBoards);
router.get('/:id', validation_1.validateId, boardController_1.getBoardById);
router.post('/', validation_1.validateCreateBoard, boardController_1.createBoard);
router.put('/:id', validation_1.validateUpdateBoard, boardController_1.updateBoard);
router.delete('/:id', validation_1.validateId, boardController_1.deleteBoard);
// Column routes (nested under boards)
router.post('/:id/columns', validation_1.validateId, validation_1.validateCreateColumn, boardController_1.createColumn);
router.put('/:id/columns/:columnId', validation_1.validateId, boardController_1.updateColumn);
router.delete('/:id/columns/:columnId', validation_1.validateId, boardController_1.deleteColumn);
exports.default = router;
//# sourceMappingURL=boards.js.map