// src/models/BudgetPeriod.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BudgetPeriod = sequelize.define('BudgetPeriod', {
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
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  allocatedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  spentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'active', 'completed'),
    allowNull: false,
    defaultValue: 'upcoming'
  }
}, {
  tableName: 'budget_periods',
  timestamps: true,
  indexes: [
    { fields: ['budgetId'] },
    { fields: ['startDate'] },
    { fields: ['endDate'] }
  ]
});

module.exports = BudgetPeriod;
