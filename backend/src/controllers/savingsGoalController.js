// src/controllers/savingsGoalController.js
const SavingsGoal = require('../models/SavingsGoal');
const SavingsContribution = require('../models/SavingsContribution');
const { Op } = require('sequelize');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateMetrics(goal) {
  const saved  = parseFloat(goal.savedAmount)  || 0;
  const target = parseFloat(goal.targetAmount) || 0;
  const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const remaining = Math.max(target - saved, 0);

  const today      = new Date();
  const targetDate = new Date(goal.targetDate);
  const diffMs     = targetDate - today;
  const daysLeft   = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
  const monthsLeft = Math.max(
    (targetDate.getFullYear() - today.getFullYear()) * 12 +
    (targetDate.getMonth()   - today.getMonth()),
    0
  ) + (daysLeft > 0 ? 1 : 0);

  const requiredMonthly = monthsLeft > 0 ? Math.max(remaining / monthsLeft, 0) : 0;
  const requiredWeekly  = daysLeft   > 0 ? Math.max(remaining / (daysLeft / 7), 0) : 0;

  // Derive computed status
  let computedStatus = goal.status;
  if (goal.status === 'active') {
    if (saved >= target) {
      computedStatus = 'completed';
    } else if (daysLeft <= 0) {
      computedStatus = 'behind';
    } else {
      computedStatus = 'active'; // will be enriched with pace below
    }
  }

  return {
    saved,
    target,
    progress:         Math.round(progress * 10) / 10,
    remaining,
    daysLeft,
    monthsLeft,
    requiredMonthly:  Math.round(requiredMonthly),
    requiredWeekly:   Math.round(requiredWeekly),
    computedStatus,
  };
}

function calcPace(contributions) {
  if (!contributions || contributions.length === 0) return { monthlyAvg: 0, months: [] };
  // group by year-month
  const byMonth = {};
  contributions.forEach(c => {
    const d = new Date(c.contributionDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] || 0) + parseFloat(c.amount);
  });
  const totals = Object.values(byMonth);
  const monthlyAvg = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  return { monthlyAvg: Math.round(monthlyAvg), months: byMonth };
}

function enrichGoal(goal, contributions = []) {
  const metrics = calculateMetrics(goal);
  const pace = calcPace(contributions);

  // Determine display status
  let displayStatus = metrics.computedStatus;
  if (goal.status === 'paused')   displayStatus = 'paused';
  if (goal.status === 'archived') displayStatus = 'archived';
  if (metrics.computedStatus === 'completed' || (parseFloat(goal.savedAmount) >= parseFloat(goal.targetAmount) && parseFloat(goal.targetAmount) > 0)) {
    displayStatus = 'completed';
  } else if (goal.status === 'active') {
    if (metrics.daysLeft > 0 && pace.monthlyAvg > 0) {
      if (pace.monthlyAvg >= metrics.requiredMonthly * 0.9) displayStatus = 'on_track';
      else if (pace.monthlyAvg >= metrics.requiredMonthly * 0.5) displayStatus = 'at_risk';
      else displayStatus = 'behind';
    } else if (metrics.daysLeft > 0) {
      displayStatus = 'on_track'; // no history yet, assume on track
    } else {
      displayStatus = 'behind';
    }
  }

  // Alerts
  const alerts = [];
  const pct = metrics.progress;
  if (displayStatus === 'completed') alerts.push({ type: 'success', msg: `🎉 Congratulations! You reached your "${goal.name}" goal!` });
  else if (pct >= 75 && pct < 100)  alerts.push({ type: 'info',    msg: `🎯 You're ${pct.toFixed(0)}% of the way to your "${goal.name}" goal.` });
  if (metrics.daysLeft > 0 && metrics.daysLeft <= 30 && displayStatus !== 'completed')
    alerts.push({ type: 'warning', msg: `🔔 Your "${goal.name}" goal deadline is approaching in ${metrics.daysLeft} days.` });
  if (displayStatus === 'at_risk')  alerts.push({ type: 'warning', msg: `⚠ Your current saving pace may not reach the target date for "${goal.name}".` });
  if (displayStatus === 'behind')   alerts.push({ type: 'danger',  msg: `🔴 You are significantly behind on "${goal.name}". Consider increasing contributions.` });

  return {
    ...goal.toJSON(),
    ...metrics,
    monthlyAvg: pace.monthlyAvg,
    displayStatus,
    alerts,
  };
}

// ─── GET /api/savings-goals ────────────────────────────────────────────────────
async function listGoals(req, res) {
  try {
    const goals = await SavingsGoal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    // Fetch contributions for pace calculation
    const goalIds = goals.map(g => g.id);
    const allContribs = goalIds.length > 0
      ? await SavingsContribution.findAll({ where: { goalId: { [Op.in]: goalIds } } })
      : [];

    const contribsByGoal = {};
    allContribs.forEach(c => {
      if (!contribsByGoal[c.goalId]) contribsByGoal[c.goalId] = [];
      contribsByGoal[c.goalId].push(c);
    });

    // Auto-mark completed
    const enriched = [];
    for (const g of goals) {
      const contribs = contribsByGoal[g.id] || [];
      const saved   = parseFloat(g.savedAmount) || 0;
      const target  = parseFloat(g.targetAmount) || 0;
      if (g.status === 'active' && saved >= target && target > 0) {
        await g.update({ status: 'completed' });
      }
      enriched.push(enrichGoal(g, contribs));
    }

    res.json({ goals: enriched });
  } catch (err) {
    console.error('listGoals error', err);
    res.status(500).json({ message: 'Failed to fetch savings goals' });
  }
}

// ─── GET /api/savings-goals/summary ──────────────────────────────────────────
async function getSummary(req, res) {
  try {
    const goals = await SavingsGoal.findAll({
      where: { userId: req.user.id, status: { [Op.in]: ['active', 'on_track', 'at_risk', 'behind'] } },
    });

    const activeGoals = goals.filter(g => g.status !== 'archived' && g.status !== 'completed');
    const totalSaved  = activeGoals.reduce((s, g) => s + (parseFloat(g.savedAmount) || 0), 0);
    const totalTarget = activeGoals.reduce((s, g) => s + (parseFloat(g.targetAmount) || 0), 0);
    const overallProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

    // All non-archived
    const all = await SavingsGoal.findAll({
      where: { userId: req.user.id, status: { [Op.notIn]: ['archived'] } },
    });
    const completedCount = all.filter(g => {
      const s = parseFloat(g.savedAmount) || 0;
      const t = parseFloat(g.targetAmount) || 0;
      return g.status === 'completed' || (s >= t && t > 0);
    }).length;

    res.json({
      totalSaved:       Math.round(totalSaved * 100) / 100,
      totalTarget:      Math.round(totalTarget * 100) / 100,
      activeGoals:      activeGoals.length,
      completedGoals:   completedCount,
      overallProgress:  Math.round(overallProgress * 10) / 10,
    });
  } catch (err) {
    console.error('getSummary error', err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
}

// ─── GET /api/savings-goals/:id ───────────────────────────────────────────────
async function getGoal(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const contributions = await SavingsContribution.findAll({
      where: { goalId: goal.id },
      order: [['contributionDate', 'DESC']],
    });

    res.json({ goal: enrichGoal(goal, contributions), contributions });
  } catch (err) {
    console.error('getGoal error', err);
    res.status(500).json({ message: 'Failed to fetch goal' });
  }
}

const { checkAvailableBalance } = require('../utils/balanceCheck');

// ─── POST /api/savings-goals ──────────────────────────────────────────────────
async function createGoal(req, res) {
  try {
    const { name, category, targetAmount, savedAmount, targetDate, priority, description, monthlyContributionTarget } = req.body;

    if (!name || !name.trim())         return res.status(400).json({ message: 'Goal name is required' });
    if (!targetAmount || targetAmount <= 0) return res.status(400).json({ message: 'Target amount must be greater than 0' });
    if (!targetDate)                   return res.status(400).json({ message: 'Target date is required' });
    const initSaved = parseFloat(savedAmount) || 0;
    if (initSaved < 0)                 return res.status(400).json({ message: 'Saved amount cannot be negative' });

    try {
      await checkAvailableBalance(req.user.id, targetAmount);
    } catch (balanceError) {
      return res.status(400).json({ message: balanceError.message });
    }

    const goal = await SavingsGoal.create({
      userId: req.user.id,
      name:   name.trim(),
      category: category || 'Other',
      targetAmount: parseFloat(targetAmount),
      savedAmount:  initSaved,
      targetDate,
      priority:    priority || 'medium',
      description: description || null,
      status: initSaved >= parseFloat(targetAmount) && parseFloat(targetAmount) > 0 ? 'completed' : 'active',
    });

    res.status(201).json({ goal: enrichGoal(goal, []) });
  } catch (err) {
    console.error('createGoal error', err);
    res.status(500).json({ message: 'Failed to create goal' });
  }
}

// ─── PUT /api/savings-goals/:id ───────────────────────────────────────────────
async function updateGoal(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const { name, category, targetAmount, targetDate, priority, description } = req.body;
    
    if (targetAmount !== undefined) {
      const diff = parseFloat(targetAmount) - (parseFloat(goal.targetAmount) || 0);
      if (diff > 0) {
        try {
          await checkAvailableBalance(req.user.id, diff, null, null, goal.id);
        } catch (balanceError) {
          return res.status(400).json({ message: balanceError.message });
        }
      }
    }

    const updates = {};
    if (name        !== undefined) updates.name        = name.trim();
    if (category    !== undefined) updates.category    = category;
    if (targetAmount !== undefined) updates.targetAmount = parseFloat(targetAmount);
    if (targetDate  !== undefined) updates.targetDate  = targetDate;
    if (priority    !== undefined) updates.priority    = priority;
    if (description !== undefined) updates.description = description;

    await goal.update(updates);

    const contribs = await SavingsContribution.findAll({ where: { goalId: goal.id }, order: [['contributionDate', 'DESC']] });
    res.json({ goal: enrichGoal(goal, contribs) });
  } catch (err) {
    console.error('updateGoal error', err);
    res.status(500).json({ message: 'Failed to update goal' });
  }
}

// ─── DELETE /api/savings-goals/:id (soft-archive) ─────────────────────────────
async function deleteGoal(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    await goal.update({ status: 'archived' });
    res.json({ message: 'Goal archived successfully' });
  } catch (err) {
    console.error('deleteGoal error', err);
    res.status(500).json({ message: 'Failed to archive goal' });
  }
}

// ─── POST /api/savings-goals/:id/pause ────────────────────────────────────────
async function pauseGoal(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.status === 'completed' || goal.status === 'archived')
      return res.status(400).json({ message: `Cannot pause a ${goal.status} goal` });
    await goal.update({ status: 'paused' });
    res.json({ message: 'Goal paused', status: 'paused' });
  } catch (err) {
    console.error('pauseGoal error', err);
    res.status(500).json({ message: 'Failed to pause goal' });
  }
}

// ─── POST /api/savings-goals/:id/resume ───────────────────────────────────────
async function resumeGoal(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.status !== 'paused') return res.status(400).json({ message: 'Goal is not paused' });
    const saved  = parseFloat(goal.savedAmount)  || 0;
    const target = parseFloat(goal.targetAmount) || 0;
    const newStatus = saved >= target && target > 0 ? 'completed' : 'active';
    await goal.update({ status: newStatus });
    res.json({ message: 'Goal resumed', status: newStatus });
  } catch (err) {
    console.error('resumeGoal error', err);
    res.status(500).json({ message: 'Failed to resume goal' });
  }
}

// ─── POST /api/savings-goals/:id/archive ──────────────────────────────────────
async function archiveGoal(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    await goal.update({ status: 'archived' });
    res.json({ message: 'Goal archived', status: 'archived' });
  } catch (err) {
    console.error('archiveGoal error', err);
    res.status(500).json({ message: 'Failed to archive goal' });
  }
}

// ─── GET /api/savings-goals/:id/contributions ─────────────────────────────────
async function listContributions(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const contributions = await SavingsContribution.findAll({
      where: { goalId: goal.id },
      order: [['contributionDate', 'DESC']],
    });
    res.json({ contributions });
  } catch (err) {
    console.error('listContributions error', err);
    res.status(500).json({ message: 'Failed to fetch contributions' });
  }
}

// ─── POST /api/savings-goals/:id/contributions ────────────────────────────────
async function addContribution(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const { amount, contributionDate, source, note } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

    const contribution = await SavingsContribution.create({
      goalId: goal.id,
      userId: req.user.id,
      amount: parseFloat(amount),
      contributionDate: contributionDate || new Date().toISOString().slice(0, 10),
      source: source || null,
      note:   note   || null,
    });

    // Recalculate savedAmount
    const allContribs = await SavingsContribution.findAll({ where: { goalId: goal.id } });
    const totalSaved = allContribs.reduce((s, c) => s + parseFloat(c.amount), 0);
    const target = parseFloat(goal.targetAmount) || 0;
    const newStatus = totalSaved >= target && target > 0 ? 'completed' : goal.status === 'paused' ? 'paused' : 'active';
    await goal.update({ savedAmount: totalSaved, status: newStatus });

    const updatedGoal = await SavingsGoal.findByPk(goal.id);
    res.status(201).json({
      contribution,
      goal: enrichGoal(updatedGoal, allContribs),
    });
  } catch (err) {
    console.error('addContribution error', err);
    res.status(500).json({ message: 'Failed to add contribution' });
  }
}

// ─── PUT /api/savings-goals/:id/contributions/:cid ────────────────────────────
async function updateContribution(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const contrib = await SavingsContribution.findOne({ where: { id: req.params.cid, goalId: goal.id } });
    if (!contrib) return res.status(404).json({ message: 'Contribution not found' });

    const { amount, contributionDate, source, note } = req.body;
    if (amount !== undefined && parseFloat(amount) <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

    const updates = {};
    if (amount           !== undefined) updates.amount           = parseFloat(amount);
    if (contributionDate !== undefined) updates.contributionDate = contributionDate;
    if (source           !== undefined) updates.source           = source;
    if (note             !== undefined) updates.note             = note;

    await contrib.update(updates);

    // Recalculate
    const allContribs = await SavingsContribution.findAll({ where: { goalId: goal.id } });
    const totalSaved  = allContribs.reduce((s, c) => s + parseFloat(c.amount), 0);
    const target = parseFloat(goal.targetAmount) || 0;
    const newStatus = totalSaved >= target && target > 0 ? 'completed' : goal.status === 'paused' ? 'paused' : 'active';
    await goal.update({ savedAmount: totalSaved, status: newStatus });

    const updatedGoal = await SavingsGoal.findByPk(goal.id);
    res.json({ contribution: contrib, goal: enrichGoal(updatedGoal, allContribs) });
  } catch (err) {
    console.error('updateContribution error', err);
    res.status(500).json({ message: 'Failed to update contribution' });
  }
}

// ─── DELETE /api/savings-goals/:id/contributions/:cid ─────────────────────────
async function deleteContribution(req, res) {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const contrib = await SavingsContribution.findOne({ where: { id: req.params.cid, goalId: goal.id } });
    if (!contrib) return res.status(404).json({ message: 'Contribution not found' });

    await contrib.destroy();

    // Recalculate
    const remaining = await SavingsContribution.findAll({ where: { goalId: goal.id } });
    const totalSaved = remaining.reduce((s, c) => s + parseFloat(c.amount), 0);
    const target = parseFloat(goal.targetAmount) || 0;
    const newStatus = totalSaved >= target && target > 0 ? 'completed' : goal.status === 'completed' ? 'active' : goal.status;
    await goal.update({ savedAmount: totalSaved, status: newStatus });

    const updatedGoal = await SavingsGoal.findByPk(goal.id);
    res.json({ message: 'Contribution deleted', goal: enrichGoal(updatedGoal, remaining) });
  } catch (err) {
    console.error('deleteContribution error', err);
    res.status(500).json({ message: 'Failed to delete contribution' });
  }
}

module.exports = {
  listGoals,
  getSummary,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  pauseGoal,
  resumeGoal,
  archiveGoal,
  listContributions,
  addContribution,
  updateContribution,
  deleteContribution,
};
