// src/pages/StudentDashboard.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NAV_ITEMS = [
  { id: 'dashboard',    icon: '🏠', label: 'Dashboard' },
  { id: 'income',       icon: '💰', label: 'Income' },
  { id: 'expenses',     icon: '💸', label: 'Expenses' },
  { id: 'budgets',      icon: '📊', label: 'Budgets' },
  { id: 'savings',      icon: '🎯', label: 'Savings Goals' },
  { id: 'analytics',   icon: '📈', label: 'Analytics' },
  { id: 'ai',          icon: '🤖', label: 'AI Insights' },
  { id: 'transactions',icon: '🧾', label: 'Transactions' },
];

const INCOME_SOURCES = ['Allowance', 'Part-time Job', 'Freelance', 'Scholarship', 'Gift', 'Investment', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Books', 'Rent', 'Utilities', 'Entertainment', 'Health', 'Clothing', 'Education', 'Savings', 'Other'];
const RECURRENCE_INTERVALS = ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'];

const SOURCE_COLORS = {
  'Allowance':    '#6366f1',
  'Part-time Job':'#10b981',
  'Freelance':    '#f59e0b',
  'Scholarship':  '#a855f7',
  'Gift':         '#ec4899',
  'Investment':   '#14b8a6',
  'Other':        '#94a3b8',
};

const EXPENSE_COLORS = {
  'Food':          '#ef4444',
  'Transport':     '#f97316',
  'Books':         '#eab308',
  'Rent':          '#8b5cf6',
  'Utilities':     '#06b6d4',
  'Entertainment': '#ec4899',
  'Health':        '#10b981',
  'Clothing':      '#f59e0b',
  'Education':     '#6366f1',
  'Savings':       '#14b8a6',
  'Other':         '#94a3b8',
};

export default function StudentDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser]       = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);

  // KYC (student)
  const [studentId,    setStudentId]    = useState('');
  const [institution,  setInstitution]  = useState('');
  const [kycSuccess,   setKycSuccess]   = useState('');
  const [kycError,     setKycError]     = useState('');

  // ── Income State ──────────────────────────────────────────────
  const [incomes,        setIncomes]        = useState([]);
  const [incomeLoading,  setIncomeLoading]  = useState(false);
  const [incomeError,    setIncomeError]    = useState('');
  const [incomeSuccess,  setIncomeSuccess]  = useState('');

  // Form state
  const [showForm,       setShowForm]       = useState(false);
  const [editingIncome,  setEditingIncome]  = useState(null);
  const [formAmount,     setFormAmount]     = useState('');
  const [formSource,     setFormSource]     = useState('Allowance');
  const [formDate,       setFormDate]       = useState(new Date().toISOString().slice(0, 10));
  const [formDesc,       setFormDesc]       = useState('');
  const [formRecurring,  setFormRecurring]  = useState(false);
  const [formInterval,   setFormInterval]   = useState('monthly');
  const [formRemindMe,   setFormRemindMe]   = useState(false);

  // Income filter / search / sort
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filterSource,   setFilterSource]   = useState('All');
  const [filterRecurring,setFilterRecurring]= useState('All');
  const [sortField,      setSortField]      = useState('date');
  const [sortDir,        setSortDir]        = useState('desc');

  // ── Expense State ──────────────────────────────────────────────
  const [expenses,        setExpenses]        = useState([]);
  const [expLoading,      setExpLoading]      = useState(false);
  const [expError,        setExpError]        = useState('');
  const [expSuccess,      setExpSuccess]      = useState('');
  const [showExpForm,     setShowExpForm]     = useState(false);
  const [editingExp,      setEditingExp]      = useState(null);
  const [expAmount,       setExpAmount]       = useState('');
  const [expCategory,     setExpCategory]     = useState('Food');
  const [expDate,         setExpDate]         = useState(new Date().toISOString().slice(0, 10));
  const [expDesc,         setExpDesc]         = useState('');
  const [expReceiptNote,  setExpReceiptNote]  = useState('');
  const [expRecurring,    setExpRecurring]    = useState(false);
  const [expInterval,     setExpInterval]     = useState('monthly');
  const [expRemindMe,     setExpRemindMe]     = useState(false);
  const [expSearchQuery,  setExpSearchQuery]  = useState('');
  const [expFilterCat,    setExpFilterCat]    = useState('All');
  const [expFilterRec,    setExpFilterRec]    = useState('All');
  const [expSortField,    setExpSortField]    = useState('date');
  const [expSortDir,      setExpSortDir]      = useState('desc');
  const [showReceiptId,   setShowReceiptId]   = useState(null);

  const navigate = useNavigate();
  const formRef    = useRef(null);
  const expFormRef = useRef(null);

  // ── Auth ──────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res.data.user;
      if (userData.role === 'admin')   { navigate('/admin/dashboard',   { replace: true }); return; }
      if (userData.role === 'advisor') { navigate('/advisor/dashboard', { replace: true }); return; }
      setUser(userData);
      setIsFrozen(userData.isFrozen);
      if (userData.studentId)   setStudentId(userData.studentId);
      if (userData.institution) setInstitution(userData.institution);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isFrozen) {
        setIsFrozen(true);
        if (err.response.data.user) setUser(err.response.data.user);
      } else {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  }, [navigate]);

  // ── Income API ────────────────────────────────────────────────
  const fetchIncomes = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIncomeLoading(true);
    try {
      const res = await axios.get('/api/income', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomes(res.data.incomes || []);
    } catch (err) {
      setIncomeError(err.response?.data?.message || 'Failed to load income records');
    } finally {
      setIncomeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    const t = setInterval(fetchProfile, 4000);
    return () => clearInterval(t);
  }, [fetchProfile]);

  // ── Expense API ────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setExpLoading(true);
    try {
      const res = await axios.get('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data.expenses || []);
    } catch (err) {
      setExpError(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setExpLoading(false);
    }
  }, []);

  useEffect(() => {
    const needsIncome = ['income', 'dashboard', 'transactions', 'analytics', 'ai'];
    const needsExpense = ['expenses', 'dashboard', 'transactions', 'analytics', 'ai', 'budgets'];
    if (needsIncome.includes(activeSection))  fetchIncomes();
    if (needsExpense.includes(activeSection)) fetchExpenses();
  }, [activeSection, fetchIncomes, fetchExpenses]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ── Income CRUD ───────────────────────────────────────────────
  const resetForm = () => {
    setFormAmount(''); setFormSource('Allowance');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormDesc(''); setFormRecurring(false);
    setFormInterval('monthly'); setFormRemindMe(false);
    setEditingIncome(null); setShowForm(false);
  };

  const openEditForm = (income) => {
    setEditingIncome(income);
    setFormAmount(String(income.amount));
    setFormSource(income.source);
    setFormDate(income.date);
    setFormDesc(income.description || '');
    setFormRecurring(income.isRecurring);
    setFormInterval(income.recurrenceInterval || 'monthly');
    setFormRemindMe(income.remindMe);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIncomeError(''); setIncomeSuccess('');
    const token = localStorage.getItem('token');
    const payload = {
      amount: parseFloat(formAmount),
      source: formSource,
      date: formDate,
      description: formDesc,
      isRecurring: formRecurring,
      recurrenceInterval: formRecurring ? formInterval : null,
      remindMe: formRemindMe,
    };
    try {
      if (editingIncome) {
        await axios.put(`/api/income/${editingIncome.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIncomeSuccess('✅ Income record updated!');
      } else {
        await axios.post('/api/income', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIncomeSuccess('✅ Income recorded successfully!');
      }
      resetForm();
      fetchIncomes();
    } catch (err) {
      setIncomeError(err.response?.data?.message || 'Failed to save income');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/income/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomeSuccess('🗑️ Income record deleted');
      fetchIncomes();
    } catch (err) {
      setIncomeError('Failed to delete income record');
    }
  };

  // ── Expense CRUD ──────────────────────────────────────────────
  const resetExpForm = () => {
    setExpAmount(''); setExpCategory('Food');
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpDesc(''); setExpReceiptNote('');
    setExpRecurring(false); setExpInterval('monthly');
    setExpRemindMe(false); setEditingExp(null); setShowExpForm(false);
  };

  const openEditExp = (exp) => {
    setEditingExp(exp);
    setExpAmount(String(exp.amount));
    setExpCategory(exp.category);
    setExpDate(exp.date);
    setExpDesc(exp.description || '');
    setExpReceiptNote(exp.receiptNote || '');
    setExpRecurring(exp.isRecurring);
    setExpInterval(exp.recurrenceInterval || 'monthly');
    setExpRemindMe(exp.remindMe);
    setShowExpForm(true);
    setTimeout(() => expFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    setExpError(''); setExpSuccess('');
    const token = localStorage.getItem('token');
    const payload = {
      amount: parseFloat(expAmount),
      category: expCategory,
      date: expDate,
      description: expDesc,
      receiptNote: expReceiptNote,
      isRecurring: expRecurring,
      recurrenceInterval: expRecurring ? expInterval : null,
      remindMe: expRemindMe,
      isPaid: true,
    };
    try {
      if (editingExp) {
        await axios.put(`/api/expenses/${editingExp.id}`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setExpSuccess('✅ Expense updated!');
      } else {
        await axios.post('/api/expenses', payload, { headers: { Authorization: `Bearer ${token}` } });
        setExpSuccess('✅ Expense recorded!');
      }
      resetExpForm();
      fetchExpenses();
    } catch (err) {
      setExpError(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleDeleteExp = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await axios.delete(`/api/expenses/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setExpSuccess('🗑️ Expense deleted');
      fetchExpenses();
    } catch { setExpError('Failed to delete expense'); }
  };

  const handleTogglePause = async (id) => {
    try {
      await axios.patch(`/api/expenses/${id}/toggle-pause`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchExpenses();
    } catch { setExpError('Failed to toggle pause'); }
  };

  const handleConfirmPayment = async (id) => {
    try {
      await axios.patch(`/api/expenses/${id}/confirm-payment`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setExpSuccess('✅ Payment confirmed!');
      fetchExpenses();
    } catch { setExpError('Failed to confirm payment'); }
  };

  const handleExpSort = (field) => {
    if (expSortField === field) setExpSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setExpSortField(field); setExpSortDir('desc'); }
  };

  const handleExportExpenses = () => {
    const header = 'Date,Category,Amount (ETB),Recurring,Interval,Paid,Description\n';
    const rows = filteredExpenses.map(e =>
      `${e.date},${e.category},${parseFloat(e.amount).toFixed(2)},${e.isRecurring ? 'Yes' : 'No'},${e.recurrenceInterval || ''},${e.isPaid ? 'Yes' : 'No'},${(e.description || '').replace(/,/g, ' ')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'expense_records.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Expense Computations ───────────────────────────────────────
  const totalExpense = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyExpTotal = thisMonthExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const expRecurringCount = expenses.filter(e => e.isRecurring).length;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const dailyExpAverage = monthlyExpTotal / currentDay;

  const expCategoryBreakdown = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    return acc;
  }, {});

  // ── Filtered + Sorted Expense List ─────────────────────────────
  const filteredExpenses = expenses
    .filter(e => {
      const q = expSearchQuery.toLowerCase();
      if (q && !e.category.toLowerCase().includes(q) && !(e.description || '').toLowerCase().includes(q) && !(e.receiptNote || '').toLowerCase().includes(q)) return false;
      if (expFilterCat !== 'All' && e.category !== expFilterCat) return false;
      if (expFilterRec === 'Recurring' && !e.isRecurring) return false;
      if (expFilterRec === 'One-time' && e.isRecurring) return false;
      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      if (expSortField === 'amount') { valA = parseFloat(a.amount); valB = parseFloat(b.amount); }
      else if (expSortField === 'category') { valA = a.category; valB = b.category; }
      else { valA = new Date(a.date); valB = new Date(b.date); }
      if (valA < valB) return expSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return expSortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // ── Income Computations ───────────────────────────────────────
  const totalIncome = incomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const thisMonthIncomes = incomes.filter(i => {
    const d = new Date(i.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyTotal = thisMonthIncomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const recurringCount = incomes.filter(i => i.isRecurring).length;

  // Category breakdown
  const categoryBreakdown = INCOME_SOURCES.reduce((acc, src) => {
    acc[src] = incomes.filter(i => i.source === src).reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    return acc;
  }, {});

  // ── Filtered + Sorted Income List ─────────────────────────────
  const filteredIncomes = incomes
    .filter(i => {
      const q = searchQuery.toLowerCase();
      if (q && !i.source.toLowerCase().includes(q) && !(i.description || '').toLowerCase().includes(q)) return false;
      if (filterSource !== 'All' && i.source !== filterSource) return false;
      if (filterRecurring === 'Recurring' && !i.isRecurring) return false;
      if (filterRecurring === 'One-time' && i.isRecurring) return false;
      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortField === 'amount') { valA = parseFloat(a.amount); valB = parseFloat(b.amount); }
      else if (sortField === 'source') { valA = a.source; valB = b.source; }
      else { valA = new Date(a.date); valB = new Date(b.date); }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ── CSV Export ────────────────────────────────────────────────
  const handleExport = () => {
    const header = 'Date,Source,Amount (ETB),Recurring,Interval,Description\n';
    const rows = filteredIncomes.map(i =>
      `${i.date},${i.source},${parseFloat(i.amount).toFixed(2)},${i.isRecurring ? 'Yes' : 'No'},${i.recurrenceInterval || ''},${(i.description || '').replace(/,/g, ' ')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'income_records.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── KYC ──────────────────────────────────────────────────────
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setKycSuccess(''); setKycError('');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('/api/auth/kyc',
        { studentId, institution },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data.user);
      setKycSuccess('✅ KYC submitted successfully!');
    } catch (err) {
      setKycError(err.response?.data?.message || 'KYC submission failed');
    }
  };

  // ── Renderers ─────────────────────────────────────────────────
  const renderPlaceholder = (title, icon, desc) => (
    <div className="bw-placeholder">
      <span className="bw-placeholder-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  );

  // Dashboard home
  const renderStudentHome = () => (
    <>
      <div className="bw-welcome">
        <h1>Welcome, {user?.username || 'Student'} 🎓</h1>
        <p>Manage your student finances, budgets, and academic profile</p>
      </div>
      <div className="bw-stats-grid">
        {[
          { icon: '💰', label: 'Total Income',   value: `ETB ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#10b981' },
          { icon: '💸', label: 'Total Expenses', value: `ETB ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#ef4444' },
          { icon: '📉', label: 'Net This Month', value: `ETB ${(monthlyTotal - monthlyExpTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: (monthlyTotal - monthlyExpTotal) >= 0 ? '#6366f1' : '#f97316' },
          { icon: '📅', label: 'Daily Avg Spend',value: `ETB ${dailyExpAverage.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#eab308' },
        ].map(s => (
          <div className="bw-stat-card" key={s.label}>
            <span className="bw-stat-icon">{s.icon}</span>
            <div>
              <p className="bw-stat-label">{s.label}</p>
              <p className="bw-stat-value" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 24 }}>
        {incomes.length > 0 && (
          <div className="bw-card">
            <h3 className="bw-card-title">💰 Recent Income</h3>
            <p className="bw-card-sub">Your latest 5 income entries</p>
            <div className="bw-table-wrap">
              <table className="bw-table">
                <thead><tr><th>Date</th><th>Source</th><th>Amount</th></tr></thead>
                <tbody>
                  {incomes.slice(0, 5).map(i => (
                    <tr key={i.id}>
                      <td>{i.date}</td>
                      <td><span style={{ background: (SOURCE_COLORS[i.source] || '#94a3b8') + '25', color: SOURCE_COLORS[i.source] || '#94a3b8', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{i.source}</span></td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>+ ETB {parseFloat(i.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn-secondary" onClick={() => setActiveSection('income')} style={{ marginTop: 12, fontSize: '0.85rem' }}>View All Income →</button>
          </div>
        )}

        {expenses.length > 0 && (
          <div className="bw-card">
            <h3 className="bw-card-title">💸 Recent Expenses</h3>
            <p className="bw-card-sub">Your latest 5 expense entries</p>
            <div className="bw-table-wrap">
              <table className="bw-table">
                <thead><tr><th>Date</th><th>Category</th><th>Amount</th></tr></thead>
                <tbody>
                  {expenses.slice(0, 5).map(e => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td><span style={{ background: (EXPENSE_COLORS[e.category] || '#94a3b8') + '25', color: EXPENSE_COLORS[e.category] || '#94a3b8', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{e.category}</span></td>
                      <td style={{ color: '#ef4444', fontWeight: 700 }}>- ETB {parseFloat(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn-secondary" onClick={() => setActiveSection('expenses')} style={{ marginTop: 12, fontSize: '0.85rem' }}>View All Expenses →</button>
          </div>
        )}
      </div>

      <div className="bw-card" style={{ marginTop: (incomes.length > 0 || expenses.length > 0) ? 20 : 24 }}>
        <h3 className="bw-card-title">Academic & Verification Profile</h3>
        <div className="bw-info-grid">
          <div className="bw-info-row"><span>Email</span><strong>{user?.email}</strong></div>
          <div className="bw-info-row"><span>Student ID</span><strong>{user?.studentId || 'Not submitted'}</strong></div>
          <div className="bw-info-row"><span>Institution</span><strong>{user?.institution || 'Not submitted'}</strong></div>
          <div className="bw-info-row"><span>KYC Status</span><strong style={{ color: user?.kycStatus === 'submitted' ? '#10b981' : '#f59e0b', textTransform: 'capitalize' }}>{user?.kycStatus || 'Pending'}</strong></div>
          <div className="bw-info-row"><span>Account Status</span><strong style={{ color: isFrozen ? '#ef4444' : '#10b981' }}>{isFrozen ? 'Frozen 🚫' : 'Active ✅'}</strong></div>
        </div>
      </div>
    </>
  );

  // Full Income Section
  const renderIncomeSection = () => {
    const maxBar = Math.max(...Object.values(categoryBreakdown), 1);
    return (
      <>
        {/* Header */}
        <div className="bw-welcome" style={{ marginBottom: 0 }}>
          <h1>💰 Income Tracker</h1>
          <p>Record, manage and analyse all your income streams</p>
        </div>

        {/* Summary Cards */}
        <div className="bw-stats-grid" style={{ marginTop: 20 }}>
          {[
            { icon: '💰', label: 'Total Income',        value: `ETB ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#10b981' },
            { icon: '📅', label: 'This Month',          value: `ETB ${monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#6366f1' },
            { icon: '🔄', label: 'Recurring Streams',   value: `${recurringCount}`, color: '#f59e0b' },
            { icon: '🗂️', label: 'Total Entries',       value: `${incomes.length}`, color: '#a855f7' },
          ].map(s => (
            <div className="bw-stat-card" key={s.label}>
              <span className="bw-stat-icon">{s.icon}</span>
              <div>
                <p className="bw-stat-label">{s.label}</p>
                <p className="bw-stat-value" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 20 }}>
          {/* Category Bar Chart */}
          <div className="bw-card">
            <h3 className="bw-card-title">📊 Income by Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {INCOME_SOURCES.filter(s => categoryBreakdown[s] > 0).map(src => (
                <div key={src}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                    <span style={{ color: SOURCE_COLORS[src] || '#94a3b8', fontWeight: 600 }}>{src}</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>ETB {categoryBreakdown[src].toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(categoryBreakdown[src] / maxBar) * 100}%`, background: SOURCE_COLORS[src] || '#94a3b8', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
              {INCOME_SOURCES.every(s => categoryBreakdown[s] === 0) && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>Add income records to see the chart</p>
              )}
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bw-card">
            <h3 className="bw-card-title">📈 Monthly Income Trend</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginTop: 16 }}>
              {Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (5 - i));
                const m = d.getMonth(); const y = d.getFullYear();
                const total = incomes.filter(inc => { const id = new Date(inc.date); return id.getMonth() === m && id.getFullYear() === y; }).reduce((s, inc) => s + parseFloat(inc.amount || 0), 0);
                const label = d.toLocaleString('default', { month: 'short' });
                const maxMonthly = Math.max(...Array.from({ length: 6 }, (_, j) => { const dd = new Date(); dd.setMonth(dd.getMonth() - (5 - j)); const mm = dd.getMonth(); const yy = dd.getFullYear(); return incomes.filter(inc => { const id = new Date(inc.date); return id.getMonth() === mm && id.getFullYear() === yy; }).reduce((s, inc) => s + parseFloat(inc.amount || 0), 0); }), 1);
                const heightPct = `${(total / maxMonthly) * 80 + 5}%`;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.65rem', color: '#a78bfa', marginBottom: 3, fontWeight: 600 }}>{total > 0 ? `${(total / 1000).toFixed(1)}k` : ''}</span>
                    <div style={{ width: '60%', height: heightPct, background: 'linear-gradient(180deg, #a855f7, #6366f1)', borderRadius: 4, minHeight: 4 }} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add / Edit Income Form */}
        <div className="bw-card" style={{ marginTop: 20 }} ref={formRef}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="bw-card-title" style={{ marginBottom: 0 }}>{editingIncome ? '✏️ Edit Income' : '➕ Add Income'}</h3>
            <button
              className="btn-primary"
              onClick={() => { resetForm(); setShowForm(v => !v); }}
              style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem', marginTop: 0 }}
            >
              {showForm && !editingIncome ? '✕ Cancel' : '+ Add Income'}
            </button>
          </div>

          {(showForm || editingIncome) && (
            <form onSubmit={handleFormSubmit}>
              {incomeError   && <p className="error">{incomeError}</p>}
              {incomeSuccess && <p className="bw-success">{incomeSuccess}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Amount (ETB) *</label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={formAmount} onChange={e => setFormAmount(e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Source *</label>
                  <select value={formSource} onChange={e => setFormSource(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.95rem' }}>
                    {INCOME_SOURCES.map(s => <option key={s} value={s} style={{ background: '#1a1640' }}>{s}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Date *</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required style={{ colorScheme: 'dark' }} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <input type="text" placeholder="Optional note..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={formRecurring} onChange={e => setFormRecurring(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#7c5cfc' }} />
                  🔄 Recurring Income
                </label>
                {formRecurring && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Repeats:</span>
                    <select value={formInterval} onChange={e => setFormInterval(e.target.value)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                      {RECURRENCE_INTERVALS.map(r => <option key={r} value={r} style={{ background: '#1a1640' }}>{r}</option>)}
                    </select>
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={formRemindMe} onChange={e => setFormRemindMe(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#7c5cfc' }} />
                  🔔 Remind me
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 28px', marginTop: 0 }}>
                  {editingIncome ? '💾 Update Income' : '💾 Save Income'}
                </button>
                {editingIncome && (
                  <button type="button" className="btn-secondary" onClick={resetForm} style={{ padding: '10px 20px' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {!showForm && !editingIncome && !incomeError && incomeSuccess && (
            <p className="bw-success" style={{ marginTop: 8 }}>{incomeSuccess}</p>
          )}
        </div>

        {/* Controls: Search / Filter / Sort / Export */}
        <div className="bw-card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            {/* Search */}
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>🔍</span>
              <input
                type="text" placeholder="Search source or description..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>
            {/* Source filter */}
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem' }}>
              <option value="All" style={{ background: '#1a1640' }}>All Sources</option>
              {INCOME_SOURCES.map(s => <option key={s} value={s} style={{ background: '#1a1640' }}>{s}</option>)}
            </select>
            {/* Recurring filter */}
            <select value={filterRecurring} onChange={e => setFilterRecurring(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem' }}>
              <option value="All"       style={{ background: '#1a1640' }}>All Types</option>
              <option value="Recurring" style={{ background: '#1a1640' }}>🔄 Recurring</option>
              <option value="One-time"  style={{ background: '#1a1640' }}>📌 One-time</option>
            </select>
            {/* Export */}
            <button onClick={handleExport} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0 }}>
              ⬇️ Export CSV
            </button>
          </div>

          {/* Results count */}
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            Showing {filteredIncomes.length} of {incomes.length} records
          </div>

          {incomeLoading && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading...</p>}

          {filteredIncomes.length === 0 && !incomeLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>💰</p>
              <p>No income records yet. Add your first income above!</p>
            </div>
          ) : (
            <div className="bw-table-wrap">
              <table className="bw-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Date {sortField === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => handleSort('source')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Source {sortField === 'source' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Amount {sortField === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th>Type</th>
                    <th>Remind</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.map(inc => (
                    <tr key={inc.id}>
                      <td>{inc.date}</td>
                      <td>
                        <span style={{ background: (SOURCE_COLORS[inc.source] || '#94a3b8') + '25', color: SOURCE_COLORS[inc.source] || '#94a3b8', padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {inc.source}
                        </span>
                      </td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>
                        ETB {parseFloat(inc.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        {inc.isRecurring
                          ? <span style={{ color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600 }}>🔄 {inc.recurrenceInterval}</span>
                          : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>One-time</span>
                        }
                      </td>
                      <td style={{ textAlign: 'center' }}>{inc.remindMe ? '🔔' : '—'}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{inc.description || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEditForm(inc)} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}>✏️</button>
                          <button onClick={() => handleDelete(inc.id)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recurring Reminders */}
        {incomes.filter(i => i.isRecurring && i.remindMe).length > 0 && (
          <div className="bw-card" style={{ marginTop: 20, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
            <h3 className="bw-card-title">🔔 Income Reminders</h3>
            <p className="bw-card-sub">Recurring income entries with reminders enabled</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {incomes.filter(i => i.isRecurring && i.remindMe).map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{i.source}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontSize: '0.8rem' }}>Repeats {i.recurrenceInterval}</span>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>ETB {parseFloat(i.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  // Full Expense Section
  const renderExpenseSection = () => {
    const maxBar = Math.max(...Object.values(expCategoryBreakdown), 1);
    return (
      <>
        <div className="bw-welcome" style={{ marginBottom: 0 }}>
          <h1>💸 Expenses Tracker</h1>
          <p>Record, manage and analyse all your spending</p>
        </div>

        {/* Summary Cards */}
        <div className="bw-stats-grid" style={{ marginTop: 20 }}>
          {[
            { icon: '💸', label: 'Total Expenses', value: `ETB ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#ef4444' },
            { icon: '📅', label: 'This Month',   value: `ETB ${monthlyExpTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#f97316' },
            { icon: '📉', label: 'Daily Average', value: `ETB ${dailyExpAverage.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#eab308' },
            { icon: '🧾', label: 'Total Entries', value: `${expenses.length}`, color: '#06b6d4' },
          ].map(s => (
            <div className="bw-stat-card" key={s.label}>
              <span className="bw-stat-icon">{s.icon}</span>
              <div>
                <p className="bw-stat-label">{s.label}</p>
                <p className="bw-stat-value" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 20 }}>
          {/* Category Bar Chart */}
          <div className="bw-card">
            <h3 className="bw-card-title">📊 Spending by Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {EXPENSE_CATEGORIES.filter(c => expCategoryBreakdown[c] > 0).map(cat => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                    <span style={{ color: EXPENSE_COLORS[cat] || '#94a3b8', fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>ETB {expCategoryBreakdown[cat].toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(expCategoryBreakdown[cat] / maxBar) * 100}%`, background: EXPENSE_COLORS[cat] || '#94a3b8', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
              {EXPENSE_CATEGORIES.every(c => expCategoryBreakdown[c] === 0) && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>Add expenses to see the chart</p>
              )}
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bw-card">
            <h3 className="bw-card-title">📉 Monthly Spending Trend</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginTop: 16 }}>
              {Array.from({ length: 6 }, (_, i) => {
                const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
                const m = d.getMonth(); const y = d.getFullYear();
                const total = expenses.filter(e => { const id = new Date(e.date); return id.getMonth() === m && id.getFullYear() === y; }).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                const label = d.toLocaleString('default', { month: 'short' });
                const maxMonthly = Math.max(...Array.from({ length: 6 }, (_, j) => { const dd = new Date(); dd.setMonth(dd.getMonth() - (5 - j)); const mm = dd.getMonth(); const yy = dd.getFullYear(); return expenses.filter(e => { const id = new Date(e.date); return id.getMonth() === mm && id.getFullYear() === yy; }).reduce((s, e) => s + parseFloat(e.amount || 0), 0); }), 1);
                const heightPct = `${(total / maxMonthly) * 80 + 5}%`;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.65rem', color: '#ef4444', marginBottom: 3, fontWeight: 600 }}>{total > 0 ? `${(total / 1000).toFixed(1)}k` : ''}</span>
                    <div style={{ width: '60%', height: heightPct, background: 'linear-gradient(180deg, #ef4444, #f97316)', borderRadius: 4, minHeight: 4 }} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add / Edit Expense Form */}
        <div className="bw-card" style={{ marginTop: 20 }} ref={expFormRef}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="bw-card-title" style={{ marginBottom: 0 }}>{editingExp ? '✏️ Edit Expense' : '➕ Add Expense'}</h3>
            <button className="btn-primary" onClick={() => { resetExpForm(); setShowExpForm(v => !v); }} style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem', marginTop: 0, background: '#ef4444' }}>
              {showExpForm && !editingExp ? '✕ Cancel' : '+ Add Expense'}
            </button>
          </div>

          {(showExpForm || editingExp) && (
            <form onSubmit={handleExpSubmit}>
              {expError   && <p className="error">{expError}</p>}
              {expSuccess && <p className="bw-success">{expSuccess}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Amount (ETB) *</label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Category *</label>
                  <select value={expCategory} onChange={e => setExpCategory(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.95rem' }}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1640' }}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Date *</label>
                  <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} required style={{ colorScheme: 'dark' }} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <input type="text" placeholder="Coffee, Rent, etc..." value={expDesc} onChange={e => setExpDesc(e.target.value)} />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: 16 }}>
                <label>Receipt Note (Optional)</label>
                <textarea placeholder="Paste receipt ID or extra notes here..." value={expReceiptNote} onChange={e => setExpReceiptNote(e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={expRecurring} onChange={e => setExpRecurring(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#ef4444' }} />
                  🔄 Recurring Expense
                </label>
                {expRecurring && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Repeats:</span>
                    <select value={expInterval} onChange={e => setExpInterval(e.target.value)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                      {RECURRENCE_INTERVALS.map(r => <option key={r} value={r} style={{ background: '#1a1640' }}>{r}</option>)}
                    </select>
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={expRemindMe} onChange={e => setExpRemindMe(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#ef4444' }} />
                  🔔 Remind me to pay
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 28px', marginTop: 0, background: '#ef4444' }}>
                  {editingExp ? '💾 Update Expense' : '💾 Save Expense'}
                </button>
                {editingExp && <button type="button" className="btn-secondary" onClick={resetExpForm} style={{ padding: '10px 20px' }}>Cancel</button>}
              </div>
            </form>
          )}

          {!showExpForm && !editingExp && !expError && expSuccess && (
            <p className="bw-success" style={{ marginTop: 8 }}>{expSuccess}</p>
          )}
        </div>

        {/* Controls */}
        <div className="bw-card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            {/* Search */}
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>🔍</span>
              <input type="text" placeholder="Search category, desc or receipt..." value={expSearchQuery} onChange={e => setExpSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem' }} />
            </div>
            {/* Category filter */}
            <select value={expFilterCat} onChange={e => setExpFilterCat(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem' }}>
              <option value="All" style={{ background: '#1a1640' }}>All Categories</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1640' }}>{c}</option>)}
            </select>
            {/* Recurring filter */}
            <select value={expFilterRec} onChange={e => setExpFilterRec(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem' }}>
              <option value="All"       style={{ background: '#1a1640' }}>All Types</option>
              <option value="Recurring" style={{ background: '#1a1640' }}>🔄 Recurring</option>
              <option value="One-time"  style={{ background: '#1a1640' }}>📌 One-time</option>
            </select>
            {/* Export */}
            <button onClick={handleExportExpenses} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0 }}>⬇️ Export</button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            Showing {filteredExpenses.length} of {expenses.length} records
          </div>

          {expLoading && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading...</p>}

          {filteredExpenses.length === 0 && !expLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>💸</p>
              <p>No expenses recorded yet.</p>
            </div>
          ) : (
            <div className="bw-table-wrap">
              <table className="bw-table">
                <thead>
                  <tr>
                    <th onClick={() => handleExpSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>Date {expSortField === 'date' ? (expSortDir === 'asc' ? '↑' : '↓') : '↕'}</th>
                    <th onClick={() => handleExpSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>Category {expSortField === 'category' ? (expSortDir === 'asc' ? '↑' : '↓') : '↕'}</th>
                    <th onClick={() => handleExpSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>Amount {expSortField === 'amount' ? (expSortDir === 'asc' ? '↑' : '↓') : '↕'}</th>
                    <th>Type</th>
                    <th>Receipt</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{exp.date}</td>
                      <td>
                        <span style={{ background: (EXPENSE_COLORS[exp.category] || '#94a3b8') + '25', color: EXPENSE_COLORS[exp.category] || '#94a3b8', padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ color: '#ef4444', fontWeight: 700 }}>
                        ETB {parseFloat(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        {exp.isRecurring
                          ? <span style={{ color: exp.isPaused ? 'rgba(255,255,255,0.3)' : '#f97316', fontSize: '0.78rem', fontWeight: 600 }}>{exp.isPaused ? '⏸️ Paused' : `🔄 ${exp.recurrenceInterval}`}</span>
                          : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>One-time</span>
                        }
                      </td>
                      <td>
                        {exp.receiptNote ? (
                          <button onClick={() => setShowReceiptId(showReceiptId === exp.id ? null : exp.id)} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '0.85rem' }}>📎 View</button>
                        ) : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{exp.description || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEditExp(exp)} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem' }}>✏️</button>
                          <button onClick={() => handleDeleteExp(exp.id)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Receipt Modal/View */}
        {showReceiptId && (
          <div className="bw-card" style={{ marginTop: 20, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="bw-card-title" style={{ marginBottom: 0 }}>📎 Receipt Note</h3>
              <button onClick={() => setShowReceiptId(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginTop: 12, whiteSpace: 'pre-wrap' }}>
              {expenses.find(e => e.id === showReceiptId)?.receiptNote}
            </p>
          </div>
        )}

        {/* Recurring Management & Reminders */}
        {expenses.filter(e => e.isRecurring).length > 0 && (
          <div className="bw-card" style={{ marginTop: 20, border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.05)' }}>
            <h3 className="bw-card-title">🔄 Recurring Expenses & Reminders</h3>
            <p className="bw-card-sub">Manage your ongoing subscriptions and payments</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {expenses.filter(e => e.isRecurring).map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(249,115,22,0.08)', borderRadius: 10, border: '1px solid rgba(249,115,22,0.15)' }}>
                  <div>
                    <span style={{ color: '#f97316', fontWeight: 700 }}>{e.category}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontSize: '0.8rem' }}>{e.recurrenceInterval} {e.remindMe ? '· 🔔' : ''}</span>
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem', marginTop: 4 }}>ETB {parseFloat(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!e.isPaid && e.remindMe && (
                      <button onClick={() => handleConfirmPayment(e.id)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>✓ Mark Paid</button>
                    )}
                    {e.isPaid && e.remindMe && (
                      <span style={{ color: '#10b981', fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: 6, fontWeight: 600 }}>✅ Paid</span>
                    )}
                    <button onClick={() => handleTogglePause(e.id)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {e.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  // Transactions section (connected to income & expense data)
  const renderTransactions = () => {
    const allTransactions = [
      ...incomes.map(i => ({ ...i, txType: 'INCOME', displayColor: '#10b981', catLabel: i.source, isCatValid: !!SOURCE_COLORS[i.source] })),
      ...expenses.map(e => ({ ...e, txType: 'EXPENSE', displayColor: '#ef4444', catLabel: e.category, isCatValid: !!EXPENSE_COLORS[e.category] }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <>
        <div className="bw-welcome">
          <h1>🧾 Transaction History</h1>
          <p>All your recorded income and expenses</p>
        </div>
        <div className="bw-card" style={{ marginTop: 20 }}>
          <h3 className="bw-card-title">💸 All Transactions</h3>
          {allTransactions.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '24px 0' }}>No transactions recorded yet.</p>
          ) : (
            <div className="bw-table-wrap">
              <table className="bw-table">
                <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead>
                <tbody>
                  {allTransactions.map(tx => (
                    <tr key={`${tx.txType}-${tx.id}`}>
                      <td>{tx.date}</td>
                      <td>
                        <span style={{ color: tx.displayColor, fontSize: '0.8rem', fontWeight: 600 }}>
                          {tx.txType === 'INCOME' ? 'INCOME ↑' : 'EXPENSE ↓'}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: ((tx.txType === 'INCOME' ? SOURCE_COLORS[tx.catLabel] : EXPENSE_COLORS[tx.catLabel]) || '#94a3b8') + '25', color: (tx.txType === 'INCOME' ? SOURCE_COLORS[tx.catLabel] : EXPENSE_COLORS[tx.catLabel]) || '#94a3b8', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>
                          {tx.catLabel}
                        </span>
                      </td>
                      <td style={{ color: tx.displayColor, fontWeight: 700 }}>
                        {tx.txType === 'INCOME' ? '+' : '-'} ETB {parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{tx.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // Analytics section (connected to income & expenses data)
  const renderAnalytics = () => {
    const maxCatInc = Math.max(...Object.values(categoryBreakdown), 1);
    const maxCatExp = Math.max(...Object.values(expCategoryBreakdown), 1);
    const netIncome = totalIncome - totalExpense;
    const netMonthly = monthlyTotal - monthlyExpTotal;

    return (
      <>
        <div className="bw-welcome">
          <h1>📈 Analytics</h1>
          <p>Deep insights into your income patterns, spending habits and net flow</p>
        </div>
        
        {/* Top Level Summary Cards */}
        <div className="bw-stats-grid" style={{ marginTop: 20 }}>
          {[
            { icon: '💰', label: 'Net Total',      value: `ETB ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: netIncome >= 0 ? '#10b981' : '#ef4444' },
            { icon: '📅', label: 'Net This Month', value: `ETB ${netMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: netMonthly >= 0 ? '#6366f1' : '#f97316' },
            { icon: '📈', label: 'Total Income',   value: `ETB ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#10b981' },
            { icon: '📉', label: 'Total Expenses', value: `ETB ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#ef4444' },
          ].map(s => (
            <div className="bw-stat-card" key={s.label}><span className="bw-stat-icon">{s.icon}</span><div><p className="bw-stat-label">{s.label}</p><p className="bw-stat-value" style={{ color: s.color }}>{s.value}</p></div></div>
          ))}
        </div>

        {/* Incomes & Expenses Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 20 }}>
          <div className="bw-card">
            <h3 className="bw-card-title">📊 Income Breakdown</h3>
            {INCOME_SOURCES.filter(s => categoryBreakdown[s] > 0).map(src => (
              <div key={src} style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                  <span style={{ color: SOURCE_COLORS[src], fontWeight: 600 }}>{src}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>ETB {categoryBreakdown[src].toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(categoryBreakdown[src] / maxCatInc) * 100}%`, background: SOURCE_COLORS[src], borderRadius: 6 }} />
                </div>
              </div>
            ))}
            {INCOME_SOURCES.every(s => categoryBreakdown[s] === 0) && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>No income data yet</p>}
          </div>

          <div className="bw-card">
            <h3 className="bw-card-title">📊 Expenses Breakdown</h3>
            {EXPENSE_CATEGORIES.filter(s => expCategoryBreakdown[s] > 0).map(cat => (
              <div key={cat} style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                  <span style={{ color: EXPENSE_COLORS[cat], fontWeight: 600 }}>{cat}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>ETB {expCategoryBreakdown[cat].toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(expCategoryBreakdown[cat] / maxCatExp) * 100}%`, background: EXPENSE_COLORS[cat], borderRadius: 6 }} />
                </div>
              </div>
            ))}
            {EXPENSE_CATEGORIES.every(s => expCategoryBreakdown[s] === 0) && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>No expense data yet</p>}
          </div>
        </div>

        {/* Monthly Trend Overlay */}
        <div className="bw-card" style={{ marginTop: 20 }}>
          <h3 className="bw-card-title">📈 Monthly Cash Flow Trend</h3>
          <p className="bw-card-sub" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981' }}></div> Income</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: '#ef4444' }}></div> Expenses</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 140, marginTop: 16 }}>
            {Array.from({ length: 6 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
              const m = d.getMonth(); const y = d.getFullYear();
              const mInc = incomes.filter(inc => { const id = new Date(inc.date); return id.getMonth() === m && id.getFullYear() === y; }).reduce((s, inc) => s + parseFloat(inc.amount || 0), 0);
              const mExp = expenses.filter(exp => { const id = new Date(exp.date); return id.getMonth() === m && id.getFullYear() === y; }).reduce((s, exp) => s + parseFloat(exp.amount || 0), 0);
              const label = d.toLocaleString('default', { month: 'short' });
              const maxAll = Math.max(...Array.from({ length: 6 }, (_, j) => {
                const dd = new Date(); dd.setMonth(dd.getMonth() - (5 - j)); const mm = dd.getMonth(); const yy = dd.getFullYear();
                const mi = incomes.filter(inc => { const id = new Date(inc.date); return id.getMonth() === mm && id.getFullYear() === yy; }).reduce((s, inc) => s + parseFloat(inc.amount || 0), 0);
                const me = expenses.filter(exp => { const id = new Date(exp.date); return id.getMonth() === mm && id.getFullYear() === yy; }).reduce((s, exp) => s + parseFloat(exp.amount || 0), 0);
                return Math.max(mi, me);
              }), 1);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', gap: '5%', height: '80%' }}>
                    <div style={{ flex: 1, height: `${(mInc / maxAll) * 100}%`, background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                    <div style={{ flex: 1, height: `${(mExp / maxAll) * 100}%`, background: 'linear-gradient(180deg, #ef4444, #dc2626)', borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  // AI Insights (connected to income & expenses data)
  const renderAiInsights = () => {
    const topSource = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];
    const topExpense = Object.entries(expCategoryBreakdown).sort((a, b) => b[1] - a[1])[0];
    const avgMonthlyInc = incomes.length > 0 ? totalIncome / Math.max(1, [...new Set(incomes.map(i => i.date.slice(0, 7)))].length) : 0;
    const avgMonthlyExp = expenses.length > 0 ? totalExpense / Math.max(1, [...new Set(expenses.map(e => e.date.slice(0, 7)))].length) : 0;
    const saveRate = avgMonthlyInc > 0 ? ((avgMonthlyInc - avgMonthlyExp) / avgMonthlyInc) * 100 : 0;

    return (
      <>
        <div className="bw-welcome">
          <h1>🤖 AI Insights</h1>
          <p>Personalized financial advice powered by your real transaction data</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          {incomes.length === 0 && expenses.length === 0 ? (
            <div className="bw-card">
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 8 }}>🤖</p>
                <p>Add income and expense records to unlock AI-powered financial insights!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Savings Rate Insight */}
              <div className="bw-card" style={{ border: `1px solid ${saveRate >= 20 ? 'rgba(16,185,129,0.3)' : saveRate > 0 ? 'rgba(249,115,22,0.3)' : 'rgba(239,68,68,0.3)'}`, background: `${saveRate >= 20 ? 'rgba(16,185,129,0.05)' : saveRate > 0 ? 'rgba(249,115,22,0.05)' : 'rgba(239,68,68,0.05)'}` }}>
                <h3 className="bw-card-title">{saveRate >= 20 ? '🏆 Excellent Savings Rate' : saveRate > 0 ? '⚠️ Moderate Savings Rate' : '🚨 Negative Cash Flow Warning'}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: '0.9rem', marginTop: 8 }}>
                  Your estimated average savings rate is <strong style={{ color: saveRate >= 20 ? '#10b981' : saveRate > 0 ? '#f97316' : '#ef4444' }}>{saveRate.toFixed(1)}%</strong>.
                  {saveRate >= 20
                    ? ' You are doing a fantastic job saving a healthy portion of your income! Keep up the good work.'
                    : saveRate > 0
                    ? ' You are saving some money, but experts recommend aiming for a 20% savings rate. Look for areas to cut back on expenses.'
                    : ' Your average expenses exceed your average income. Please review your spending habits immediately to avoid debt.'}
                </p>
              </div>

              {/* Expense Heavy Insight */}
              {topExpense && topExpense[1] > 0 && (
                <div className="bw-card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                  <h3 className="bw-card-title">🔍 Spending Anomaly Detected</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: '0.9rem', marginTop: 8 }}>
                    A significant portion of your budget is going towards <strong style={{ color: EXPENSE_COLORS[topExpense[0]] || '#ef4444' }}>{topExpense[0]}</strong>, which accounts for <strong style={{ color: '#ef4444' }}>ETB {topExpense[1].toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> of your total expenses. Consider setting a strict budget limit for this category next month.
                  </p>
                </div>
              )}

              {/* Income Diversification */}
              <div className="bw-card" style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
                <h3 className="bw-card-title">📊 Diversification Score</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: '0.9rem', marginTop: 8 }}>
                  You are earning from <strong style={{ color: '#a78bfa' }}>{INCOME_SOURCES.filter(s => categoryBreakdown[s] > 0).length} source type{INCOME_SOURCES.filter(s => categoryBreakdown[s] > 0).length !== 1 ? 's' : ''}</strong>.
                  {INCOME_SOURCES.filter(s => categoryBreakdown[s] > 0).length < 3
                    ? ' Financial experts recommend having at least 3 income sources. Consider adding freelance work or a scholarship application.'
                    : ' Great diversification! Multiple income streams help cushion against financial uncertainty.'}
                </p>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  // KYC Settings
  const renderKycSection = () => (
    <div className="bw-card">
      <h3 className="bw-card-title">🎓 Student KYC Verification</h3>
      <p className="bw-card-sub">Submit your student ID and institution to complete verification</p>
      {kycSuccess && <p className="bw-success">{kycSuccess}</p>}
      {kycError   && <p className="error">{kycError}</p>}
      <form onSubmit={handleKycSubmit} className="bw-kyc-form">
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label htmlFor="student-id-input">Student ID</label>
          <input id="student-id-input" type="text" placeholder="STU-987654" value={studentId} onChange={e => setStudentId(e.target.value)} required />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label htmlFor="institution-input">Institution</label>
          <input id="institution-input" type="text" placeholder="Addis Ababa University" value={institution} onChange={e => setInstitution(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary" id="btn-submit-kyc" style={{ marginTop: 0, width: 'auto', padding: '10px 24px' }}>Submit KYC</button>
      </form>
      {user?.kycStatus === 'submitted' && (
        <div className="bw-kyc-submitted">📋 <strong>Submitted Details —</strong> ID: <u>{user.studentId}</u> · Institution: <u>{user.institution}</u></div>
      )}
    </div>
  );

  const sectionContent = () => {
    switch (activeSection) {
      case 'dashboard':    return renderStudentHome();
      case 'income':       return renderIncomeSection();
      case 'expenses':     return renderExpenseSection();
      case 'budgets':      return renderPlaceholder('Budgets', '📊', 'Set monthly budget limits and track progress.');
      case 'savings':      return renderPlaceholder('Savings Goals', '🎯', 'Create savings goals and monitor your progress.');
      case 'analytics':    return renderAnalytics();
      case 'ai':           return renderAiInsights();
      case 'transactions': return renderTransactions();
      case 'settings':     return renderKycSection();
      default:             return renderStudentHome();
    }
  };

  return (
    <div className="bw-layout">
      {/* 🔴 FROZEN BLOCK NOTICE */}
      {isFrozen && (
        <div id="block-notice-overlay" className="bw-frozen-overlay">
          <div className="bw-frozen-card">
            <div style={{ fontSize: '4rem' }}>🚫</div>
            <h1 id="block-notice-title">ACCOUNT FROZEN</h1>
            <p id="block-notice-message">Your account has been suspended by an administrator.<br />All actions are blocked immediately.</p>
            <div className="bw-frozen-code">Status: <strong>ACCOUNT_SUSPENDED</strong></div>
            <button onClick={handleLogout} className="bw-frozen-btn">Sign Out</button>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="bw-sidebar">
        <div className="bw-sidebar-brand">
          <span className="bw-brand-icon">💰</span>
          <span className="bw-brand-text">BirrWise</span>
        </div>
        <nav className="bw-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`bw-nav-item${activeSection === item.id ? ' active' : ''}`} onClick={() => setActiveSection(item.id)} id={`nav-${item.id}`}>
              <span className="bw-nav-icon">{item.icon}</span>
              <span className="bw-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="bw-nav-item bw-settings-item" onClick={() => setActiveSection('settings')} style={{ marginTop: 'auto' }} id="nav-settings">
          <span className="bw-nav-icon">⚙️</span>
          <span className="bw-nav-label">Settings</span>
        </button>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div className="bw-main">
        <header className="bw-topbar">
          <div className="bw-topbar-title">
            {[...NAV_ITEMS, { id: 'settings', label: 'Settings' }].find(n => n.id === activeSection)?.icon}{' '}
            {[...NAV_ITEMS, { id: 'settings', label: 'Settings' }].find(n => n.id === activeSection)?.label}
          </div>
          <div className="bw-topbar-right">
            <span className="bw-user-chip" id="user-badge-display">
              👤 {user?.username || 'User'}
              <span className="bw-admin-badge" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>STUDENT</span>
            </span>
            <button className="bw-logout-btn" id="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <main className="bw-content">{sectionContent()}</main>
      </div>
    </div>
  );
}
