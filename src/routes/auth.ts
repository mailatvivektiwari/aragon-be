import { Router } from 'express';
import { body } from 'express-validator';
import {
  login,
  getCurrentUser,
  updateProfile,
  logout,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Login with email and password
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
], login);

// Get current user (protected route)
router.get('/me', authenticateToken, getCurrentUser);

// Update user profile (protected route)
router.put('/profile', [
  authenticateToken,
  body('name')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  handleValidationErrors
], updateProfile);

// Logout (protected route)
router.post('/logout', authenticateToken, logout);

export default router;
