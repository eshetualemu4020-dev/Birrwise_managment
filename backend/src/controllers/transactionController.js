// src/controllers/transactionController.js
const Income = require('../models/Income');
const Expense = require('../models/Expense');

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch incomes
    const incomes = await Income.findAll({
      where: { userId },
      order: [['date', 'DESC']]
    });

    // Fetch expenses
    const expenses = await Expense.findAll({
      where: { userId },
      order: [['date', 'DESC']]
    });

    // Normalize and combine
    const transactions = [
      ...incomes.map(i => ({
        id: `inc_${i.id}`,
        originalId: i.id,
        type: 'income',
        amount: parseFloat(i.amount),
        date: i.date,
        category: 'Income', 
        source: i.source,
        description: i.description || i.source,
        createdAt: i.createdAt
      })),
      ...expenses.map(e => ({
        id: `exp_${e.id}`,
        originalId: e.id,
        type: 'expense',
        amount: parseFloat(e.amount),
        date: e.date,
        category: e.category,
        description: e.description || e.category,
        isPaid: e.isPaid,
        createdAt: e.createdAt
      }))
    ];

    // Sort combined by date DESC, then createdAt DESC
    transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
};
