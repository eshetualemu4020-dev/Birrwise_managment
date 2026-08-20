// src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING, allowNull: true },
  password: { type: DataTypes.STRING, allowNull: false },
  otpCode: { type: DataTypes.STRING, allowNull: true },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  studentId: { type: DataTypes.STRING, allowNull: true },
  institution: { type: DataTypes.STRING, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  year: { type: DataTypes.INTEGER, allowNull: true },
  semester: { type: DataTypes.STRING, allowNull: true },
  kycStatus: { type: DataTypes.STRING, defaultValue: 'pending' },
  pinLockEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  appPin: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, defaultValue: 'user' },
  isFrozen: { type: DataTypes.BOOLEAN, defaultValue: false }, // Legacy field, keeping for compatibility if needed
  accountStatus: { type: DataTypes.STRING, defaultValue: 'Pending' }, // 'Active', 'Inactive', 'Suspended', 'Pending'
  currency: { type: DataTypes.STRING, defaultValue: 'ETB' },
  dateFormat: { type: DataTypes.STRING, defaultValue: 'MM/DD/YYYY' },
  language: { type: DataTypes.STRING, defaultValue: 'en' },
  theme: { type: DataTypes.STRING, defaultValue: 'light' },
  profilePhoto: { type: DataTypes.TEXT, allowNull: true },
  lastLogin: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
});

module.exports = User;

