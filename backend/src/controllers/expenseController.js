const Expense = require('../models/Expense');
const { checkAvailableBalance } = require('../utils/balanceCheck');

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving expenses' });
  }
};

exports.createExpense = async (req, res) => {
  const { amount, category, date, description, receiptNote, isRecurring, recurrenceInterval, remindMe, isPaused, isPaid } = req.body;
  if (!amount || !category || !date) {
    return res.status(400).json({ message: 'Amount, category and date are required' });
  }
  try {
    try {
      await checkAvailableBalance(req.user.id, amount);
    } catch (balanceError) {
      return res.status(400).json({ message: balanceError.message });
    }

    const expense = await Expense.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      category,
      date,
      description,
      receiptNote,
      isRecurring: !!isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : null,
      remindMe: !!remindMe,
      isPaused: !!isPaused,
      isPaid: isPaid !== undefined ? !!isPaid : true
    });
    res.status(201).json({ message: 'Expense recorded successfully', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error recording expense' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    
    if (req.body.amount !== undefined) {
      const diff = parseFloat(req.body.amount) - expense.amount;
      if (diff > 0) {
        try {
          await checkAvailableBalance(req.user.id, diff, expense.id);
        } catch (balanceError) {
          return res.status(400).json({ message: balanceError.message });
        }
      }
    }

    const fields = ['amount', 'category', 'date', 'description', 'receiptNote', 'isRecurring', 'recurrenceInterval', 'remindMe', 'isPaused', 'isPaid'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'amount') expense.amount = parseFloat(req.body[f]);
        else if (['isRecurring', 'remindMe', 'isPaused', 'isPaid'].includes(f)) expense[f] = !!req.body[f];
        else expense[f] = req.body[f];
      }
    });
    if (req.body.isRecurring === false) expense.recurrenceInterval = null;
    await expense.save();
    res.json({ message: 'Expense updated', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating expense' });
  }
};

exports.togglePause = async (req, res) => {
  try {
    const expense = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    expense.isPaused = !expense.isPaused;
    await expense.save();
    res.json({ message: `Expense ${expense.isPaused ? 'paused' : 'resumed'}`, expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling pause' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const expense = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    expense.isPaid = true;
    await expense.save();
    res.json({ message: 'Payment confirmed', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error confirming payment' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await expense.destroy();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
};
