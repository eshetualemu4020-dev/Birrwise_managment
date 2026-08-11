// src/routes/expenses.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// GET all expenses for authenticated user
router.get('/', authenticateToken, async (req, res) => {
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
});

// POST new expense
router.post('/', authenticateToken, async (req, res) => {
  const { amount, category, date, description, receiptNote, isRecurring, recurrenceInterval, remindMe, isPaused, isPaid } = req.body;
  if (!amount || !category || !date) {
    return res.status(400).json({ message: 'Amount, category and date are required' });
  }
  try {
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
});

// PUT update expense
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
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
});

// PATCH toggle pause on recurring expense
router.patch('/:id/toggle-pause', authenticateToken, async (req, res) => {
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
});

// PATCH confirm payment on recurring expense
router.patch('/:id/confirm-payment', authenticateToken, async (req, res) => {
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
});

// DELETE expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await expense.destroy();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
});

module.exports = router;
