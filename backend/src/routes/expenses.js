// src/routes/expenses.js
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET all expenses for authenticated user
router.get('/', authenticateToken, expenseController.getExpenses);

// POST new expense
router.post('/', authenticateToken, expenseController.createExpense);

// PUT update expense
router.put('/:id', authenticateToken, expenseController.updateExpense);

// PATCH toggle pause on recurring expense
router.patch('/:id/toggle-pause', authenticateToken, expenseController.togglePause);

// PATCH confirm payment on recurring expense
router.patch('/:id/confirm-payment', authenticateToken, expenseController.confirmPayment);

// DELETE expense
router.delete('/:id', authenticateToken, expenseController.deleteExpense);

module.exports = router;
