// src/routes/transactions.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET all transactions for authenticated user
router.get('/', authenticateToken, transactionController.getTransactions);

module.exports = router;
