const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, notificationController.getNotifications);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

module.exports = router;
