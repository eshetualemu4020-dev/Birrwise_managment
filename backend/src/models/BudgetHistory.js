// src/models/BudgetHistory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BudgetHistory = sequelize.define('BudgetHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  budgetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'budgets', key: 'id' },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  action: {
    type: DataTypes.ENUM('created', 'updated', 'paused', 'resumed', 'completed', 'archived', 'deleted'),
    allowNull: false
  },
  oldAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  newAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'budget_history',
  timestamps: true,
  updatedAt: false // We generally only need createdAt for history logs
});

module.exports = BudgetHistory;
