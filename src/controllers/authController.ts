import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Hardcoded credentials
const HARDCODED_EMAIL = 'admin@kanban.com';
const HARDCODED_PASSWORD = 'admin123';

// Generate JWT token
const generateJWT = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Login with email and password
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createError('Invalid email format', 400);
  }

  try {
    // Check hardcoded credentials
    if (email.toLowerCase() !== HARDCODED_EMAIL.toLowerCase() || password !== HARDCODED_PASSWORD) {
      throw createError('Invalid email or password', 401);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: HARDCODED_EMAIL }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: HARDCODED_EMAIL,
          name: 'Admin User',
        }
      });
    }

    // Generate JWT token
    const jwtToken = generateJWT(user.id, user.email);

    logger.info('User logged in:', { userId: user.id, email: user.email });

    res.status(200).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token: jwtToken,
      },
      statusCode: 200,
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    } as ApiResponse<any>);
  } catch (error) {
    logger.error('Failed to login:', {
      error: error instanceof Error ? error.message : error,
      email
    });
    if (error instanceof Error && error.message.includes('Invalid email or password')) {
      throw error;
    }
    throw createError('Failed to login', 500);
  }
});

// Get current user profile
export const getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.status(200).json({
      data: user,
      statusCode: 200,
      message: 'User profile retrieved successfully',
      timestamp: new Date().toISOString(),
    } as ApiResponse<any>);
  } catch (error) {
    logger.error('Failed to get current user:', error);
    throw createError('Failed to get user profile', 500);
  }
});

// Update user profile
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { name } = req.body;

  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  if (!name || name.trim().length === 0) {
    throw createError('Name is required', 400);
  }

  if (name.trim().length > 100) {
    throw createError('Name must be less than 100 characters', 400);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      }
    });

    logger.info('User profile updated:', { userId, name: name.trim() });

    res.status(200).json({
      data: updatedUser,
      statusCode: 200,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString(),
    } as ApiResponse<any>);
  } catch (error) {
    logger.error('Failed to update user profile:', error);
    throw createError('Failed to update profile', 500);
  }
});

// Logout (invalidate token on client side)
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Since we're using stateless JWT tokens, logout is handled on the client side
  // We could implement a token blacklist here if needed
  
  res.status(200).json({
    data: { message: 'Logged out successfully' },
    statusCode: 200,
    message: 'Logout successful',
    timestamp: new Date().toISOString(),
  } as ApiResponse<any>);
});

// Clean up expired magic links (utility function)
export const cleanupExpiredMagicLinks = async (): Promise<void> => {
  try {
    const result = await prisma.magicLink.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired magic links`);
    }
  } catch (error) {
    logger.error('Failed to cleanup expired magic links:', error);
  }
};
