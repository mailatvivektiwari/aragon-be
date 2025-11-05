import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  TaskQuery,
  ApiResponse,
  Task
} from '../types';

export const getAllTasks = asyncHandler(async (req: Request, res: Response) => {
  const {
    columnId,
    status,
    priority,
    sortBy = 'position',
    sortOrder = 'asc',
    limit,
    offset
  } = req.query as { 
    columnId?: string; 
    status?: string; 
    priority?: string; 
    sortBy?: string; 
    sortOrder?: string; 
    limit?: string; 
    offset?: string; 
  };

  const where: any = {};
  if (columnId) where.columnId = columnId;
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    take: limit ? parseInt(limit) : undefined,
    skip: offset ? parseInt(offset) : undefined,
    include: {
      column: {
        select: {
          id: true,
          name: true,
          boardId: true
        }
      }
    }
  });

  logger.info(`Retrieved ${tasks.length} tasks`);

  const response: ApiResponse<Task[]> = {
    data: tasks,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: `Retrieved ${tasks.length} tasks successfully`
  };

  res.status(200).json(response);
});

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      column: {
        select: {
          id: true,
          name: true,
          boardId: true,
          board: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  logger.info(`Retrieved task: ${task.title} (${task.id})`);

  const response: ApiResponse<Task> = {
    data: task,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Task retrieved successfully'
  };

  res.status(200).json(response);
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    columnId,
    priority = 'MEDIUM',
    status = 'TODO',
    dueDate,
    position
  }: CreateTaskRequest = req.body;

  // Check if column exists
  const column = await prisma.column.findUnique({ where: { id: columnId } });
  if (!column) {
    throw createError('Column not found', 404);
  }

  // Get the next position if not provided
  let taskPosition = position;
  if (taskPosition === undefined) {
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' }
    });
    taskPosition = lastTask ? lastTask.position + 1 : 0;
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      columnId,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      position: taskPosition
    },
    include: {
      column: {
        select: {
          id: true,
          name: true,
          boardId: true
        }
      }
    }
  });

  logger.info(`Created new task: ${task.title} (${task.id})`);

  const response: ApiResponse<Task> = {
    data: task,
    statusCode: 201,
    timestamp: new Date().toISOString(),
    message: 'Task created successfully'
  };

  res.status(201).json(response);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateTaskRequest = req.body;

  // Check if task exists
  const existingTask = await prisma.task.findUnique({ where: { id } });
  if (!existingTask) {
    throw createError('Task not found', 404);
  }

  // If columnId is being updated, check if the new column exists
  if (updateData.columnId && updateData.columnId !== existingTask.columnId) {
    const column = await prisma.column.findUnique({ where: { id: updateData.columnId } });
    if (!column) {
      throw createError('Target column not found', 404);
    }
  }

  // Prepare update data
  const data: any = { ...updateData };
  if (updateData.dueDate) {
    data.dueDate = new Date(updateData.dueDate);
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      column: {
        select: {
          id: true,
          name: true,
          boardId: true
        }
      }
    }
  });

  logger.info(`Updated task: ${task.title} (${task.id})`);

  const response: ApiResponse<Task> = {
    data: task,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Task updated successfully'
  };

  res.status(200).json(response);
});

export const moveTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { columnId, position }: MoveTaskRequest = req.body;

  // Check if task exists
  const existingTask = await prisma.task.findUnique({ where: { id } });
  if (!existingTask) {
    throw createError('Task not found', 404);
  }

  // Check if target column exists
  const targetColumn = await prisma.column.findUnique({ where: { id: columnId } });
  if (!targetColumn) {
    throw createError('Target column not found', 404);
  }

  // Use transaction to handle position updates
  const result = await prisma.$transaction(async (tx) => {
    // If moving to a different column, update positions in both columns
    if (columnId !== existingTask.columnId) {
      // Update positions in the source column (shift down)
      await tx.task.updateMany({
        where: {
          columnId: existingTask.columnId,
          position: { gt: existingTask.position }
        },
        data: {
          position: { decrement: 1 }
        }
      });

      // Update positions in the target column (shift up)
      await tx.task.updateMany({
        where: {
          columnId,
          position: { gte: position }
        },
        data: {
          position: { increment: 1 }
        }
      });
    } else {
      // Moving within the same column
      if (position > existingTask.position) {
        // Moving down - shift tasks up
        await tx.task.updateMany({
          where: {
            columnId,
            position: {
              gt: existingTask.position,
              lte: position
            }
          },
          data: {
            position: { decrement: 1 }
          }
        });
      } else if (position < existingTask.position) {
        // Moving up - shift tasks down
        await tx.task.updateMany({
          where: {
            columnId,
            position: {
              gte: position,
              lt: existingTask.position
            }
          },
          data: {
            position: { increment: 1 }
          }
        });
      }
    }

    // Update the task itself
    return await tx.task.update({
      where: { id },
      data: {
        columnId,
        position
      },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            boardId: true
          }
        }
      }
    });
  });

  logger.info(`Moved task: ${result.title} to column ${columnId} at position ${position}`);

  const response: ApiResponse<Task> = {
    data: result,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Task moved successfully'
  };

  res.status(200).json(response);
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if task exists
  const existingTask = await prisma.task.findUnique({ where: { id } });
  if (!existingTask) {
    throw createError('Task not found', 404);
  }

  // Use transaction to handle position updates
  await prisma.$transaction(async (tx) => {
    // Delete the task
    await tx.task.delete({ where: { id } });

    // Update positions of remaining tasks in the same column
    await tx.task.updateMany({
      where: {
        columnId: existingTask.columnId,
        position: { gt: existingTask.position }
      },
      data: {
        position: { decrement: 1 }
      }
    });
  });

  logger.info(`Deleted task: ${existingTask.title} (${id})`);

  const response: ApiResponse = {
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message: 'Task deleted successfully'
  };

  res.status(200).json(response);
});
