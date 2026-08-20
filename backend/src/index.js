// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets');
const savingsGoalRoutes = require('./routes/savingsGoals');
const transactionRoutes = require('./routes/transactions');
const publicCategoryRoutes = require('./routes/publicCategoryRoutes');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const initCronJobs = require('./jobs/cronJobs');
const User = require('./models/User');
const Income = require('./models/Income');
const Expense = require('./models/Expense');
const Budget = require('./models/Budget');
const BudgetPeriod = require('./models/BudgetPeriod');
const BudgetAlert = require('./models/BudgetAlert');
const BudgetHistory = require('./models/BudgetHistory');
const SavingsGoal = require('./models/SavingsGoal');
const SavingsContribution = require('./models/SavingsContribution');
const Category = require('./models/Category');

// Setup Associations
User.hasMany(Income,  { foreignKey: 'userId', onDelete: 'CASCADE' });
Income.belongsTo(User,  { foreignKey: 'userId' });
User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });
Budget.hasMany(BudgetPeriod, { foreignKey: 'budgetId', onDelete: 'CASCADE' });
BudgetPeriod.belongsTo(Budget, { foreignKey: 'budgetId' });
Budget.hasMany(BudgetAlert, { foreignKey: 'budgetId', onDelete: 'CASCADE' });
BudgetAlert.belongsTo(Budget, { foreignKey: 'budgetId' });
User.hasMany(BudgetAlert, { foreignKey: 'userId', onDelete: 'CASCADE' });
BudgetAlert.belongsTo(User, { foreignKey: 'userId' });
Budget.hasMany(BudgetHistory, { foreignKey: 'budgetId', onDelete: 'CASCADE' });
BudgetHistory.belongsTo(Budget, { foreignKey: 'budgetId' });
User.hasMany(BudgetHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
BudgetHistory.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SavingsGoal, { foreignKey: 'userId', onDelete: 'CASCADE' });
SavingsGoal.belongsTo(User, { foreignKey: 'userId' });
SavingsGoal.hasMany(SavingsContribution, { foreignKey: 'goalId', onDelete: 'CASCADE' });
SavingsContribution.belongsTo(SavingsGoal, { foreignKey: 'goalId' });
SavingsContribution.belongsTo(User, { foreignKey: 'userId' });

const app = express();

// Allow requests from any local frontend dev server (e.g. 5173, 5174, 3000)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Stricter Rate Limiter for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased for development
  message: { message: 'Too many login attempts, please try again after 15 minutes' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root & Health check endpoints
app.get(['/', '/api', '/api/health'], (req, res) => {
  res.json({
    status: 'OK',
    message: '🚀 Backend API is running successfully',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings-goals', savingsGoalRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', publicCategoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;

// Manually add columns that may be missing in existing SQLite tables
async function migrateColumns() {
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable('users').catch(() => null);
  if (cols) {
    const userCols = [
      ['accountStatus', "VARCHAR(255) DEFAULT 'Pending'"],
      ['lastLogin', "DATETIME"],
      ['department', "VARCHAR(255)"],
      ['studentId', "VARCHAR(255)"],
      ['institution', "VARCHAR(255)"],
      ['year', "INTEGER"],
      ['semester', "VARCHAR(255)"],
      ['otpCode', "VARCHAR(255)"],
      ['isVerified', "BOOLEAN DEFAULT 0"],
      ['kycStatus', "VARCHAR(255) DEFAULT 'pending'"],
      ['pinLockEnabled', "BOOLEAN DEFAULT 0"],
      ['appPin', "VARCHAR(255)"],
      ['role', "VARCHAR(255) DEFAULT 'user'"],
      ['isFrozen', "BOOLEAN DEFAULT 0"],
      ['currency', "VARCHAR(255) DEFAULT 'ETB'"],
      ['dateFormat', "VARCHAR(255) DEFAULT 'MM/DD/YYYY'"],
      ['language', "VARCHAR(255) DEFAULT 'en'"],
      ['theme', "VARCHAR(255) DEFAULT 'light'"],
      ['profilePhoto', "TEXT"]
    ];

    for (const [colName, colType] of userCols) {
      if (!cols[colName]) {
        await sequelize.query(`ALTER TABLE users ADD COLUMN ${colName} ${colType}`).catch(() => {});
      }
    }
  }

  const catCols = await qi.describeTable('categories').catch(() => null);
  if (catCols) {
    if (!catCols.description) {
      await sequelize.query("ALTER TABLE categories ADD COLUMN description TEXT").catch(() => {});
    }
    if (!catCols.status) {
      await sequelize.query("ALTER TABLE categories ADD COLUMN status VARCHAR(255) DEFAULT 'active'").catch(() => {});
    }
  }
}

migrateColumns().catch(() => {}).then(() => {
sequelize.sync({ force: false }).then(async () => {
  console.log('✅ Database synced – tables created automatically');


  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    // Initialize background jobs
    initCronJobs();
  });
}).catch(err => {
  console.error('❌ Failed to sync database:', err.message);
});
}); // end migrateColumns



