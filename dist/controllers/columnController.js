"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderColumn = exports.deleteColumn = exports.updateColumn = exports.createColumn = void 0;
const app_1 = require("../app");
const errorHandler_1 = require("../middleware/errorHandler");
exports.createColumn = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, boardId, position } = req.body;
    // Check if board exists
    const board = await app_1.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
        throw (0, errorHandler_1.createError)('Board not found', 404);
    }
    // If no position provided, add to the end
    let columnPosition = position;
    if (columnPosition === undefined) {
        const maxPosition = await app_1.prisma.column.findFirst({
            where: { boardId },
            orderBy: { position: 'desc' },
            select: { position: true }
        });
        columnPosition = (maxPosition?.position ?? -1) + 1;
    }
    // Create the column
    const column = await app_1.prisma.column.create({
        data: {
            name,
            boardId,
            position: columnPosition
        },
        include: {
            tasks: {
                orderBy: { position: 'asc' }
            }
        }
    });
    const response = {
        data: column,
        statusCode: 201,
        timestamp: new Date().toISOString(),
        message: 'Column created successfully'
    };
    res.status(201).json(response);
});
exports.updateColumn = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, position } = req.body;
    // Check if column exists
    const existingColumn = await app_1.prisma.column.findUnique({ where: { id } });
    if (!existingColumn) {
        throw (0, errorHandler_1.createError)('Column not found', 404);
    }
    // Update the column
    const column = await app_1.prisma.column.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(position !== undefined && { position })
        },
        include: {
            tasks: {
                orderBy: { position: 'asc' }
            }
        }
    });
    const response = {
        data: column,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: 'Column updated successfully'
    };
    res.status(200).json(response);
});
exports.deleteColumn = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Check if column exists
    const existingColumn = await app_1.prisma.column.findUnique({
        where: { id },
        include: {
            tasks: true
        }
    });
    if (!existingColumn) {
        throw (0, errorHandler_1.createError)('Column not found', 404);
    }
    // Check if column has tasks
    if (existingColumn.tasks && existingColumn.tasks.length > 0) {
        throw (0, errorHandler_1.createError)('Cannot delete column with tasks. Please move or delete all tasks first.', 400);
    }
    // Use transaction to delete column and update positions
    await app_1.prisma.$transaction(async (tx) => {
        // Delete the column
        await tx.column.delete({ where: { id } });
        // Update positions of remaining columns
        await tx.column.updateMany({
            where: {
                boardId: existingColumn.boardId,
                position: { gt: existingColumn.position }
            },
            data: {
                position: { decrement: 1 }
            }
        });
    });
    const response = {
        data: null,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: 'Column deleted successfully'
    };
    res.status(200).json(response);
});
exports.reorderColumn = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { position } = req.body;
    // Check if column exists
    const existingColumn = await app_1.prisma.column.findUnique({ where: { id } });
    if (!existingColumn) {
        throw (0, errorHandler_1.createError)('Column not found', 404);
    }
    // Use transaction to handle position updates
    const result = await app_1.prisma.$transaction(async (tx) => {
        if (position > existingColumn.position) {
            // Moving right - shift columns left
            await tx.column.updateMany({
                where: {
                    boardId: existingColumn.boardId,
                    position: {
                        gt: existingColumn.position,
                        lte: position
                    }
                },
                data: {
                    position: { decrement: 1 }
                }
            });
        }
        else if (position < existingColumn.position) {
            // Moving left - shift columns right
            await tx.column.updateMany({
                where: {
                    boardId: existingColumn.boardId,
                    position: {
                        gte: position,
                        lt: existingColumn.position
                    }
                },
                data: {
                    position: { increment: 1 }
                }
            });
        }
        // Update the column position
        return await tx.column.update({
            where: { id },
            data: { position },
            include: {
                tasks: {
                    orderBy: { position: 'asc' }
                }
            }
        });
    });
    const response = {
        data: result,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        message: 'Column reordered successfully'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=columnController.js.map