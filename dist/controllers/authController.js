"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredMagicLinks = exports.logout = exports.updateProfile = exports.getCurrentUser = exports.verifyMagicLink = exports.sendMagicLink = void 0;
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../app");
const errorHandler_1 = require("../middleware/errorHandler");
const emailService_1 = require("../services/emailService");
const logger_1 = require("../utils/logger");
// Generate a secure random token
const generateMagicToken = () => {
    return (0, crypto_1.randomBytes)(32).toString('hex');
};
// Generate JWT token
const generateJWT = (userId, email) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jsonwebtoken_1.default.sign({ userId, email }, secret, { expiresIn: '7d' } // Token expires in 7 days
    );
};
// Send magic link
exports.sendMagicLink = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, name } = req.body;
    if (!email) {
        throw (0, errorHandler_1.createError)('Email is required', 400);
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw (0, errorHandler_1.createError)('Invalid email format', 400);
    }
    try {
        // Generate magic link token
        const token = generateMagicToken();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
        // Check if user exists
        let user = await app_1.prisma.user.findUnique({
            where: { email }
        });
        let isNewUser = false;
        if (!user && name) {
            // Create new user if they don't exist and name is provided
            user = await app_1.prisma.user.create({
                data: {
                    email,
                    name,
                }
            });
            isNewUser = true;
        }
        // Create magic link record
        await app_1.prisma.magicLink.create({
            data: {
                token,
                email,
                userId: user?.id,
                expiresAt,
            }
        });
        // Send magic link email
        await emailService_1.emailService.sendMagicLink(email, token, user?.name || undefined);
        // Send welcome email for new users
        if (isNewUser && user?.name) {
            await emailService_1.emailService.sendWelcomeEmail(email, user.name);
        }
        logger_1.logger.info('Magic link sent:', { email, isNewUser });
        res.status(200).json({
            data: {
                message: 'Magic link sent successfully',
                email,
                isNewUser,
            },
            statusCode: 200,
            message: 'Magic link sent to your email',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send magic link:', error);
        throw (0, errorHandler_1.createError)('Failed to send magic link', 500);
    }
});
// Verify magic link and authenticate user
exports.verifyMagicLink = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        throw (0, errorHandler_1.createError)('Token is required', 400);
    }
    try {
        // Find the magic link
        const magicLink = await app_1.prisma.magicLink.findUnique({
            where: { token },
            include: { user: true }
        });
        if (!magicLink) {
            throw (0, errorHandler_1.createError)('Invalid or expired magic link', 401);
        }
        // Check if token is expired
        if (new Date() > magicLink.expiresAt) {
            // Clean up expired token
            await app_1.prisma.magicLink.delete({
                where: { id: magicLink.id }
            });
            throw (0, errorHandler_1.createError)('Magic link has expired', 401);
        }
        // Check if token has already been used
        if (magicLink.usedAt) {
            throw (0, errorHandler_1.createError)('Magic link has already been used', 401);
        }
        let user = magicLink.user;
        // If user doesn't exist, create them
        if (!user) {
            user = await app_1.prisma.user.create({
                data: {
                    email: magicLink.email,
                }
            });
        }
        // Mark magic link as used
        await app_1.prisma.magicLink.update({
            where: { id: magicLink.id },
            data: { usedAt: new Date() }
        });
        // Generate JWT token
        const jwtToken = generateJWT(user.id, user.email);
        logger_1.logger.info('User authenticated via magic link:', { userId: user.id, email: user.email });
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
            message: 'Authentication successful',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to verify magic link:', error);
        if (error instanceof Error && (error.message.includes('expired') || error.message.includes('used'))) {
            throw error;
        }
        throw (0, errorHandler_1.createError)('Failed to verify magic link', 500);
    }
});
// Get current user profile
exports.getCurrentUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw (0, errorHandler_1.createError)('User not authenticated', 401);
    }
    try {
        const user = await app_1.prisma.user.findUnique({
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
            throw (0, errorHandler_1.createError)('User not found', 404);
        }
        res.status(200).json({
            data: user,
            statusCode: 200,
            message: 'User profile retrieved successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get current user:', error);
        throw (0, errorHandler_1.createError)('Failed to get user profile', 500);
    }
});
// Update user profile
exports.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { name } = req.body;
    if (!userId) {
        throw (0, errorHandler_1.createError)('User not authenticated', 401);
    }
    if (!name || name.trim().length === 0) {
        throw (0, errorHandler_1.createError)('Name is required', 400);
    }
    if (name.trim().length > 100) {
        throw (0, errorHandler_1.createError)('Name must be less than 100 characters', 400);
    }
    try {
        const updatedUser = await app_1.prisma.user.update({
            where: { id: userId },
            data: { name: name.trim() },
            select: {
                id: true,
                email: true,
                name: true,
                updatedAt: true,
            }
        });
        logger_1.logger.info('User profile updated:', { userId, name: name.trim() });
        res.status(200).json({
            data: updatedUser,
            statusCode: 200,
            message: 'Profile updated successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update user profile:', error);
        throw (0, errorHandler_1.createError)('Failed to update profile', 500);
    }
});
// Logout (invalidate token on client side)
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Since we're using stateless JWT tokens, logout is handled on the client side
    // We could implement a token blacklist here if needed
    res.status(200).json({
        data: { message: 'Logged out successfully' },
        statusCode: 200,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
    });
});
// Clean up expired magic links (utility function)
const cleanupExpiredMagicLinks = async () => {
    try {
        const result = await app_1.prisma.magicLink.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
        if (result.count > 0) {
            logger_1.logger.info(`Cleaned up ${result.count} expired magic links`);
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to cleanup expired magic links:', error);
    }
};
exports.cleanupExpiredMagicLinks = cleanupExpiredMagicLinks;
//# sourceMappingURL=authController.js.map