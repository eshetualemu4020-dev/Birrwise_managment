const BudgetAlert = require('../models/BudgetAlert');
const Budget = require('../models/Budget');

exports.getNotifications = async (req, res) => {
  try {
    const alerts = await BudgetAlert.findAll({
      where: { userId: req.user.id },
      include: [{ model: Budget, attributes: ['name', 'id'] }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ notifications: alerts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await BudgetAlert.findOne({ where: { id, userId: req.user.id } });
    if (!alert) return res.status(404).json({ message: 'Notification not found' });
    
    alert.isRead = true;
    await alert.save();
    res.json({ message: 'Marked as read', notification: alert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await BudgetAlert.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating notifications' });
  }
};
