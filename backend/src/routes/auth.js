// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadConfig');

// Register endpoint
router.post('/register', authController.register);

// Verify OTP endpoint
router.post('/verify-otp', authController.verifyOtp);

// Login endpoint
router.post('/login', authController.login);

// Get current user profile & status check
router.get('/me', authenticateToken, authController.getMe);

// KYC submission endpoint
router.post('/kyc', authenticateToken, authController.submitKyc);

// Update own profile
router.put('/profile', authenticateToken, upload.single('profilePhoto'), authController.updateProfile);

// Change own password
router.put('/change-password', authenticateToken, authController.changePassword);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;


