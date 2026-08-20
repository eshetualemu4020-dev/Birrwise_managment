const { Op } = require('sequelize');
const Budget = require('../models/Budget');
const BudgetPeriod = require('../models/BudgetPeriod');
const BudgetAlert = require('../models/BudgetAlert');
const BudgetHistory = require('../models/BudgetHistory');
const Expense = require('../models/Expense');
const { checkAvailableBalance } = require('../utils/balanceCheck');

exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.findAll({
      where: { userId: req.user.id },
      include: [
        { model: BudgetPeriod },
        { model: BudgetAlert, where: { isRead: false }, required: false }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate spent amount dynamically
    const enrichedBudgets = await Promise.all(budgets.map(async (budget) => {
      const budgetObj = budget.toJSON();
      
      // Find expenses matching criteria for active period
      const activePeriod = budgetObj.BudgetPeriods.find(p => p.status === 'active' || p.status === 'upcoming') 
                          || budgetObj.BudgetPeriods[0];
                          
      if (activePeriod) {
        const expenseWhere = {
          userId: req.user.id,
          date: {
            [Op.between]: [activePeriod.startDate, activePeriod.endDate]
          }
        };

        if (budget.budgetType === 'category' && budget.category) {
          expenseWhere.category = budget.category;
        }

        const expenses = await Expense.findAll({ where: expenseWhere });
        const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        
        activePeriod.spentAmount = totalSpent;
        activePeriod.remainingAmount = parseFloat(budget.amount) - totalSpent;
        activePeriod.percentageUsed = (totalSpent / parseFloat(budget.amount)) * 100;
        
        budgetObj.spentAmount = activePeriod.spentAmount;
        budgetObj.remainingAmount = activePeriod.remainingAmount;
        budgetObj.percentageUsed = activePeriod.percentageUsed;
      }
      
      return budgetObj;
    }));

    res.json({ budgets: enrichedBudgets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving budgets' });
  }
};

exports.createBudget = async (req, res) => {
  const { name, category, budgetType, amount, periodType, startDate, endDate, alertThreshold, isRecurring } = req.body;
  
  if (!name || !amount || !startDate || !endDate) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const d = new Date();
  const todayYMD = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  if (endDate < todayYMD) {
    return res.status(400).json({ message: 'End date cannot be in the past' });
  }

  if (endDate < startDate) {
    return res.status(400).json({ message: 'End date cannot be before start date' });
  }

  try {
    try {
      await checkAvailableBalance(req.user.id, amount);
    } catch (balanceError) {
      return res.status(400).json({ message: balanceError.message });
    }

    const budget = await Budget.create({
      userId: req.user.id,
      name,
      category,
      budgetType: budgetType || 'category',
      amount: parseFloat(amount),
      periodType: periodType || 'monthly',
      startDate,
      endDate,
      alertThreshold: parseFloat(alertThreshold || 80),
      isRecurring: !!isRecurring
    });

    // Create initial period
    await BudgetPeriod.create({
      budgetId: budget.id,
      startDate,
      endDate,
      allocatedAmount: parseFloat(amount),
      status: 'active'
    });

    // Create history entry
    await BudgetHistory.create({
      budgetId: budget.id,
      userId: req.user.id,
      action: 'created',
      newAmount: parseFloat(amount),
      description: 'Budget created'
    });

    res.status(201).json({ message: 'Budget created successfully', budget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating budget' });
  }
};

exports.updateBudget = async (req, res) => {
  const { name, category, amount, periodType, startDate, endDate, alertThreshold, isRecurring } = req.body;
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    const newStartDate = startDate !== undefined ? startDate : budget.startDate;
    const newEndDate = endDate !== undefined ? endDate : budget.endDate;

    const d = new Date();
    const todayYMD = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    if (endDate !== undefined && endDate !== budget.endDate && endDate < todayYMD) {
      return res.status(400).json({ message: 'End date cannot be changed to a past date' });
    }

    if (endDate !== undefined && newEndDate < newStartDate) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    if (amount !== undefined) {
      const diff = parseFloat(amount) - budget.amount;
      if (diff > 0) {
        try {
          await checkAvailableBalance(req.user.id, diff, null, budget.id);
        } catch (balanceError) {
          return res.status(400).json({ message: balanceError.message });
        }
      }
    }

    const oldAmount = budget.amount;
    
    if (name !== undefined) budget.name = name;
    if (category !== undefined) budget.category = category;
    if (amount !== undefined) budget.amount = parseFloat(amount);
    if (periodType !== undefined) budget.periodType = periodType;
    if (startDate !== undefined) budget.startDate = startDate;
    if (endDate !== undefined) budget.endDate = endDate;
    if (alertThreshold !== undefined) budget.alertThreshold = parseFloat(alertThreshold);
    if (isRecurring !== undefined) budget.isRecurring = !!isRecurring;

    await budget.save();

    if (amount !== undefined && oldAmount !== budget.amount) {
      await BudgetHistory.create({
        budgetId: budget.id,
        userId: req.user.id,
        action: 'updated',
        oldAmount,
        newAmount: budget.amount,
        description: 'Budget amount updated'
      });
      
      // Update active period allocated amount
      await BudgetPeriod.update(
        { allocatedAmount: budget.amount },
        { where: { budgetId: budget.id, status: 'active' } }
      );
    }

    res.json({ message: 'Budget updated successfully', budget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating budget' });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    
    await budget.destroy();
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting budget' });
  }
};

exports.duplicateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    // Determine new dates safely
    const oldStart = new Date(budget.startDate);
    const oldEnd = new Date(budget.endDate);
    const duration = oldEnd - oldStart;
    
    const newStart = new Date(oldEnd.getTime() + 86400000); // add 1 day
    const newEnd = new Date(newStart.getTime() + duration);

    const newBudget = await Budget.create({
      userId: req.user.id,
      name: `${budget.name} (Copy)`,
      category: budget.category,
      budgetType: budget.budgetType,
      amount: budget.amount,
      periodType: budget.periodType,
      startDate: newStart.toISOString().slice(0,10),
      endDate: newEnd.toISOString().slice(0,10),
      alertThreshold: budget.alertThreshold,
      isRecurring: budget.isRecurring
    });

    await BudgetPeriod.create({
      budgetId: newBudget.id,
      startDate: newStart.toISOString().slice(0,10),
      endDate: newEnd.toISOString().slice(0,10),
      allocatedAmount: newBudget.amount,
      status: 'active'
    });

    res.status(201).json({ message: 'Budget duplicated successfully', budget: newBudget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error duplicating budget' });
  }
};

exports.togglePause = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    budget.status = budget.status === 'paused' ? 'active' : 'paused';
    await budget.save();

    await BudgetHistory.create({
      budgetId: budget.id,
      userId: req.user.id,
      action: budget.status === 'paused' ? 'paused' : 'resumed',
      description: `Budget ${budget.status}`
    });

    res.json({ message: `Budget ${budget.status} successfully`, budget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling budget status' });
  }
};

exports.archiveBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    budget.status = 'archived';
    await budget.save();

    await BudgetHistory.create({
      budgetId: budget.id,
      userId: req.user.id,
      action: 'archived',
      description: 'Budget archived'
    });

    res.json({ message: 'Budget archived successfully', budget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error archiving budget' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const budgets = await Budget.findAll({
      where: { userId: req.user.id, status: { [Op.ne]: 'archived' } },
      include: [{ model: BudgetPeriod }]
    });

    let totalBudget = 0;
    let totalSpent = 0;
    let activeCount = 0;
    let overBudgetCount = 0;

    await Promise.all(budgets.map(async (budget) => {
      if (budget.status === 'active') {
        activeCount++;
      }

      const activePeriod = budget.BudgetPeriods.find(p => p.status === 'active' || p.status === 'upcoming') 
                          || budget.BudgetPeriods[0];
                          
      if (activePeriod) {
        totalBudget += parseFloat(budget.amount);
        
        const expenseWhere = {
          userId: req.user.id,
          date: {
            [Op.between]: [activePeriod.startDate, activePeriod.endDate]
          }
        };

        if (budget.budgetType === 'category' && budget.category) {
          expenseWhere.category = budget.category;
        }

        const expenses = await Expense.findAll({ where: expenseWhere });
        const spent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        totalSpent += spent;
        
        if (spent > parseFloat(budget.amount)) {
          overBudgetCount++;
        }
      }
    }));

    const remaining = totalBudget - totalSpent;
    const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    res.json({
      totalBudget,
      totalSpent,
      remaining,
      utilization: parseFloat(utilization.toFixed(2)),
      activeBudgets: activeCount,
      overBudgetCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving budget summary' });
  }
};
