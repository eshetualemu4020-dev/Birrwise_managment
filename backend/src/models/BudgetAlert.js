// src/models/BudgetAlert.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BudgetAlert = sequelize.define('BudgetAlert', {
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
  alertType: {
    type: DataTypes.ENUM('50_percent', '75_percent', '80_percent', '90_percent', 'exceeded', 'deadline'),
    allowNull: false
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'budget_alerts',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['budgetId'] },
    { fields: ['isRead'] }
  ]
});

module.exports = BudgetAlert;
