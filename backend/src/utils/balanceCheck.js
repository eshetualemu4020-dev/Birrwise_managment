const { Op } = require('sequelize');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const SavingsContribution = require('../models/SavingsContribution');

exports.checkAvailableBalance = async (userId, requestedAmount, options = {}) => {
  const { excludeExpenseId, excludeBudgetId, excludeGoalId, isExpense } = options;
  
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

  // 4. Total Savings Goals (exclude archived goals)
  const sgWhere = { userId, status: { [Op.ne]: 'archived' } };
  if (excludeGoalId) sgWhere.id = { [Op.ne]: excludeGoalId };
  const goals = await SavingsGoal.findAll({ where: sgWhere });
  const totalGoals = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount || 0), 0);

  // If we are checking for an expense, we only strictly enforce that total expenses don't exceed total income.
  // Including budgets/goals would double count the expense against the budget it is consuming.
  if (options.isExpense) {
    if (totalExpenses + parseFloat(requestedAmount) > totalIncome) {
      throw new Error(`Insufficient funds for this expense. Total Income: ${totalIncome}, Total Expenses: ${totalExpenses}, Requested: ${requestedAmount}`);
    }
    return true;
  }

  const totalAllocated = totalExpenses + totalBudgets + totalGoals;

  // We add a softer check for budget/goals: we warn but don't strictly block if it's just budget allocation 
  // overlapping with expenses. But since this throws an error, let's just use a simplified check:
  // For Budgets and Goals, we check if the NEW allocation exceeds income.
  if (totalAllocated + parseFloat(requestedAmount) > totalIncome) {
    throw new Error(`Insufficient funds. Total Income: ${totalIncome}, Allocated: ${totalAllocated}, Requested: ${requestedAmount}`);
  }
  return true;
};
