// src/models/Income.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Income = sequelize.define('Income', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurrenceInterval: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remindMe: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'incomes',
  timestamps: true
});

module.exports = Income;
