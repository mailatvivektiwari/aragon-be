import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ApiResponse, CreateColumnRequest, UpdateColumnRequest } from '../types';
import { Column } from '@prisma/client';

export const createColumn = asyncHandler(async (req: Request, res: Response) => {
  const { name, boardId, position }: CreateColumnRequest = req.body;

  // Check if board exists
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    throw createError('Board not found', 404);
  }

  // If no position provided, add to the end
  let columnPosition = position;
  if (columnPosition === undefined) {
    const maxPosition = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    columnPosition = (maxPosition?.position ?? -1) + 1;
  }

  // Create the column
  const column = await prisma.column.create({
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

  const response: ApiResponse<Column> = {
    data: column,
    statusCode: 201,
    timestamp: new Date().toISOString(),
    message: 'Column created successfully'
  };

  res.status(201).json(response);
});

export const updateColumn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, position }: UpdateColumnRequest = req.body;

  // Check if column exists
  const existingColumn = await prisma.column.findUnique({ where: { id } });
  if (!existingColumn) {
    throw createError('Column not found', 404);
  }

  // Update the column
  const column = await prisma.column.update({
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

  const response: ApiResponse<Column> = {
    data: column,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Column updated successfully'
  };

  res.status(200).json(response);
});

export const deleteColumn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if column exists
  const existingColumn = await prisma.column.findUnique({
    where: { id },
    include: {
      tasks: true
    }
  });

  if (!existingColumn) {
    throw createError('Column not found', 404);
  }

  // Check if column has tasks
  if (existingColumn.tasks && existingColumn.tasks.length > 0) {
    throw createError('Cannot delete column with tasks. Please move or delete all tasks first.', 400);
  }

  // Use transaction to delete column and update positions
  await prisma.$transaction(async (tx: any) => {
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

  const response: ApiResponse<null> = {
    data: null,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Column deleted successfully'
  };

  res.status(200).json(response);
});

export const reorderColumn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { position }: { position: number } = req.body;

  // Check if column exists
  const existingColumn = await prisma.column.findUnique({ where: { id } });
  if (!existingColumn) {
    throw createError('Column not found', 404);
  }

  // Use transaction to handle position updates
  const result = await prisma.$transaction(async (tx: any) => {
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
    } else if (position < existingColumn.position) {
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

  const response: ApiResponse<Column> = {
    data: result,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Column reordered successfully'
  };

  res.status(200).json(response);
});
