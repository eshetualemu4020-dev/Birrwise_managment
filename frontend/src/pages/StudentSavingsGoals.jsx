// src/pages/StudentSavingsGoals.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

// ── Constants ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',    icon: '🏠', label: 'Dashboard' },
  { id: 'income',       icon: '💰', label: 'Income' },
  { id: 'expenses',     icon: '💸', label: 'Expenses' },
  { id: 'budgets',      icon: '📊', label: 'Budgets' },
  { id: 'savings',      icon: '🎯', label: 'Savings Goals' },
  { id: 'analytics',   icon: '📈', label: 'Analytics' },
  { id: 'transactions',icon: '🧾', label: 'Transactions' },
  { id: 'reports',      icon: '📑', label: 'Reports' },
  { id: 'ai-chat',     icon: '🤖', label: 'AI Assistant' },
];


const PRIORITIES = ['high','medium','low'];

const STATUS_META = {
  on_track:  { label: 'On Track',  color: '#10b981', bg: 'rgba(16,185,129,0.12)',  dot: '🟢' },
  at_risk:   { label: 'At Risk',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  dot: '🟡' },
  behind:    { label: 'Behind',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   dot: '🔴' },
  completed: { label: 'Completed', color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  dot: '🔵' },
  paused:    { label: 'Paused',    color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', dot: '⏸' },
  archived:  { label: 'Archived',  color: '#475569', bg: 'rgba(71,85,105,0.12)',   dot: '📦' },
  active:    { label: 'Active',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  dot: '🟢' },
};


const FILTER_TABS = ['All','Active','On Track','At Risk','Completed','Paused','Archived'];

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, color = '#6366f1', height = 8 }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  return (
    <div style={{ height, background: 'rgba(var(--overlay-rgb),0.07)', borderRadius: height, overflow: 'hidden', width: '100%' }}>
      <div style={{
        height: '100%', width: `${pct}%`, borderRadius: height, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)', background: `linear-gradient(90deg, ${color}cc, ${color})`,
      }} />
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 18, r = 8, mb = 0 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'rgba(var(--overlay-rgb),0.06)', marginBottom: mb, animation: 'bw-skeleton 1.4s ease-in-out infinite' }} />;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentSavingsGoals() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);

  // Data
  const [goals, setGoals]       = useState([]);
  const [summary, setSummary]   = useState({ totalSaved: 0, totalTarget: 0, activeGoals: 0, completedGoals: 0, overallProgress: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [systemCategories, setSystemCategories] = useState([]);

  // UI State
  const [filterTab, setFilterTab]     = useState('All');
  const [searchQ, setSearchQ]         = useState('');
  const [sortBy, setSortBy]           = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Modals
  const [showCreate, setShowCreate]   = useState(false);
  const [showDetail, setShowDetail]   = useState(null); // goal object
  const [showContrib, setShowContrib] = useState(null); // goal object
  const [showEdit, setShowEdit]       = useState(null); // goal object
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // goal id
  const [showEditContrib, setShowEditContrib] = useState(null); // { goalId, contrib }

  // Create Goal form
  const [cName, setCName]     = useState('');
  const [cCat, setCCat]       = useState('Emergency Fund');
  const [cTarget, setCTarget] = useState('');
  const [cSaved, setCSaved]   = useState('');
  const [cDate, setCDate]     = useState('');
  const [cPri, setCPri]       = useState('medium');
  const [cDesc, setCDesc]     = useState('');
  const [cFormErr, setCFormErr] = useState('');
  const [cLoading, setCLoading] = useState(false);

  // Contribution form
  const [conAmount, setConAmount]     = useState('');
  const [conDate, setConDate]         = useState(new Date().toISOString().slice(0,10));
  const [conSource, setConSource]     = useState('');
  const [conNote, setConNote]         = useState('');
  const [conErr, setConErr]           = useState('');
  const [conLoading, setConLoading]   = useState(false);

  // Edit contrib
  const [ecAmount, setEcAmount] = useState('');
  const [ecDate, setEcDate]     = useState('');
  const [ecSource, setEcSource] = useState('');
  const [ecNote, setEcNote]     = useState('');
  const [ecErr, setEcErr]       = useState('');
  const [ecLoading, setEcLoading] = useState(false);

  // Edit Goal form
  const [eName, setEName]     = useState('');
  const [eCat, setECat]       = useState('');
  const [eTarget, setETarget] = useState('');
  const [eDate, setEDate]     = useState('');
  const [ePri, setEPri]       = useState('medium');
  const [eDesc, setEDesc]     = useState('');
  const [eFormErr, setEFormErr] = useState('');
  const [eLoading, setELoading] = useState(false);

  // Detail contributions
  const [detailContribs, setDetailContribs] = useState([]);
  const [detailLoading, setDetailLoading]   = useState(false);

  const token = () => localStorage.getItem('token');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  // ── Auth ────────────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const t = token();
    if (!t) { navigate('/login'); return; }
    try {
      const res = await axios.get('/api/auth/me', { headers: authHeader() });
      const u = res.data.user;
      if (u.role === 'admin')   { navigate('/admin/dashboard',   { replace: true }); return; }
      if (u.role === 'advisor') { navigate('/advisor/dashboard', { replace: true }); return; }
      setUser(u);
    } catch { navigate('/login'); }
  }, [navigate]);

  // ── Data Fetching ───────────────────────────────────────────────────────────
  
  // ── Dynamic Categories ─────────────────────────────────────────
  const GOAL_CATEGORIES = Array.from(new Set([
    ...systemCategories.filter(c => c.type === 'savings').map(c => c.name),
    ...goals.map(g => g.category).filter(Boolean)
  ]));

  const getCatIcon = (catName) => {
    const cat = systemCategories.find(c => c.type === 'savings' && c.name === catName);
    if (cat && cat.icon) return cat.icon;
    return '📌'; // fallback
  };

  useEffect(() => {
    if (systemCategories.length > 0 && (!cCat || cCat === 'Emergency Fund')) {
      const defaultCat = systemCategories.find(c => c.type === 'savings')?.name;
      if (defaultCat) setCCat(defaultCat);
    }
  }, [systemCategories, cCat]);

  const fetchGoals = useCallback(async () => {
    try {
      const [gRes, sRes, cRes] = await Promise.all([
        axios.get('/api/savings-goals',          { headers: authHeader() }),
        axios.get('/api/savings-goals/summary',  { headers: authHeader() }),
        axios.get('/api/categories',             { headers: authHeader() })
      ]);
      setGoals(gRes.data.goals || []);
      setSummary(sRes.data || { totalSaved: 0, totalTarget: 0, activeGoals: 0, completedGoals: 0, overallProgress: 0 });
      setSystemCategories(cRes.data.categories || []);
    } catch {
      setError('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (goalId) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/savings-goals/${goalId}`, { headers: authHeader() });
      setDetailContribs(res.data.contributions || []);
    } catch {}
    setDetailLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (user) fetchGoals(); }, [user, fetchGoals]);
  useEffect(() => { if (showDetail) fetchDetail(showDetail.id); }, [showDetail?.id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // ── Nav ─────────────────────────────────────────────────────────────────────
  const handleNav = (id) => {
    if (id === 'dashboard') navigate('/student/dashboard');
    else if (id === 'budgets') navigate('/student/budgets');
    else if (id === 'transactions') navigate('/student/transactions');
    else if (id === 'reports') navigate('/student/reports');
    else if (id === 'savings') return; // already here
    else navigate('/student/dashboard', { state: { activeSection: id } });
  };

  // ── Filtering / Sorting ─────────────────────────────────────────────────────
  const filteredGoals = goals
    .filter(g => {
      if (filterTab === 'All') return g.status !== 'archived';
      if (filterTab === 'Active')    return g.status === 'active' && g.displayStatus !== 'on_track' && g.displayStatus !== 'at_risk' && g.displayStatus !== 'behind' || g.status === 'active';
      if (filterTab === 'On Track')  return g.displayStatus === 'on_track';
      if (filterTab === 'At Risk')   return g.displayStatus === 'at_risk';
      if (filterTab === 'Completed') return g.displayStatus === 'completed' || g.status === 'completed';
      if (filterTab === 'Paused')    return g.status === 'paused';
      if (filterTab === 'Archived')  return g.status === 'archived';
      return true;
    })
    .filter(g => {
      if (!searchQ) return true;
      const q = searchQ.toLowerCase();
      return g.name.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest')         return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest')         return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'highest_progress') return (b.progress || 0) - (a.progress || 0);
      if (sortBy === 'lowest_progress')  return (a.progress || 0) - (b.progress || 0);
      if (sortBy === 'nearest_date')   return new Date(a.targetDate) - new Date(b.targetDate);
      if (sortBy === 'highest_target') return b.targetAmount - a.targetAmount;
      if (sortBy === 'priority') {
        const p = { high: 0, medium: 1, low: 2 };
        return (p[a.priority] || 1) - (p[b.priority] || 1);
      }
      return 0;
    });

  // upcoming goals (active, sorted by nearest date)
  const upcomingGoals = goals
    .filter(g => g.status === 'active' && g.daysLeft > 0)
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
    .slice(0, 4);

  // Smart insights
  const insights = [];
  const completedList = goals.filter(g => g.displayStatus === 'completed');
  const atRiskList    = goals.filter(g => g.displayStatus === 'at_risk');
  const behindList    = goals.filter(g => g.displayStatus === 'behind');
  const nearGoal      = goals.find(g => g.progress >= 75 && g.progress < 100 && g.status === 'active');
  if (completedList.length)        insights.push({ type: 'success', text: `🏆 You have completed ${completedList.length} savings goal${completedList.length > 1 ? 's' : ''}!` });
  if (nearGoal)                    insights.push({ type: 'info',    text: `🎯 Your "${nearGoal.name}" goal is ${nearGoal.progress}% complete — almost there!` });
  if (atRiskList.length)           insights.push({ type: 'warning', text: `⚠ ${atRiskList.length} goal${atRiskList.length > 1 ? 's are' : ' is'} at risk of missing the target date.` });
  if (behindList.length)           insights.push({ type: 'danger',  text: `🔴 ${behindList.length} goal${behindList.length > 1 ? 's' : ''} behind schedule. Increase contributions.` });
  if (!insights.length && goals.filter(g=>g.status==='active').length > 0)
    insights.push({ type: 'info', text: '💡 All active goals are on track. Keep up the great work!' });

  // ── Create Goal ─────────────────────────────────────────────────────────────
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setCFormErr('');
    if (!cName.trim()) return setCFormErr('Goal name is required');
    if (!cTarget || parseFloat(cTarget) <= 0) return setCFormErr('Target amount must be greater than 0');
    if (!cDate) return setCFormErr('Target date is required');
    const cDateObj = new Date(cDate); cDateObj.setHours(23, 59, 59, 999); if (cDateObj <= new Date()) return setCFormErr('Target date must be in the future');
    if (parseFloat(cSaved) < 0) return setCFormErr('Saved amount cannot be negative');
    if (parseFloat(cSaved) > parseFloat(cTarget)) return setCFormErr('Saved amount cannot exceed target amount');
    setCLoading(true);
    try {
      await axios.post('/api/savings-goals', {
        name: cName.trim(), category: cCat, targetAmount: parseFloat(cTarget),
        savedAmount: parseFloat(cSaved) || 0, targetDate: cDate, priority: cPri, description: cDesc,
      }, { headers: authHeader() });
      setShowCreate(false);
      resetCreateForm();
      fetchGoals();
    } catch (err) {
      setCFormErr(err.response?.data?.message || 'Failed to create goal');
    }
    setCLoading(false);
  };

  const resetCreateForm = () => {
    setCName(''); setCCat('Emergency Fund'); setCTarget(''); setCSaved('');
    setCDate(''); setCPri('medium'); setCDesc(''); setCFormErr('');
  };

  // ── Edit Goal ───────────────────────────────────────────────────────────────
  const openEdit = (g) => {
    setEName(g.name); setECat(g.category || 'Other');
    setETarget(String(g.targetAmount)); setEDate(g.targetDate);
    setEPri(g.priority || 'medium'); setEDesc(g.description || '');
    setEFormErr(''); setShowEdit(g);
  };

  const handleEditGoal = async (e) => {
    e.preventDefault();
    setEFormErr('');
    if (!eName.trim()) return setEFormErr('Goal name is required');
    if (!eTarget || parseFloat(eTarget) <= 0) return setEFormErr('Target amount must be greater than 0');
    if (parseFloat(eTarget) < (showEdit.savedAmount || 0)) return setEFormErr('Target amount cannot be less than the currently saved amount');
    if (!eDate) return setEFormErr('Target date is required');
    const eDateObj = new Date(eDate); eDateObj.setHours(23, 59, 59, 999); if (eDateObj <= new Date()) return setEFormErr('Target date must be in the future');
    setELoading(true);
    try {
      await axios.put(`/api/savings-goals/${showEdit.id}`, {
        name: eName.trim(), category: eCat, targetAmount: parseFloat(eTarget),
        targetDate: eDate, priority: ePri, description: eDesc,
      }, { headers: authHeader() });
      setShowEdit(null);
      // If detail is open, close it and reopen
      if (showDetail && showDetail.id === showEdit.id) setShowDetail(null);
      fetchGoals();
    } catch (err) {
      setEFormErr(err.response?.data?.message || 'Failed to update goal');
    }
    setELoading(false);
  };

  // ── Delete Goal ─────────────────────────────────────────────────────────────
  const handleDeleteGoal = async () => {
    if (!showDeleteConfirm) return;
    try {
      await axios.delete(`/api/savings-goals/${showDeleteConfirm}`, { headers: authHeader() });
      setShowDeleteConfirm(null);
      if (showDetail?.id === showDeleteConfirm) setShowDetail(null);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete goal');
    }
  };

  // ── Pause / Resume ──────────────────────────────────────────────────────────
  const handlePause = async (g) => {
    try {
      if (g.status === 'paused') {
        await axios.post(`/api/savings-goals/${g.id}/resume`, {}, { headers: authHeader() });
      } else {
        await axios.post(`/api/savings-goals/${g.id}/pause`, {}, { headers: authHeader() });
      }
      fetchGoals();
      if (showDetail?.id === g.id) setShowDetail(prev => ({ ...prev, status: prev.status === 'paused' ? 'active' : 'paused' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  // ── Archive ─────────────────────────────────────────────────────────────────
  const handleArchive = async (g) => {
    if (!window.confirm(`Archive "${g.name}"? It will be hidden from active goals but preserved in history.`)) return;
    try {
      await axios.post(`/api/savings-goals/${g.id}/archive`, {}, { headers: authHeader() });
      if (showDetail?.id === g.id) setShowDetail(null);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive');
    }
  };

  // ── Add Contribution ────────────────────────────────────────────────────────
  const handleAddContrib = async (e) => {
    e.preventDefault();
    setConErr('');
    if (!conAmount || parseFloat(conAmount) <= 0) return setConErr('Amount must be greater than 0');
    const todayStr = new Date().toISOString().slice(0, 10);
    if (conDate !== todayStr) return setConErr('Contribution date must be exactly today.');
    if ((showContrib.savedAmount || 0) + parseFloat(conAmount) > showContrib.targetAmount) {
      return setConErr(`Contribution exceeds target. You only need ${showContrib.targetAmount - (showContrib.savedAmount || 0)} ETB more to reach your goal.`);
    }
    setConLoading(true);
    try {
      const res = await axios.post(`/api/savings-goals/${showContrib.id}/contributions`, {
        amount: parseFloat(conAmount), contributionDate: conDate,
        source: conSource, note: conNote,
      }, { headers: authHeader() });
      setShowContrib(null);
      resetContribForm();
      // Refresh detail if open
      if (showDetail?.id === showContrib?.id) fetchDetail(showDetail.id);
      fetchGoals();
    } catch (err) {
      setConErr(err.response?.data?.message || 'Failed to add contribution');
    }
    setConLoading(false);
  };

  const resetContribForm = () => {
    setConAmount(''); setConDate(new Date().toISOString().slice(0,10));
    setConSource(''); setConNote(''); setConErr('');
  };

  // ── Edit Contribution ───────────────────────────────────────────────────────
  const openEditContrib = (goalId, contrib) => {
    setEcAmount(String(contrib.amount));
    setEcDate(contrib.contributionDate);
    setEcSource(contrib.source || '');
    setEcNote(contrib.note || '');
    setEcErr('');
    setShowEditContrib({ goalId, contrib });
  };

  const handleEditContrib = async (e) => {
    e.preventDefault();
    setEcErr('');
    if (!ecAmount || parseFloat(ecAmount) <= 0) return setEcErr('Amount must be greater than 0');
    const todayStr = new Date().toISOString().slice(0, 10);
    if (ecDate !== todayStr) return setEcErr('Contribution date must be exactly today.');
    
    // Find the goal to check total target
    const currentGoal = goals.find(g => g.id === showEditContrib.goalId);
    if (currentGoal) {
      const oldAmount = showEditContrib.contrib.amount;
      const newSavedAmount = (currentGoal.savedAmount || 0) - oldAmount + parseFloat(ecAmount);
      if (newSavedAmount > currentGoal.targetAmount) {
        return setEcErr('This contribution will make the total saved amount exceed the target.');
      }
    }
    setEcLoading(true);
    try {
      await axios.put(`/api/savings-goals/${showEditContrib.goalId}/contributions/${showEditContrib.contrib.id}`, {
        amount: parseFloat(ecAmount), contributionDate: ecDate, source: ecSource, note: ecNote,
      }, { headers: authHeader() });
      setShowEditContrib(null);
      if (showDetail) fetchDetail(showDetail.id);
      fetchGoals();
    } catch (err) {
      setEcErr(err.response?.data?.message || 'Failed to update contribution');
    }
    setEcLoading(false);
  };

  // ── Delete Contribution ─────────────────────────────────────────────────────
  const handleDeleteContrib = async (goalId, cid) => {
    if (!window.confirm('Delete this contribution? Goal progress will be recalculated.')) return;
    try {
      await axios.delete(`/api/savings-goals/${goalId}/contributions/${cid}`, { headers: authHeader() });
      if (showDetail) fetchDetail(showDetail.id);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contribution');
    }
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────
  const getStatusMeta = (g) => STATUS_META[g.displayStatus] || STATUS_META[g.status] || STATUS_META.active;
  const getPriorityColor = (p) => ({ high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[p] || '#94a3b8');


  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="bw-layout">
      {/* SIDEBAR */}
      <aside className="bw-sidebar">
        <div className="bw-sidebar-brand">
          <span className="bw-brand-icon">💰</span>
          <span className="bw-brand-text">BirrWise</span>
        </div>
        <nav className="bw-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`bw-nav-item${item.id === 'savings' ? ' active' : ''}`}
              onClick={() => handleNav(item.id)}
              id={`nav-${item.id}`}
            >
              <span className="bw-nav-icon">{item.icon}</span>
              <span className="bw-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="bw-nav-item bw-settings-item" onClick={() => navigate('/student/dashboard', { state: { activeSection: 'settings' } })} style={{ marginTop: 'auto' }}>
          <span className="bw-nav-icon">⚙️</span>
          <span className="bw-nav-label">Settings</span>
        </button>
      </aside>

      {/* MAIN */}
      <div className="bw-main">
        {/* Topbar */}
        <header className="bw-topbar">
          <div className="bw-topbar-title">🎯 Savings Goals</div>
          <div className="bw-topbar-right">
            <button 
              onClick={toggleTheme}
              style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', marginRight: '16px' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span className="bw-user-chip" id="user-badge-display">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="User" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
              ) : (
                <span style={{ marginRight: 6 }}>👤</span>
              )}
              <span className="bw-admin-badge" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>Student Profile</span>
            </span>
            <button className="bw-logout-btn" id="btn-logout" onClick={handleLogout} title="Logout" style={{ padding: '0.45rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </header>

        <main className="bw-content">
          {/* PAGE HEADER */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:28 }}>
            <div>
              <h1 style={{ fontSize:'1.6rem', fontWeight:800, color: 'var(--text-primary)', margin:0 }}>Savings Goals</h1>
              <p style={{ color:'rgba(var(--overlay-rgb),0.5)', margin:'4px 0 0', fontSize:'0.92rem' }}>Turn your plans into achievable financial goals.</p>
            </div>
            <button id="btn-create-goal" className="sg-btn-primary" onClick={() => { resetCreateForm(); setShowCreate(true); }}>
              + Create Goal
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="sg-alert sg-alert-danger" style={{ marginBottom:20 }}>
              {error}
              <button onClick={() => { setError(''); fetchGoals(); }} style={{ marginLeft:12, background:'none', border:'none', color:'inherit', cursor:'pointer', textDecoration:'underline' }}>
                Try Again
              </button>
            </div>
          )}

          {/* SUMMARY CARDS */}
          <div className="sg-summary-grid">
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="sg-summary-card">
                  <Skeleton w="60%" h={12} mb={10} />
                  <Skeleton w="80%" h={28} mb={6} />
                  <Skeleton w="50%" h={10} />
                </div>
              ))
            ) : (
              <>
                <div className="sg-summary-card">
                  <span className="sg-summary-icon" style={{ color:'#10b981' }}>💰</span>
                  <div className="sg-summary-value" style={{ color:'#10b981' }}>{fmt(summary.totalSaved)} ETB</div>
                  <div className="sg-summary-label">Total Saved</div>
                  <div className="sg-summary-sub">across all active goals</div>
                </div>
                <div className="sg-summary-card">
                  <span className="sg-summary-icon" style={{ color:'#6366f1' }}>🎯</span>
                  <div className="sg-summary-value" style={{ color:'#6366f1' }}>{summary.activeGoals}</div>
                  <div className="sg-summary-label">Active Goals</div>
                  <div className="sg-summary-sub">currently in progress</div>
                </div>
                <div className="sg-summary-card">
                  <span className="sg-summary-icon" style={{ color:'#f59e0b' }}>🏆</span>
                  <div className="sg-summary-value" style={{ color:'#f59e0b' }}>{fmt(summary.totalTarget)} ETB</div>
                  <div className="sg-summary-label">Goal Target</div>
                  <div className="sg-summary-sub">total target amount</div>
                </div>
                <div className="sg-summary-card">
                  <span className="sg-summary-icon" style={{ color:'#a855f7' }}>📊</span>
                  <div className="sg-summary-value" style={{ color:'#a855f7' }}>{summary.overallProgress}%</div>
                  <div className="sg-summary-label">Overall Progress</div>
                  <div className="sg-summary-sub">across active goals</div>
                </div>
              </>
            )}
          </div>

          {/* OVERALL SAVINGS PROGRESS BAR */}
          {!loading && summary.totalTarget > 0 && (
            <div className="sg-card" style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.95rem', color: 'var(--text-primary)' }}>Overall Savings Progress</div>
                  <div style={{ fontSize:'0.82rem', color:'rgba(var(--overlay-rgb),0.45)', marginTop:2 }}>Active goals combined</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#10b981' }}>{fmt(summary.totalSaved)} ETB</div>
                  <div style={{ fontSize:'0.8rem', color:'rgba(var(--overlay-rgb),0.4)' }}>of {fmt(summary.totalTarget)} ETB</div>
                </div>
              </div>
              <ProgressBar value={summary.overallProgress} color="#10b981" height={10} />
              <div style={{ fontSize:'0.8rem', color:'rgba(var(--overlay-rgb),0.45)', marginTop:6, textAlign:'right' }}>{summary.overallProgress}% saved</div>
            </div>
          )}

          {/* FILTERS + SEARCH + SORT */}
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:20 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`sg-filter-tab${filterTab === tab ? ' active' : ''}`}
                  id={`filter-${tab.toLowerCase().replace(' ','-')}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div className="sg-search-wrap">
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(var(--overlay-rgb),0.35)', fontSize:'0.85rem' }}>🔍</span>
                <input
                  id="search-goals"
                  className="sg-search"
                  placeholder="Search goals..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                />
              </div>
              <div style={{ position:'relative' }}>
                <button
                  className="sg-sort-btn"
                  onClick={() => setShowSortMenu(v => !v)}
                  id="btn-sort-goals"
                >
                  ↕ Sort
                </button>
                {showSortMenu && (
                  <div className="sg-sort-menu">
                    {[
                      ['newest','Newest First'],['oldest','Oldest First'],
                      ['highest_progress','Highest Progress'],['lowest_progress','Lowest Progress'],
                      ['nearest_date','Nearest Target Date'],['highest_target','Highest Target'],['priority','Priority'],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        className={`sg-sort-option${sortBy === val ? ' active' : ''}`}
                        onClick={() => { setSortBy(val); setShowSortMenu(false); }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MY GOALS GRID */}
          <div style={{ marginBottom:8 }}>
            <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'rgba(var(--overlay-rgb),0.8)', marginBottom:16 }}>My Goals</h2>

            {loading ? (
              <div className="sg-goals-grid">
                {[1,2,3].map(i => (
                  <div key={i} className="sg-card">
                    <Skeleton w="40%" h={14} mb={16} />
                    <Skeleton w="60%" h={22} mb={8} />
                    <Skeleton w="100%" h={8} r={4} mb={10} />
                    <Skeleton w="50%" h={12} mb={8} />
                    <Skeleton w="70%" h={12} />
                  </div>
                ))}
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="sg-empty-state">
                <div style={{ fontSize:'3rem', marginBottom:12 }}>🎯</div>
                <h3>No savings goals yet</h3>
                <p>Create a goal and start building toward something important.</p>
                <button className="sg-btn-primary" id="btn-create-goal-empty" onClick={() => { resetCreateForm(); setShowCreate(true); }}>
                  + Create Goal
                </button>
              </div>
            ) : (
              <div className="sg-goals-grid">
                {filteredGoals.map(g => {
                  const sm = getStatusMeta(g);
                  const catIcon = getCatIcon(g.category);
                  const progress = g.progress || 0;
                  return (
                    <div key={g.id} className="sg-goal-card" id={`goal-card-${g.id}`}>
                      {/* Card header */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ fontSize:'1.5rem' }}>{catIcon}</span>
                          <div>
                            <div style={{ fontWeight:700, fontSize:'1rem', color: 'var(--text-primary)' }}>{g.name}</div>
                            <div style={{ fontSize:'0.75rem', color:'rgba(var(--overlay-rgb),0.4)', marginTop:1 }}>{g.category}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span
                            style={{ fontSize:'0.72rem', fontWeight:600, padding:'3px 8px', borderRadius:20,
                              background: getPriorityColor(g.priority) + '22', color: getPriorityColor(g.priority), textTransform:'capitalize' }}
                          >
                            {g.priority}
                          </span>
                          <div className="sg-kebab-wrap">
                            <button className="sg-kebab" id={`goal-menu-${g.id}`}>⋮</button>
                            <div className="sg-kebab-menu">
                              <button onClick={() => { setShowDetail(g); }}>View Details</button>
                              <button onClick={() => openEdit(g)}>Edit Goal</button>
                              <button onClick={() => { setShowContrib(g); resetContribForm(); }}>+ Add Contribution</button>
                              <button onClick={() => handlePause(g)}>{g.status === 'paused' ? 'Resume Goal' : 'Pause Goal'}</button>
                              <button onClick={() => handleArchive(g)}>Archive</button>
                              <button style={{ color:'#ef4444' }} onClick={() => setShowDeleteConfirm(g.id)}>Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                          <div>
                            <div style={{ fontSize:'1.3rem', fontWeight:800, color: 'var(--text-primary)' }}>{fmt(g.saved)} ETB</div>
                            <div style={{ fontSize:'0.75rem', color:'rgba(var(--overlay-rgb),0.4)' }}>saved of {fmt(g.target)} ETB</div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#6366f1' }}>{progress}%</div>
                            <div style={{ fontSize:'0.75rem', color:'rgba(var(--overlay-rgb),0.4)' }}>progress</div>
                          </div>
                        </div>
                        <ProgressBar value={progress} color={sm.color} height={8} />
                      </div>

                      {/* Meta row */}
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'rgba(var(--overlay-rgb),0.45)', marginBottom:12 }}>
                        <span>📅 {formatDate(g.targetDate)}</span>
                        <span>{fmt(g.remaining)} ETB remaining</span>
                      </div>

                      {/* Required monthly */}
                      {g.requiredMonthly > 0 && g.status === 'active' && (
                        <div style={{ fontSize:'0.75rem', color:'rgba(var(--overlay-rgb),0.4)', marginBottom:10 }}>
                          💡 Save ~<strong style={{ color:'rgba(var(--overlay-rgb),0.7)' }}>{fmt(g.requiredMonthly)} ETB/mo</strong> to stay on track
                        </div>
                      )}

                      {/* Status badge + action buttons */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto' }}>
                        <span style={{
                          fontSize:'0.75rem', fontWeight:600, padding:'4px 10px', borderRadius:20,
                          background: sm.bg, color: sm.color,
                        }}>
                          {sm.dot} {sm.label}
                        </span>
                        <div style={{ display:'flex', gap:6 }}>
                          <button
                            className="sg-btn-sm"
                            id={`btn-view-${g.id}`}
                            onClick={() => setShowDetail(g)}
                          >
                            View
                          </button>
                          <button
                            className="sg-btn-sm sg-btn-sm-green"
                            id={`btn-contrib-${g.id}`}
                            onClick={() => { setShowContrib(g); resetContribForm(); }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INSIGHTS + UPCOMING side by side */}
          {!loading && (goals.length > 0) && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginTop:28 }}>
              {/* Insights */}
              {insights.length > 0 && (
                <div className="sg-card">
                  <h3 style={{ fontWeight:700, fontSize:'0.95rem', color: 'var(--text-primary)', marginBottom:14 }}>💡 Savings Insights</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {insights.map((ins, i) => (
                      <div key={i} className={`sg-alert sg-alert-${ins.type}`} style={{ margin:0, padding:'10px 14px', fontSize:'0.82rem' }}>
                        {ins.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Targets */}
              {upcomingGoals.length > 0 && (
                <div className="sg-card">
                  <h3 style={{ fontWeight:700, fontSize:'0.95rem', color: 'var(--text-primary)', marginBottom:14 }}>📅 Upcoming Targets</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {upcomingGoals.map(g => (
                      <div key={g.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:10, borderBottom:'1px solid rgba(var(--overlay-rgb),0.06)' }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.88rem', color: 'var(--text-primary)' }}>{getCatIcon(g.category)} {g.name}</div>
                          <div style={{ fontSize:'0.75rem', color:'rgba(var(--overlay-rgb),0.4)', marginTop:2 }}>{fmt(g.remaining)} ETB remaining</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#f59e0b' }}>{formatDate(g.targetDate)}</div>
                          <div style={{ fontSize:'0.72rem', color:'rgba(var(--overlay-rgb),0.35)' }}>{g.daysLeft} days left</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── CREATE GOAL MODAL ─────────────────────────────────────────────── */}
      {showCreate && (
        <div className="sg-overlay" onClick={() => setShowCreate(false)}>
          <div className="sg-modal" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-header">
              <div>
                <h2 className="sg-modal-title">Create Savings Goal</h2>
                <p className="sg-modal-sub">Set a target and build a plan to reach it.</p>
              </div>
              <button className="sg-modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateGoal}>
              <div className="sg-form-grid">
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Goal Name <span style={{ color:'#ef4444' }}>*</span></label>
                  <input id="input-goal-name" className="sg-input" placeholder="e.g. Laptop, Emergency Fund" value={cName} onChange={e=>setCName(e.target.value)} />
                </div>
                <div className="sg-form-group">
                  <label>Category</label>
                  <select id="input-goal-cat" className="sg-input" value={cCat} onChange={e=>setCCat(e.target.value)}>
                    {GOAL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sg-form-group">
                  <label>Priority</label>
                  <select id="input-goal-priority" className="sg-input" value={cPri} onChange={e=>setCPri(e.target.value)}>
                    {PRIORITIES.map(p=><option key={p} value={p} style={{ textTransform:'capitalize' }}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="sg-form-group">
                  <label>Target Amount (ETB) <span style={{ color:'#ef4444' }}>*</span></label>
                  <input id="input-goal-target" className="sg-input" type="number" min="1" step="0.01" placeholder="50000" value={cTarget} onChange={e=>setCTarget(e.target.value)} />
                </div>
                <div className="sg-form-group">
                  <label>Current Saved Amount (ETB)</label>
                  <input id="input-goal-saved" className="sg-input" type="number" min="0" step="0.01" placeholder="0" value={cSaved} onChange={e=>setCSaved(e.target.value)} />
                </div>
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Target Date <span style={{ color:'#ef4444' }}>*</span></label>
                  <input id="input-goal-date" className="sg-input" type="date" value={cDate} onChange={e=>setCDate(e.target.value)} min={new Date().toISOString().slice(0,10)} />
                </div>
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Description</label>
                  <textarea id="input-goal-desc" className="sg-input sg-textarea" placeholder="Save for a laptop for university work." value={cDesc} onChange={e=>setCDesc(e.target.value)} />
                </div>
              </div>
              {cFormErr && <div className="sg-alert sg-alert-danger" style={{ marginBottom:12 }}>{cFormErr}</div>}
              <div className="sg-modal-actions">
                <button type="button" className="sg-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" id="btn-submit-goal" className="sg-btn-primary" disabled={cLoading}>
                  {cLoading ? 'Creating…' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT GOAL MODAL ────────────────────────────────────────────────── */}
      {showEdit && (
        <div className="sg-overlay" onClick={() => setShowEdit(null)}>
          <div className="sg-modal" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-header">
              <div>
                <h2 className="sg-modal-title">Edit Goal</h2>
                <p className="sg-modal-sub">{showEdit.name}</p>
              </div>
              <button className="sg-modal-close" onClick={() => setShowEdit(null)}>✕</button>
            </div>
            <form onSubmit={handleEditGoal}>
              <div className="sg-form-grid">
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Goal Name <span style={{ color:'#ef4444' }}>*</span></label>
                  <input className="sg-input" value={eName} onChange={e=>setEName(e.target.value)} />
                </div>
                <div className="sg-form-group">
                  <label>Category</label>
                  <select className="sg-input" value={eCat} onChange={e=>setECat(e.target.value)}>
                    {GOAL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sg-form-group">
                  <label>Priority</label>
                  <select className="sg-input" value={ePri} onChange={e=>setEPri(e.target.value)}>
                    {PRIORITIES.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="sg-form-group">
                  <label>Target Amount (ETB) <span style={{ color:'#ef4444' }}>*</span></label>
                  <input className="sg-input" type="number" min="1" step="0.01" value={eTarget} onChange={e=>setETarget(e.target.value)} />
                </div>
                <div className="sg-form-group">
                  <label>Target Date <span style={{ color:'#ef4444' }}>*</span></label>
                  <input className="sg-input" type="date" value={eDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setEDate(e.target.value)} />
                </div>
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Description</label>
                  <textarea className="sg-input sg-textarea" value={eDesc} onChange={e=>setEDesc(e.target.value)} />
                </div>
              </div>
              {eFormErr && <div className="sg-alert sg-alert-danger" style={{ marginBottom:12 }}>{eFormErr}</div>}
              <div className="sg-modal-actions">
                <button type="button" className="sg-btn-ghost" onClick={() => setShowEdit(null)}>Cancel</button>
                <button type="submit" className="sg-btn-primary" disabled={eLoading}>
                  {eLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── GOAL DETAIL MODAL ─────────────────────────────────────────────── */}
      {showDetail && (
        <div className="sg-overlay" onClick={() => setShowDetail(null)}>
          <div className="sg-modal sg-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:'2rem' }}>{getCatIcon(showDetail.category)}</span>
                <div>
                  <h2 className="sg-modal-title">{showDetail.name}</h2>
                  <p className="sg-modal-sub">{showDetail.category} · {fmt(showDetail.targetAmount)} ETB Goal</p>
                </div>
              </div>
              <button className="sg-modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>

            {/* Progress section */}
            <div className="sg-card" style={{ marginBottom:16, background:'rgba(var(--overlay-rgb),0.03)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:'2rem', fontWeight:800, color: 'var(--text-primary)' }}>{fmt(showDetail.savedAmount)} ETB</div>
                  <div style={{ fontSize:'0.82rem', color:'rgba(var(--overlay-rgb),0.4)' }}>saved</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'1.5rem', fontWeight:800, color: getStatusMeta(showDetail).color }}>{(showDetail.progress||0)}%</div>
                  <div style={{ fontSize:'0.82rem', color:'rgba(var(--overlay-rgb),0.4)' }}>complete</div>
                </div>
              </div>
              <ProgressBar value={showDetail.progress || 0} color={getStatusMeta(showDetail).color} height={12} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'rgba(var(--overlay-rgb),0.4)', marginTop:8 }}>
                <span>{fmt(showDetail.savedAmount)} ETB saved</span>
                <span>{fmt(showDetail.remaining || 0)} ETB remaining</span>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div className="sg-detail-item">
                <div className="sg-detail-label">Target Date</div>
                <div className="sg-detail-value">{formatDate(showDetail.targetDate)}</div>
              </div>
              <div className="sg-detail-item">
                <div className="sg-detail-label">Days Remaining</div>
                <div className="sg-detail-value">{showDetail.daysLeft || 0} days</div>
              </div>
              <div className="sg-detail-item">
                <div className="sg-detail-label">Required Monthly</div>
                <div className="sg-detail-value" style={{ color:'#6366f1' }}>{fmt(showDetail.requiredMonthly || 0)} ETB</div>
              </div>
              <div className="sg-detail-item">
                <div className="sg-detail-label">Avg Monthly (Actual)</div>
                <div className="sg-detail-value" style={{ color: (showDetail.monthlyAvg||0) >= (showDetail.requiredMonthly||0) ? '#10b981' : '#f59e0b' }}>
                  {fmt(showDetail.monthlyAvg || 0)} ETB
                </div>
              </div>
              <div className="sg-detail-item">
                <div className="sg-detail-label">Status</div>
                <div className="sg-detail-value">
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.78rem', fontWeight:600,
                    background: getStatusMeta(showDetail).bg, color: getStatusMeta(showDetail).color }}>
                    {getStatusMeta(showDetail).dot} {getStatusMeta(showDetail).label}
                  </span>
                </div>
              </div>
              <div className="sg-detail-item">
                <div className="sg-detail-label">Priority</div>
                <div className="sg-detail-value" style={{ color: getPriorityColor(showDetail.priority), textTransform:'capitalize' }}>
                  {showDetail.priority}
                </div>
              </div>
            </div>

            {/* Pace advice */}
            {showDetail.monthlyAvg > 0 && showDetail.requiredMonthly > 0 && showDetail.status === 'active' && (
              <div className={`sg-alert ${showDetail.monthlyAvg >= showDetail.requiredMonthly ? 'sg-alert-success' : 'sg-alert-warning'}`} style={{ marginBottom:16 }}>
                {showDetail.monthlyAvg >= showDetail.requiredMonthly
                  ? `✅ Great pace! You're saving ${fmt(showDetail.monthlyAvg)} ETB/mo — needed: ${fmt(showDetail.requiredMonthly)} ETB/mo.`
                  : `⚠ You may need to increase monthly savings by ${fmt(showDetail.requiredMonthly - showDetail.monthlyAvg)} ETB to reach your target on time.`}
              </div>
            )}

            {/* Description */}
            {showDetail.description && (
              <div style={{ color:'rgba(var(--overlay-rgb),0.5)', fontSize:'0.85rem', marginBottom:16, padding:'10px 14px', background:'rgba(var(--overlay-rgb),0.03)', borderRadius:10 }}>
                {showDetail.description}
              </div>
            )}

            {/* Contribution History */}
            <div style={{ marginBottom:16 }}>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'rgba(var(--overlay-rgb),0.7)', marginBottom:12 }}>Contribution History</h3>
              {detailLoading ? (
                [1,2,3].map(i => <Skeleton key={i} h={40} r={8} mb={8} />)
              ) : detailContribs.length === 0 ? (
                <div style={{ color:'rgba(var(--overlay-rgb),0.3)', fontSize:'0.85rem', textAlign:'center', padding:'20px 0' }}>
                  No contributions yet. Add your first contribution!
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:220, overflowY:'auto' }}>
                  {detailContribs.map(c => (
                    <div key={c.id} className="sg-contrib-row">
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:'1rem' }}>💰</span>
                        <div>
                          <div style={{ fontWeight:700, color:'#10b981', fontSize:'0.9rem' }}>+{fmt(c.amount)} ETB</div>
                          <div style={{ fontSize:'0.75rem', color:'rgba(var(--overlay-rgb),0.4)' }}>
                            {formatDate(c.contributionDate)}
                            {c.source ? ` · ${c.source}` : ''}
                          </div>
                          {c.note && <div style={{ fontSize:'0.72rem', color:'rgba(var(--overlay-rgb),0.3)', marginTop:1 }}>{c.note}</div>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="sg-btn-sm" onClick={() => openEditContrib(showDetail.id, c)}>Edit</button>
                        <button className="sg-btn-sm sg-btn-sm-red" onClick={() => handleDeleteContrib(showDetail.id, c.id)}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="sg-modal-actions" style={{ flexWrap:'wrap', gap:8 }}>
              <button className="sg-btn-primary" id={`btn-add-contrib-detail-${showDetail.id}`}
                onClick={() => { setShowContrib(showDetail); resetContribForm(); setShowDetail(null); }}>
                + Add Contribution
              </button>
              <button className="sg-btn-ghost" onClick={() => { openEdit(showDetail); setShowDetail(null); }}>Edit Goal</button>
              <button className="sg-btn-ghost" onClick={() => { handlePause(showDetail); setShowDetail(null); }}>
                {showDetail.status === 'paused' ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button className="sg-btn-ghost" onClick={() => { handleArchive(showDetail); }}>📦 Archive</button>
              <button className="sg-modal-close" onClick={() => setShowDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CONTRIBUTION MODAL ─────────────────────────────────────────── */}
      {showContrib && (
        <div className="sg-overlay" onClick={() => setShowContrib(null)}>
          <div className="sg-modal" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-header">
              <div>
                <h2 className="sg-modal-title">Add Savings Contribution</h2>
                <p className="sg-modal-sub">Goal: {showContrib.name}</p>
              </div>
              <button className="sg-modal-close" onClick={() => setShowContrib(null)}>✕</button>
            </div>
            <form onSubmit={handleAddContrib}>
              <div className="sg-form-grid">
                <div className="sg-form-group">
                  <label>Amount (ETB) <span style={{ color:'#ef4444' }}>*</span></label>
                  <input id="input-contrib-amount" className="sg-input" type="number" min="0.01" step="0.01" placeholder="2000"
                    value={conAmount} onChange={e=>setConAmount(e.target.value)} />
                </div>
                <div className="sg-form-group">
                  <label>Date</label>
                  <input id="input-contrib-date" className="sg-input" type="date" value={conDate} min={new Date().toISOString().slice(0, 10)} max={new Date().toISOString().slice(0, 10)} onChange={e=>setConDate(e.target.value)} />
                </div>
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Source</label>
                  <input id="input-contrib-source" className="sg-input" placeholder="e.g. Monthly allowance, Freelance income"
                    value={conSource} onChange={e=>setConSource(e.target.value)} />
                </div>
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Note</label>
                  <textarea id="input-contrib-note" className="sg-input sg-textarea" placeholder="Saved from August allowance."
                    value={conNote} onChange={e=>setConNote(e.target.value)} />
                </div>
              </div>
              {/* Progress preview */}
              {conAmount && parseFloat(conAmount) > 0 && (
                <div className="sg-card" style={{ marginBottom:14, background:'rgba(16,185,129,0.06)', borderColor:'rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize:'0.82rem', color:'rgba(var(--overlay-rgb),0.6)', marginBottom:6 }}>After this contribution:</div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.88rem' }}>
                    <span>Current: <strong>{fmt(showContrib.savedAmount || 0)} ETB</strong></span>
                    <span style={{ color:'#10b981' }}>+{fmt(conAmount)} ETB</span>
                    <span>New: <strong style={{ color:'#10b981' }}>{fmt((parseFloat(showContrib.savedAmount)||0)+parseFloat(conAmount))} ETB</strong></span>
                  </div>
                  <div style={{ marginTop:8 }}>
                    <ProgressBar
                      value={Math.min(((parseFloat(showContrib.savedAmount)||0)+parseFloat(conAmount)) / parseFloat(showContrib.targetAmount) * 100, 100)}
                      color="#10b981" height={6}
                    />
                  </div>
                </div>
              )}
              {conErr && <div className="sg-alert sg-alert-danger" style={{ marginBottom:12 }}>{conErr}</div>}
              <div className="sg-modal-actions">
                <button type="button" className="sg-btn-ghost" onClick={() => setShowContrib(null)}>Cancel</button>
                <button type="submit" id="btn-submit-contrib" className="sg-btn-primary" disabled={conLoading}>
                  {conLoading ? 'Adding…' : 'Add Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT CONTRIBUTION MODAL ──────────────────────────────────────────── */}
      {showEditContrib && (
        <div className="sg-overlay" onClick={() => setShowEditContrib(null)}>
          <div className="sg-modal" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-header">
              <div>
                <h2 className="sg-modal-title">Edit Contribution</h2>
              </div>
              <button className="sg-modal-close" onClick={() => setShowEditContrib(null)}>✕</button>
            </div>
            <form onSubmit={handleEditContrib}>
              <div className="sg-form-grid">
                <div className="sg-form-group">
                  <label>Amount (ETB) <span style={{ color:'#ef4444' }}>*</span></label>
                  <input className="sg-input" type="number" min="0.01" step="0.01" value={ecAmount} onChange={e=>setEcAmount(e.target.value)} />
                </div>
                <div className="sg-form-group">
                  <label>Date</label>
                  <input className="sg-input" type="date" value={ecDate} min={new Date().toISOString().slice(0, 10)} max={new Date().toISOString().slice(0, 10)} onChange={e=>setEcDate(e.target.value)} />
                </div>
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Source</label>
                  <input className="sg-input" value={ecSource} onChange={e=>setEcSource(e.target.value)} />
                </div>
                <div className="sg-form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Note</label>
                  <textarea className="sg-input sg-textarea" value={ecNote} onChange={e=>setEcNote(e.target.value)} />
                </div>
              </div>
              {ecErr && <div className="sg-alert sg-alert-danger" style={{ marginBottom:12 }}>{ecErr}</div>}
              <div className="sg-modal-actions">
                <button type="button" className="sg-btn-ghost" onClick={() => setShowEditContrib(null)}>Cancel</button>
                <button type="submit" className="sg-btn-primary" disabled={ecLoading}>
                  {ecLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="sg-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="sg-modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <div className="sg-modal-header">
              <h2 className="sg-modal-title" style={{ color:'#ef4444' }}>Delete Savings Goal?</h2>
              <button className="sg-modal-close" onClick={() => setShowDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ color:'rgba(var(--overlay-rgb),0.6)', fontSize:'0.9rem', marginBottom:20 }}>
              This will archive the goal and its contribution history. Income, expenses, and budgets will not be affected.
            </p>
            <div className="sg-modal-actions">
              <button className="sg-btn-ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="sg-btn-danger" id="btn-confirm-delete" onClick={handleDeleteGoal}>Delete Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
