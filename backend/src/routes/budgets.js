const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET budget summary
router.get('/summary', authenticateToken, budgetController.getSummary);

// GET all budgets for the user
router.get('/', authenticateToken, budgetController.getBudgets);

// POST new budget
router.post('/', authenticateToken, budgetController.createBudget);

// PUT update budget
router.put('/:id', authenticateToken, budgetController.updateBudget);

// DELETE budget
router.delete('/:id', authenticateToken, budgetController.deleteBudget);

// POST duplicate
router.post('/:id/duplicate', authenticateToken, budgetController.duplicateBudget);

// PATCH archive
router.patch('/:id/archive', authenticateToken, budgetController.archiveBudget);

// POST pause / resume
router.post('/:id/toggle-pause', authenticateToken, budgetController.togglePause);

module.exports = router;
