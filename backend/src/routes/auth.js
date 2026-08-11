// src/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  isVerified: user.isVerified,
  studentId: user.studentId,
  institution: user.institution,
  kycStatus: user.kycStatus,
  pinLockEnabled: user.pinLockEnabled,
  appPin: user.appPin,
  role: user.role,
  isFrozen: user.isFrozen,
});

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Register endpoint — creates user and marks as verified immediately (no OTP required)
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already in use' });
    }
    const user = await User.create({
      username,
      email,
      phone: '',
      password,
      otpCode: null,
      isVerified: true,
    });

    res.json({
      message: 'Registration successful.',
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otpCode !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    user.isVerified = true;
    user.otpCode = null;
    await user.save();

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({
      message: 'OTP verified successfully',
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.isFrozen) {
      return res.status(403).json({
        message: 'Your account has been frozen by an administrator.',
        isFrozen: true,
        user: formatUser(user),
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile & status check
router.get('/me', authenticateToken, async (req, res) => {
  if (req.user.isFrozen) {
    return res.status(403).json({
      message: 'Your account has been frozen by an administrator.',
      isFrozen: true,
      user: formatUser(req.user),
    });
  }
  res.json({ user: formatUser(req.user) });
});

// KYC submission endpoint
router.post('/kyc', authenticateToken, async (req, res) => {
  const { studentId, institution } = req.body;
  if (!studentId || !institution) {
    return res.status(400).json({ message: 'Student ID and Institution are required' });
  }
  try {
    req.user.studentId = studentId;
    req.user.institution = institution;
    req.user.kycStatus = 'submitted';
    await req.user.save();

    res.json({ message: 'KYC submitted successfully', user: formatUser(req.user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving KYC' });
  }
});

// Admin: List all users
router.get('/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    res.json({ users: users.map(formatUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Admin: Freeze/Unfreeze user account
router.post('/admin/freeze-user', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const { userId, isFrozen } = req.body;
  try {
    const targetUser = await User.findByPk(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    targetUser.isFrozen = !!isFrozen;
    await targetUser.save();

    res.json({ message: `User account ${isFrozen ? 'frozen' : 'unfrozen'} successfully`, user: formatUser(targetUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating user freeze state' });
  }
});

module.exports = router;


