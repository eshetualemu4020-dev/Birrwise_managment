// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenses');
const User = require('./models/User');
const Income = require('./models/Income');
const Expense = require('./models/Expense');

// Setup Associations
User.hasMany(Income,  { foreignKey: 'userId', onDelete: 'CASCADE' });
Income.belongsTo(User,  { foreignKey: 'userId' });
User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId' });

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

app.use(express.json());

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

const PORT = process.env.PORT || 5000;

sequelize.sync({ force: false }).then(async () => {
  console.log('✅ Database synced – tables created automatically');

  // Seed default admin user if not existing
  const adminEmail = 'admin@example.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await User.create({
      username: 'admin',
      email: adminEmail,
      phone: '+15550001111',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
    });
    console.log('👑 Admin user created: admin@example.com / admin123');
  }

  // Seed default advisor user if not existing
  const advisorEmail = 'advisor@example.com';
  const existingAdvisor = await User.findOne({ where: { email: advisorEmail } });
  if (!existingAdvisor) {
    await User.create({
      username: 'advisor',
      email: advisorEmail,
      phone: '+15550003333',
      password: 'advisor123',
      role: 'advisor',
      isVerified: true,
    });
    console.log('💼 Advisor user created: advisor@example.com / advisor123');
  }

  // Seed default student user if not existing
  const studentEmail = 'student@example.com';
  const existingStudent = await User.findOne({ where: { email: studentEmail } });
  if (!existingStudent) {
    await User.create({
      username: 'student',
      email: studentEmail,
      phone: '+15550002222',
      password: 'student123',
      role: 'student',
      isVerified: true,
    });
    console.log('🎓 Student user created: student@example.com / student123');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to sync database:', err.message);
});



