import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

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

const PERIODS = ['weekly', 'monthly', 'semester', 'custom'];
const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Other'];

const getLocalYMD = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function StudentBudgets() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({ totalBudget: 0, totalSpent: 0, remaining: 0, utilization: 0, activeBudgets: 0, overBudgetCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemCategories, setSystemCategories] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [budgetType, setBudgetType] = useState('category');
  const [category, setCategory] = useState('Food');
  const [periodType, setPeriodType] = useState('monthly');
  const [startDate, setStartDate] = useState(getLocalYMD());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return getLocalYMD(d);
  });
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [isRecurring, setIsRecurring] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const res = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.user);
    } catch (err) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const [bRes, sRes] = await Promise.all([
        axios.get('/api/budgets', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/budgets/summary', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBudgets(bRes.data.budgets || []);
      if (sRes.data) setSummary(sRes.data);
    } catch (err) {
      setError('Failed to load budgets data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchData();
  }, [fetchProfile, fetchData]);

  const resetForm = () => {
    setName('');
    setAmount('');
    setBudgetType('category');
    setCategory('Food');
    setPeriodType('monthly');
    setStartDate(getLocalYMD());
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setEndDate(getLocalYMD(nextMonth));
    setAlertThreshold(80);
    setIsRecurring(false);
    setEditingId(null);
    setShowModal(false);
    setError('');
  };
  const openEdit = (b) => {
    setName(b.name);
    setAmount(b.amount);
    setBudgetType(b.budgetType);
    setCategory(b.category || 'Food');
    setPeriodType(b.periodType);
    setStartDate(b.startDate);
    setEndDate(b.endDate);
    setAlertThreshold(b.alertThreshold);
    setIsRecurring(b.isRecurring);
    setEditingId(b.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !amount || parseFloat(amount) <= 0) {
      setError('Name and valid amount are required.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be strictly after start date.');
      return;
    }
    
    // Strict local YYYY-MM-DD comparison to avoid timezone shift issues
    const todayYMD = getLocalYMD();
    
    if (!editingId && startDate < todayYMD) {
      setError('Start date cannot be in the past.');
      return;
    }

    if (!editingId && endDate < todayYMD) {
      setError('End date cannot be in the past.');
      return;
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    const payload = {
      name,
      amount: parseFloat(amount),
      budgetType,
      category: budgetType === 'category' ? category : null,
      periodType,
      startDate,
      endDate,
      alertThreshold: parseFloat(alertThreshold),
      isRecurring
    };

    const token = localStorage.getItem('token');
    try {
      if (editingId) {
        await axios.put(`/api/budgets/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/budgets', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const handlePause = async (id) => {
    try {
      await axios.post(`/api/budgets/${id}/toggle-pause`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchData();
    } catch (err) {
      alert('Failed to pause budget');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this budget? It will no longer track active expenses.')) return;
    try {
      await axios.patch(`/api/budgets/${id}/archive`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchData();
    } catch (err) {
      alert('Failed to archive budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget? This will NOT delete your expenses.')) return;
    try {
      await axios.delete(`/api/budgets/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchData();
    } catch (err) {
      alert('Failed to delete budget');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await axios.post(`/api/budgets/${id}/duplicate`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchData();
    } catch (err) {
      alert('Failed to duplicate budget');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getProgressColor = (percent) => {
    if (percent < 75) return '#10b981'; // green
    if (percent < 90) return '#eab308'; // yellow
    if (percent < 100) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getStatusText = (percent) => {
    if (percent < 75) return '🟢 On Track';
    if (percent < 90) return '🟡 Warning';
    if (percent < 100) return '🟠 Critical';
    return '🔴 Exceeded';
  };

  return (
    <div className="bw-layout">
      {/* SIDEBAR */}
      <aside className="bw-sidebar">
        <div className="bw-brand">
          <span className="bw-brand-icon">🎓</span>
          <h2>BirrWise Student</h2>
        </div>
        <nav className="bw-nav">
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id} 
              className={`bw-nav-item${item.id === 'budgets' ? ' active' : ''}`} 
              onClick={() => {
                if (item.id === 'budgets') return;
                if (item.id === 'dashboard') { navigate('/student/dashboard', { state: { activeSection: 'dashboard' } }); return; }
                if (item.id === 'income') { navigate('/student/dashboard', { state: { activeSection: 'income' } }); return; }
                if (item.id === 'expenses') { navigate('/student/dashboard', { state: { activeSection: 'expenses' } }); return; }
                if (item.id === 'analytics') { navigate('/student/dashboard', { state: { activeSection: 'analytics' } }); return; }
                if (item.id === 'ai-chat') { navigate('/student/dashboard', { state: { activeSection: 'ai-chat' } }); return; }
                if (item.id === 'savings') { navigate('/student/savings-goals'); return; }
                if (item.id === 'transactions') { navigate('/student/transactions'); return; }
              }}
            >
              <span className="bw-nav-icon">{item.icon}</span>
              <span className="bw-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="bw-main">
        <header className="bw-topbar">
          <div className="bw-topbar-title">
            📊 Budgets
          </div>
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
            <button className="bw-logout-btn" id="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="bw-content" style={{ padding: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3>Overview</h3>
            <button className="bw-btn-primary" onClick={() => setShowModal(true)}>+ Create Budget</button>
          </div>

          {/* SUMMARY WIDGETS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="bw-card" style={{ padding: '15px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total Budget</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.totalBudget} ETB</div>
            </div>
            <div className="bw-card" style={{ padding: '15px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total Spent</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.totalSpent} ETB</div>
            </div>
            <div className="bw-card" style={{ padding: '15px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Remaining</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: summary.remaining < 0 ? '#ef4444' : '#10b981' }}>{summary.remaining} ETB</div>
            </div>
            <div className="bw-card" style={{ padding: '15px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Utilization</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.utilization}%</div>
            </div>
          </div>

          {/* MY BUDGETS */}
          <h3 style={{ marginBottom: '15px' }}>My Budgets</h3>
          {loading ? (
            <p>Loading budgets...</p>
          ) : budgets.length === 0 ? (
            <div className="bw-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📊</div>
              <h3>No Budgets Yet</h3>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>Create your first budget to start controlling your spending.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {budgets.map(b => {
                const percent = Math.min((b.percentageUsed || 0), 100);
                const color = getProgressColor(percent);
                const remaining = (b.amount - (b.spentAmount || 0)).toFixed(2);
                const daysRemaining = Math.max(1, Math.ceil((new Date(b.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                const dailyLimit = remaining > 0 ? (remaining / daysRemaining).toFixed(2) : 0;
                
                return (
                  <div key={b.id} className="bw-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0 }}>{b.name}</h4>
                        {b.status === 'paused' && <span style={{ padding: '2px 8px', background: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}>⏸ Paused</span>}
                        {b.budgetType === 'category' && <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '12px', fontSize: '12px' }}>{b.category}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <select
                          className="bw-btn-outline"
                          style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-solid)', color: 'var(--text-primary)', cursor: 'pointer' }}
                          value=""
                          onChange={(e) => {
                            const action = e.target.value;
                            if (action === 'edit') openEdit(b);
                            else if (action === 'duplicate') handleDuplicate(b.id);
                            else if (action === 'pause') handlePause(b.id);
                            else if (action === 'archive') handleArchive(b.id);
                            else if (action === 'delete') handleDelete(b.id);
                            e.target.value = '';
                          }}
                        >
                          <option value="" disabled>Actions ▾</option>
                          <option value="edit">Edit</option>
                          <option value="duplicate">Duplicate</option>
                          <option value="pause">{b.status === 'paused' ? 'Resume' : 'Pause'}</option>
                          <option value="archive">Archive</option>
                          <option value="delete">Delete</option>
                        </select>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                      <span>{b.spentAmount || 0} / {b.amount} ETB</span>
                      <span style={{ fontWeight: 'bold' }}>{percent.toFixed(1)}%</span>
                    </div>
                    
                    <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: color, transition: 'width 0.3s' }}></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '5px' }}>
                      <span style={{ fontWeight: 'bold' }}>{remaining} ETB remaining</span>
                      <span>{getStatusText(percent)}</span>
                    </div>
                    
                    {remaining > 0 && b.status === 'active' && (
                      <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
                        💡 Recommended daily spending: {dailyLimit} ETB/day
                      </div>
                    )}
                    
                    {b.percentageUsed >= b.alertThreshold && (
                      <div style={{ marginTop: '10px', padding: '10px', background: '#fffbeb', color: '#b45309', borderRadius: '6px', fontSize: '14px' }}>
                        ⚠️ Alert: This budget has exceeded the {b.alertThreshold}% threshold!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="bw-card" style={{ width: '100%', maxWidth: '500px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Budget' : 'Create Budget'}</h3>
            {error && <div style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="bw-form-group">
                <label>Budget Name *</label>
                <input type="text" className="bw-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              
              <div className="bw-form-group">
                <label>Amount (ETB) *</label>
                <input type="number" step="0.01" className="bw-input" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              
              <div className="bw-form-group">
                <label>Budget Type</label>
                <select className="bw-input" value={budgetType} onChange={e => setBudgetType(e.target.value)}>
                  <option value="category">Category Budget</option>
                  <option value="overall">Overall Budget</option>
                </select>
              </div>
              
              {budgetType === 'category' && (
                <div className="bw-form-group">
                  <label>Category *</label>
                  <select className="bw-input" value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              
              <div className="bw-form-group">
                <label>Period Type</label>
                <select className="bw-input" value={periodType} onChange={e => setPeriodType(e.target.value)}>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="bw-form-group" style={{ flex: 1 }}>
                  <label>Start Date *</label>
                  <input type="date" className="bw-input" value={startDate} min={getLocalYMD()} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="bw-form-group" style={{ flex: 1 }}>
                  <label>End Date *</label>
                  <input type="date" className="bw-input" value={endDate} min={startDate || getLocalYMD()} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </div>
              
              <div className="bw-form-group">
                <label>Alert Threshold (%)</label>
                <input type="number" min="1" max="100" className="bw-input" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="recurring-check" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
                <label htmlFor="recurring-check">Recurring Budget</label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="bw-btn-outline" onClick={resetForm}>Cancel</button>
                <button type="submit" className="bw-btn-primary">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
