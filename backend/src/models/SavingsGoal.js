// src/models/SavingsGoal.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SavingsGoal = sequelize.define('SavingsGoal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: true },
  targetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  savedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  targetDate: { type: DataTypes.DATEONLY, allowNull: false },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  description: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'savings_goals',
  timestamps: true,
  indexes: [{ fields: ['userId'] }, { fields: ['status'] }, { fields: ['targetDate'] }]
});

module.exports = SavingsGoal;
