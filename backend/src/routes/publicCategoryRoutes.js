const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET /api/categories - Returns only active categories (grouped or simple array)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
