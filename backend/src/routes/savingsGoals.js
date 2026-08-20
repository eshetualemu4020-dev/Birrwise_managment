// src/routes/savingsGoals.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/savingsGoalController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Summary
router.get('/summary',                                   authenticateToken, ctrl.getSummary);

// Goals CRUD
router.get('/',                                          authenticateToken, ctrl.listGoals);
router.post('/',                                         authenticateToken, ctrl.createGoal);
router.get('/:id',                                       authenticateToken, ctrl.getGoal);
router.put('/:id',                                       authenticateToken, ctrl.updateGoal);
router.delete('/:id',                                    authenticateToken, ctrl.deleteGoal);

// Status actions
router.post('/:id/pause',                                authenticateToken, ctrl.pauseGoal);
router.post('/:id/resume',                               authenticateToken, ctrl.resumeGoal);
router.post('/:id/archive',                              authenticateToken, ctrl.archiveGoal);

// Contributions
router.get( '/:id/contributions',                        authenticateToken, ctrl.listContributions);
router.post('/:id/contributions',                        authenticateToken, ctrl.addContribution);
router.put( '/:id/contributions/:cid',                   authenticateToken, ctrl.updateContribution);
router.delete('/:id/contributions/:cid',                 authenticateToken, ctrl.deleteContribution);

module.exports = router;
