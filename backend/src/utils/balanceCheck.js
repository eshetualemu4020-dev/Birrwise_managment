const { Op } = require('sequelize');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const SavingsContribution = require('../models/SavingsContribution');

exports.checkAvailableBalance = async (userId, requestedAmount, options = {}) => {
  const { excludeExpenseId, excludeBudgetId, excludeGoalId } = options;
  
  // 1. Total Income
  const incomes = await Income.findAll({ where: { userId } });
  const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

  // 2. Total Expenses
  const expWhere = { userId };
  if (excludeExpenseId) expWhere.id = { [Op.ne]: excludeExpenseId };
  const expenses = await Expense.findAll({ where: expWhere });
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  // 3. Total Budgets
  const budWhere = { userId, status: { [Op.ne]: 'archived' } };
  if (excludeBudgetId) budWhere.id = { [Op.ne]: excludeBudgetId };
  const budgets = await Budget.findAll({ where: budWhere });
  const totalBudgets = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

  // 4. Total Savings Goals (using targetAmount as requested by strict limit, or fallback to saved contributions if preferred. We will use targetAmount to be strict on allocation)
  const sgWhere = { userId };
  if (excludeGoalId) sgWhere.id = { [Op.ne]: excludeGoalId };
  const goals = await SavingsGoal.findAll({ where: sgWhere });
  const totalGoals = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount || 0), 0);

  const totalAllocated = totalExpenses + totalBudgets + totalGoals;

  if (totalAllocated + parseFloat(requestedAmount) > totalIncome) {
    throw new Error(`Insufficient funds. Total Income: ${totalIncome}, Allocated: ${totalAllocated}, Requested: ${requestedAmount}`);
  }
  return true;
};
