import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Middleware to authenticate JWT token
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token is required', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw createError('JWT secret is not configured', 500);
    }

    // Verify the token
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token:', { error: error.message });
      return next(createError('Invalid access token', 401));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token');
      return next(createError('Access token has expired', 401));
    }

    logger.error('Authentication error:', error);
    next(error);
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // No token, continue without authentication
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(); // No secret configured, continue without authentication
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    logger.debug('Optional auth failed:', error);
    next();
  }
};

// Middleware to check if user owns a resource
export const checkResourceOwnership = (resourceType: 'board' | 'task' | 'column') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const resourceId = req.params.id;

      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      if (!resourceId) {
        throw createError('Resource ID is required', 400);
      }

      let resource;
      switch (resourceType) {
        case 'board':
          resource = await prisma.board.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          break;
        
        case 'task':
          resource = await prisma.task.findUnique({
            where: { id: resourceId },
            include: {
              column: {
                include: {
                  board: {
                    select: { userId: true }
                  }
                }
              }
            }
          });
          break;
        
        case 'column':
          resource = await prisma.column.findUnique({
            where: { id: resourceId },
            include: {
              board: {
                select: { userId: true }
              }
            }
          });
          break;
      }

      if (!resource) {
        throw createError(`${resourceType} not found`, 404);
      }

      // Check ownership based on resource type
      let ownerId: string;
      switch (resourceType) {
        case 'board':
          ownerId = (resource as any).userId;
          break;
        case 'task':
          ownerId = (resource as any).column.board.userId;
          break;
        case 'column':
          ownerId = (resource as any).board.userId;
          break;
      }

      if (ownerId !== userId) {
        throw createError('Access denied: You do not own this resource', 403);
      }

      next();
    } catch (error) {
      logger.error(`Resource ownership check failed for ${resourceType}:`, error);
      next(error);
    }
  };
};

// Export types for use in other files
export type { AuthenticatedRequest };
