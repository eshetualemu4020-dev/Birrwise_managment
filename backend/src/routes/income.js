// src/routes/income.js
const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET all income records for the authenticated user
router.get('/', authenticateToken, incomeController.getIncomes);

// POST new income record
router.post('/', authenticateToken, incomeController.createIncome);

// PUT update income record
router.put('/:id', authenticateToken, incomeController.updateIncome);

// DELETE income record
router.delete('/:id', authenticateToken, incomeController.deleteIncome);

module.exports = router;
