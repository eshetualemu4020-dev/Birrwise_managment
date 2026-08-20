// src/models/Budget.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Budget = sequelize.define('Budget', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true // If null, it's an overall budget
  },
  budgetType: {
    type: DataTypes.ENUM('overall', 'category'),
    allowNull: false,
    defaultValue: 'category'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  periodType: {
    type: DataTypes.ENUM('weekly', 'monthly', 'semester', 'custom'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  alertThreshold: {
    type: DataTypes.DECIMAL(5, 2), // Percentage, e.g., 80.00
    allowNull: true,
    defaultValue: 80.00
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'budgets',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['startDate'] },
    { fields: ['endDate'] }
  ]
});

module.exports = Budget;
