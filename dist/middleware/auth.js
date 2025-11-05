"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkResourceOwnership = exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../app");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            throw (0, errorHandler_1.createError)('Access token is required', 401);
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw (0, errorHandler_1.createError)('JWT secret is not configured', 500);
        }
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Get user from database to ensure they still exist
        const user = await app_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
            }
        });
        if (!user) {
            throw (0, errorHandler_1.createError)('User not found', 401);
        }
        // Attach user to request object
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.logger.warn('Invalid JWT token:', { error: error.message });
            return next((0, errorHandler_1.createError)('Invalid access token', 401));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.logger.warn('Expired JWT token');
            return next((0, errorHandler_1.createError)('Access token has expired', 401));
        }
        logger_1.logger.error('Authentication error:', error);
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
// Optional authentication middleware (doesn't throw error if no token)
const optionalAuth = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await app_1.prisma.user.findUnique({
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
    }
    catch (error) {
        // Ignore authentication errors in optional auth
        logger_1.logger.debug('Optional auth failed:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
// Middleware to check if user owns a resource
const checkResourceOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const resourceId = req.params.id;
            if (!userId) {
                throw (0, errorHandler_1.createError)('User not authenticated', 401);
            }
            if (!resourceId) {
                throw (0, errorHandler_1.createError)('Resource ID is required', 400);
            }
            let resource;
            switch (resourceType) {
                case 'board':
                    resource = await app_1.prisma.board.findUnique({
                        where: { id: resourceId },
                        select: { userId: true }
                    });
                    break;
                case 'task':
                    resource = await app_1.prisma.task.findUnique({
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
                    resource = await app_1.prisma.column.findUnique({
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
                throw (0, errorHandler_1.createError)(`${resourceType} not found`, 404);
            }
            // Check ownership based on resource type
            let ownerId;
            switch (resourceType) {
                case 'board':
                    ownerId = resource.userId;
                    break;
                case 'task':
                    ownerId = resource.column.board.userId;
                    break;
                case 'column':
                    ownerId = resource.board.userId;
                    break;
            }
            if (ownerId !== userId) {
                throw (0, errorHandler_1.createError)('Access denied: You do not own this resource', 403);
            }
            next();
        }
        catch (error) {
            logger_1.logger.error(`Resource ownership check failed for ${resourceType}:`, error);
            next(error);
        }
    };
};
exports.checkResourceOwnership = checkResourceOwnership;
//# sourceMappingURL=auth.js.map