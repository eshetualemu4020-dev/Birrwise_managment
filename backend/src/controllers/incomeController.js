const Income = require('../models/Income');

exports.getIncomes = async (req, res) => {
  try {
    const incomes = await Income.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json({ incomes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving incomes' });
  }
};

exports.createIncome = async (req, res) => {
  const { amount, source, date, description, isRecurring, recurrenceInterval, remindMe } = req.body;
  if (!amount || !source || !date) {
    return res.status(400).json({ message: 'Amount, source and date are required' });
  }
  try {
    const income = await Income.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      source,
      date,
      description,
      isRecurring: !!isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : null,
      remindMe: !!remindMe
    });
    res.status(201).json({ message: 'Income recorded successfully', income });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error recording income' });
  }
};

exports.updateIncome = async (req, res) => {
  const { amount, source, date, description, isRecurring, recurrenceInterval, remindMe } = req.body;
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    if (amount !== undefined) income.amount = parseFloat(amount);
    if (source !== undefined) income.source = source;
    if (date !== undefined) income.date = date;
    if (description !== undefined) income.description = description;
    if (isRecurring !== undefined) income.isRecurring = !!isRecurring;
    if (recurrenceInterval !== undefined) income.recurrenceInterval = isRecurring ? recurrenceInterval : null;
    if (remindMe !== undefined) income.remindMe = !!remindMe;

    await income.save();
    res.json({ message: 'Income record updated successfully', income });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating income' });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }
    await income.destroy();
    res.json({ message: 'Income record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting income' });
  }
};
