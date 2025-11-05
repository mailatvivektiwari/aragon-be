"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Send magic link
router.post('/send-magic-link', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    validation_1.handleValidationErrors
], authController_1.sendMagicLink);
// Verify magic link
router.post('/verify-magic-link', [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .isLength({ min: 64, max: 64 })
        .withMessage('Valid token is required'),
    validation_1.handleValidationErrors
], authController_1.verifyMagicLink);
// Get current user (protected route)
router.get('/me', auth_1.authenticateToken, authController_1.getCurrentUser);
// Update user profile (protected route)
router.put('/profile', [
    auth_1.authenticateToken,
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name is required and must be between 1 and 100 characters'),
    validation_1.handleValidationErrors
], authController_1.updateProfile);
// Logout (protected route)
router.post('/logout', auth_1.authenticateToken, authController_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map