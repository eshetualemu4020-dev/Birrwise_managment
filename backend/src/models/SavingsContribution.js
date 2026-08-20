// src/models/SavingsContribution.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SavingsContribution = sequelize.define('SavingsContribution', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  goalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'savings_goals', key: 'id' },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  contributionDate: { type: DataTypes.DATEONLY, allowNull: false },
  source: { type: DataTypes.STRING, allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'savings_contributions',
  timestamps: true,
  indexes: [{ fields: ['goalId'] }, { fields: ['userId'] }]
});

module.exports = SavingsContribution;
