import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import {
  CreateBoardRequest,
  UpdateBoardRequest,
  BoardQuery,
  ApiResponse,
  BoardWithColumns,
  Board
} from '../types';

export const getAllBoards = asyncHandler(async (req: Request, res: Response) => {
  const { includeColumns = 'false', includeTasks = 'false' } = req.query as { includeColumns?: string; includeTasks?: string };

  const boards = await prisma.board.findMany({
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

  logger.info(`Retrieved ${boards.length} boards`);

  const response: ApiResponse<BoardWithColumns[] | Board[]> = {
    data: boards,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: `Retrieved ${boards.length} boards successfully`
  };

  res.status(200).json(response);
});

export const getBoardById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { includeColumns = 'true', includeTasks = 'true' } = req.query as { includeColumns?: string; includeTasks?: string };

  const board = await prisma.board.findUnique({
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
    throw createError('Board not found', 404);
  }

  logger.info(`Retrieved board: ${board.name} (${board.id})`);

  const response: ApiResponse<BoardWithColumns | Board> = {
    data: board,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Board retrieved successfully'
  };

  res.status(200).json(response);
});

export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, color }: CreateBoardRequest = req.body;

  // For now, create a default user if none exists (temporary solution)
  let defaultUser = await prisma.user.findFirst();
  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        email: 'demo@kanban.com',
        name: 'Demo User',
      }
    });
  }

  // Create board with default columns
  const board = await prisma.board.create({
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

  logger.info(`Created new board: ${board.name} (${board.id})`);

  const response: ApiResponse<BoardWithColumns> = {
    data: board,
    statusCode: 201,
    timestamp: new Date().toISOString(),
    message: 'Board created successfully'
  };

  res.status(201).json(response);
});

export const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateBoardRequest = req.body;

  // Check if board exists
  const existingBoard = await prisma.board.findUnique({ where: { id } });
  if (!existingBoard) {
    throw createError('Board not found', 404);
  }

  const board = await prisma.board.update({
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

  logger.info(`Updated board: ${board.name} (${board.id})`);

  const response: ApiResponse<BoardWithColumns> = {
    data: board,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Board updated successfully'
  };

  res.status(200).json(response);
});

export const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if board exists
  const existingBoard = await prisma.board.findUnique({ where: { id } });
  if (!existingBoard) {
    throw createError('Board not found', 404);
  }

  await prisma.board.delete({ where: { id } });

  logger.info(`Deleted board: ${existingBoard.name} (${id})`);

  const response: ApiResponse = {
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Board deleted successfully'
  };

  res.status(200).json(response);
});

export const createColumn = asyncHandler(async (req: Request, res: Response) => {
  const { id: boardId } = req.params;
  const { name, position } = req.body;

  // Check if board exists
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    throw createError('Board not found', 404);
  }

  // Get the next position if not provided
  let columnPosition = position;
  if (columnPosition === undefined) {
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' }
    });
    columnPosition = lastColumn ? lastColumn.position + 1 : 0;
  }

  const column = await prisma.column.create({
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

  logger.info(`Created new column: ${column.name} in board ${boardId}`);

  const response: ApiResponse = {
    data: column,
    statusCode: 201,
    timestamp: new Date().toISOString(),
    message: 'Column created successfully'
  };

  res.status(201).json(response);
});

export const updateColumn = asyncHandler(async (req: Request, res: Response) => {
  const { id: boardId, columnId } = req.params;
  const { name, position } = req.body;

  // Check if column exists and belongs to the board
  const existingColumn = await prisma.column.findFirst({
    where: { id: columnId, boardId }
  });

  if (!existingColumn) {
    throw createError('Column not found', 404);
  }

  const column = await prisma.column.update({
    where: { id: columnId },
    data: { name, position },
    include: {
      tasks: {
        orderBy: { position: 'asc' }
      }
    }
  });

  logger.info(`Updated column: ${column.name} (${columnId})`);

  const response: ApiResponse = {
    data: column,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Column updated successfully'
  };

  res.status(200).json(response);
});

export const deleteColumn = asyncHandler(async (req: Request, res: Response) => {
  const { id: boardId, columnId } = req.params;

  // Check if column exists and belongs to the board
  const existingColumn = await prisma.column.findFirst({
    where: { id: columnId, boardId }
  });

  if (!existingColumn) {
    throw createError('Column not found', 404);
  }

  await prisma.column.delete({ where: { id: columnId } });

  logger.info(`Deleted column: ${existingColumn.name} (${columnId})`);

  const response: ApiResponse = {
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Column deleted successfully'
  };

  res.status(200).json(response);
});
