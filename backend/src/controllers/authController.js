const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  role: user.role,
  studentId: user.studentId,
  institution: user.institution,
  department: user.department,
  year: user.year,
  semester: user.semester,
  kycStatus: user.kycStatus,
  currency: user.currency,
  dateFormat: user.dateFormat,
  language: user.language,
  theme: user.theme,
  profilePhoto: user.profilePhoto,
  lastLogin: user.lastLogin,
  isFrozen: user.isFrozen,
  isVerified: user.isVerified
});

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = await User.create({ username, email, password });
    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ token, user: formatUser(newUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.verifyOtp = async (req, res) => {
  // Stub for verify OTP if needed by frontend
  res.json({ message: 'OTP Verified successfully' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.isFrozen || user.accountStatus === 'Suspended') {
      return res.status(403).json({
        message: 'Your account has been suspended by an administrator.',
        isFrozen: true,
        user: formatUser(user),
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  if (req.user.isFrozen) {
    return res.status(403).json({
      message: 'Your account has been frozen by an administrator.',
      isFrozen: true,
      user: formatUser(req.user),
    });
  }
  res.json({ user: formatUser(req.user) });
};

exports.submitKyc = async (req, res) => {
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
};

exports.updateProfile = async (req, res) => {
  const { 
    username, email, phone,
    studentId, institution, department, year, semester,
    currency, dateFormat, language, theme
  } = req.body;
  
  let profilePhoto = req.body.profilePhoto;
  if (req.file) {
    profilePhoto = `/uploads/profiles/${req.file.filename}`;
  }

  try {
    if (username && username !== req.user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(400).json({ message: 'Username already taken' });
      req.user.username = username;
    }
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      req.user.email = email;
    }
    if (phone !== undefined) req.user.phone = phone;

    if (studentId !== undefined) req.user.studentId = studentId;
    if (institution !== undefined) req.user.institution = institution;
    if (department !== undefined) req.user.department = department;
    if (year !== undefined) req.user.year = year;
    if (semester !== undefined) req.user.semester = semester;

    if (currency !== undefined) req.user.currency = currency;
    if (dateFormat !== undefined) req.user.dateFormat = dateFormat;
    if (language !== undefined) req.user.language = language;
    if (theme !== undefined) req.user.theme = theme;
    if (profilePhoto !== undefined) req.user.profilePhoto = profilePhoto;

    await req.user.save();
    res.json({ message: 'Profile updated successfully', user: formatUser(req.user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  try {
    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword; 
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error changing password' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ message: 'If that email is registered, a password reset link has been sent.' });
    }
    
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    await emailService.sendPasswordResetEmail(email, resetToken);
    
    res.json({ message: 'If that email is registered, a password reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
