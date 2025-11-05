"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteColumn = exports.updateColumn = exports.createColumn = exports.deleteBoard = exports.updateBoard = exports.createBoard = exports.getBoardById = exports.getAllBoards = void 0;
const app_1 = require("../app");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
exports.getAllBoards = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { includeColumns = 'false', includeTasks = 'false' } = req.query;
    const boards = await app_1.prisma.board.findMany({
        include: {
            columns: includeColumns === 'true' ? {
                include: {
                    tasks: includeTasks === 'true' ? {
                        orderBy: { position: 'asc' }
                    } : false
                },
                orderBy: { position: 'asc' }
            } : false
        },
        orderBy: { createdAt: 'desc' }
    });
    logger_1.logger.info(`Retrieved ${boards.length} boards`);
    const response = {
        data: boards,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: `Retrieved ${boards.length} boards successfully`
    };
    res.status(200).json(response);
});
exports.getBoardById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { includeColumns = 'true', includeTasks = 'true' } = req.query;
    const board = await app_1.prisma.board.findUnique({
        where: { id },
        include: {
            columns: includeColumns === 'true' ? {
                include: {
                    tasks: includeTasks === 'true' ? {
                        orderBy: { position: 'asc' }
                    } : false
                },
                orderBy: { position: 'asc' }
            } : false
        }
    });
    if (!board) {
        throw (0, errorHandler_1.createError)('Board not found', 404);
    }
    logger_1.logger.info(`Retrieved board: ${board.name} (${board.id})`);
    const response = {
        data: board,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: 'Board retrieved successfully'
    };
    res.status(200).json(response);
});
exports.createBoard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, description, color } = req.body;
    // For now, create a default user if none exists (temporary solution)
    let defaultUser = await app_1.prisma.user.findFirst();
    if (!defaultUser) {
        defaultUser = await app_1.prisma.user.create({
            data: {
                email: 'demo@kanban.com',
                name: 'Demo User',
            }
        });
    }
    // Create board with default columns
    const board = await app_1.prisma.board.create({
        data: {
            name,
            description,
            color: color || '#0079bf',
            userId: defaultUser.id,
            columns: {
                create: [
                    { name: 'To Do', position: 0 },
                    { name: 'In Progress', position: 1 },
                    { name: 'Done', position: 2 }
                ]
            }
        },
        include: {
            columns: {
                include: {
                    tasks: true
                },
                orderBy: { position: 'asc' }
            }
        }
    });
    logger_1.logger.info(`Created new board: ${board.name} (${board.id})`);
    const response = {
        data: board,
        statusCode: 201,
        timestamp: new Date().toISOString(),
        message: 'Board created successfully'
    };
    res.status(201).json(response);
});
exports.updateBoard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Check if board exists
    const existingBoard = await app_1.prisma.board.findUnique({ where: { id } });
    if (!existingBoard) {
        throw (0, errorHandler_1.createError)('Board not found', 404);
    }
    const board = await app_1.prisma.board.update({
        where: { id },
        data: updateData,
        include: {
            columns: {
                include: {
                    tasks: {
                        orderBy: { position: 'asc' }
                    }
                },
                orderBy: { position: 'asc' }
            }
        }
    });
    logger_1.logger.info(`Updated board: ${board.name} (${board.id})`);
    const response = {
        data: board,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: 'Board updated successfully'
    };
    res.status(200).json(response);
});
exports.deleteBoard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Check if board exists
    const existingBoard = await app_1.prisma.board.findUnique({ where: { id } });
    if (!existingBoard) {
        throw (0, errorHandler_1.createError)('Board not found', 404);
    }
    await app_1.prisma.board.delete({ where: { id } });
    logger_1.logger.info(`Deleted board: ${existingBoard.name} (${id})`);
    const response = {
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: 'Board deleted successfully'
    };
    res.status(200).json(response);
});
exports.createColumn = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id: boardId } = req.params;
    const { name, position } = req.body;
    // Check if board exists
    const board = await app_1.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
        throw (0, errorHandler_1.createError)('Board not found', 404);
    }
    // Get the next position if not provided
    let columnPosition = position;
    if (columnPosition === undefined) {
        const lastColumn = await app_1.prisma.column.findFirst({
            where: { boardId },
            orderBy: { position: 'desc' }
        });
        columnPosition = lastColumn ? lastColumn.position + 1 : 0;
    }
    const column = await app_1.prisma.column.create({
        data: {
            name,
            position: columnPosition,
            boardId
        },
        include: {
            tasks: {
                orderBy: { position: 'asc' }
            }
        }
    });
    logger_1.logger.info(`Created new column: ${column.name} in board ${boardId}`);
    const response = {
        data: column,
        statusCode: 201,
        timestamp: new Date().toISOString(),
        message: 'Column created successfully'
    };
    res.status(201).json(response);
});
exports.updateColumn = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id: boardId, columnId } = req.params;
    const { name, position } = req.body;
    // Check if column exists and belongs to the board
    const existingColumn = await app_1.prisma.column.findFirst({
        where: { id: columnId, boardId }
    });
    if (!existingColumn) {
        throw (0, errorHandler_1.createError)('Column not found', 404);
    }
    const column = await app_1.prisma.column.update({
        where: { id: columnId },
        data: { name, position },
        include: {
            tasks: {
                orderBy: { position: 'asc' }
            }
        }
    });
    logger_1.logger.info(`Updated column: ${column.name} (${columnId})`);
    const response = {
        data: column,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: 'Column updated successfully'
    };
    res.status(200).json(response);
});
exports.deleteColumn = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id: boardId, columnId } = req.params;
    // Check if column exists and belongs to the board
    const existingColumn = await app_1.prisma.column.findFirst({
        where: { id: columnId, boardId }
    });
    if (!existingColumn) {
        throw (0, errorHandler_1.createError)('Column not found', 404);
    }
    await app_1.prisma.column.delete({ where: { id: columnId } });
    logger_1.logger.info(`Deleted column: ${existingColumn.name} (${columnId})`);
    const response = {
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: 'Column deleted successfully'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=boardController.js.map