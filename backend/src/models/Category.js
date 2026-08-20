const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('income', 'expense', 'savings'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '🏷️'
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#3b82f6'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'type']
    }
  ]
});

module.exports = Category;
