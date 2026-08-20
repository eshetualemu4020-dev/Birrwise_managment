const cron = require('node-cron');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const BudgetAlert = require('../models/BudgetAlert');
const { Op } = require('sequelize');

// Utility to generate next date based on recurrence interval
const getNextDate = (currentDate, interval) => {
  const date = new Date(currentDate);
  if (interval === 'daily') date.setDate(date.getDate() + 1);
  else if (interval === 'weekly') date.setDate(date.getDate() + 7);
  else if (interval === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (interval === 'yearly') date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
};

const processRecurringTransactions = async () => {
  console.log('Running recurring transactions check...');
  const today = new Date().toISOString().split('T')[0];

  try {
    // Process Incomes
    const incomes = await Income.findAll({
      where: {
        isRecurring: true,
        date: { [Op.lte]: today }
      }
    });

    for (const income of incomes) {
      // Create new instance for today if it matches (simplistic approach for demo)
      // A more robust approach tracks the "lastProcessedDate"
      const nextDate = getNextDate(income.date, income.recurrenceInterval);
      
      // Update the existing record's date to the next recurrence date
      // This effectively "moves" the recurrence forward after we've processed it
      // Wait, we should insert a copy and keep the history!
      // But since we are creating it, we can just insert a new one for today,
      // and update the old one to isRecurring = false? No, we update the recurring template.
      
      // Actually, a better approach for this MVP:
      // We assume the current `income` is the "template".
      if (income.date < today) {
        // Create the historical entry
        await Income.create({
          userId: income.userId,
          amount: income.amount,
          source: income.source,
          date: today,
          description: income.description,
          isRecurring: false, // The generated instance is not the template
        });
        
        // Update template to next date
        income.date = nextDate;
        await income.save();
      }
    }

    // Process Expenses Similarly
    const expenses = await Expense.findAll({
      where: {
        isRecurring: true,
        date: { [Op.lte]: today }
      }
    });

    for (const expense of expenses) {
      if (expense.date < today) {
        await Expense.create({
          userId: expense.userId,
          categoryId: expense.categoryId,
          amount: expense.amount,
          date: today,
          description: expense.description,
          isRecurring: false,
        });
        
        expense.date = getNextDate(expense.date, expense.recurrenceInterval);
        await expense.save();
      }
    }
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
  }
};

const processBudgetAlerts = async () => {
  console.log('Running budget alert checks...');
  try {
    const budgets = await Budget.findAll();
    
    for (const budget of budgets) {
      const expenses = await Expense.sum('amount', {
        where: {
          categoryId: budget.categoryId,
          userId: budget.userId
        }
      });
      
      const spent = expenses || 0;
      const percentage = (spent / budget.amount) * 100;
      
      if (percentage >= 80) {
        // Check if alert already exists for this percentage threshold to avoid spam
        const existingAlert = await BudgetAlert.findOne({
          where: {
            userId: budget.userId,
            budgetId: budget.id,
            isRead: false
          }
        });

        if (!existingAlert) {
          let message = `You have used ${percentage.toFixed(1)}% of your ${budget.amount} budget.`;
          if (percentage >= 100) message = `You have EXCEEDED your budget!`;
          
          await BudgetAlert.create({
            userId: budget.userId,
            budgetId: budget.id,
            message: message,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing budget alerts:', error);
  }
};

// Initialize Cron Jobs
const initCronJobs = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('--- Starting Daily Cron Jobs ---');
    await processRecurringTransactions();
    await processBudgetAlerts();
    console.log('--- Finished Daily Cron Jobs ---');
  });
  
  console.log('Cron jobs initialized. Scheduled for midnight daily.');
};

module.exports = initCronJobs;
