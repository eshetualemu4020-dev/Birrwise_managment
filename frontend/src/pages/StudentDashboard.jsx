// src/pages/StudentDashboard.jsx
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import ReactMarkdown from 'react-markdown';
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



export default function StudentDashboard() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState(location.state?.activeSection || 'dashboard');
  const [user, setUser]       = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [systemCategories, setSystemCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // AI Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  // ── Auth & Export ──────────────────────────────────────────────────────
  const handleExportData = () => {
    // Basic CSV Generation
    let csv = "Type,Date,Amount,Source/Category,Description,Recurring\n";
    
    incomes.forEach(inc => {
      csv += `"Income","${inc.date}","${inc.amount}","${inc.source}","${inc.description || ''}","${inc.isRecurring ? inc.recurrenceInterval : 'No'}"\n`;
    });
    
    expenses.forEach(exp => {
      csv += `"Expense","${exp.date}","${exp.amount}","${exp.Category?.name || 'Unknown'}","${exp.description || ''}","${exp.isRecurring ? exp.recurrenceInterval : 'No'}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `BirrWise_Export_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

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

  
  const fetchCategories = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSystemCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, []);

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
    fetchNotifications();
    const t = setInterval(() => {
      fetchProfile();
      fetchNotifications();
    }, 4000);
    return () => clearInterval(t);
  }, [fetchProfile, fetchNotifications]);

  // ── Budget API (Dashboard Preview) ──────────────────────────────
  const [budgetsDashboard, setBudgetsDashboard] = useState([]);
  
  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };
  
  const fetchBudgetsDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('/api/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgetsDashboard(res.data.budgets || []);
    } catch (err) {
      console.error('Failed to load budgets for dashboard');
    }
  }, []);

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
    const needsIncome = ['income', 'dashboard', 'transactions', 'analytics'];
    const needsExpense = ['expenses', 'dashboard', 'transactions', 'analytics', 'budgets'];
    if (needsIncome.includes(activeSection))  fetchIncomes();
    if (needsExpense.includes(activeSection)) {
      fetchExpenses();
      fetchBudgetsDashboard();
      fetchCategories();
    }
  }, [activeSection, fetchIncomes, fetchExpenses, fetchBudgetsDashboard, fetchCategories]);

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

  
  // ── Dynamic Categories ─────────────────────────────────────────
  const INCOME_SOURCES = Array.from(new Set([
    ...systemCategories.filter(c => c.type === 'income').map(c => c.name),
    ...incomes.map(i => i.source)
  ]));
  const EXPENSE_CATEGORIES = Array.from(new Set([
    ...systemCategories.filter(c => c.type === 'expense').map(c => c.name),
    ...expenses.map(e => e.category)
  ]));

  const getCategoryColor = (name, type) => {
    const cat = systemCategories.find(c => c.name === name && c.type === type);
    if (cat && cat.color) return cat.color;
    // fallback hash color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + ('00000'.substring(0, 6 - c.length) + c);
  };
  const SOURCE_COLORS = INCOME_SOURCES.reduce((acc, src) => { acc[src] = getCategoryColor(src, 'income'); return acc; }, {});
  const EXPENSE_COLORS = EXPENSE_CATEGORIES.reduce((acc, cat) => { acc[cat] = getCategoryColor(cat, 'expense'); return acc; }, {});
  
  // Set default form values dynamically if available
  useEffect(() => {
    if (systemCategories.length > 0) {
      if (!formSource || formSource === 'Allowance') {
        const defaultInc = systemCategories.find(c => c.type === 'income')?.name;
        if (defaultInc) setFormSource(defaultInc);
      }
      if (!expCategory || expCategory === 'Food') {
        const defaultExp = systemCategories.find(c => c.type === 'expense')?.name;
        if (defaultExp) setExpCategory(defaultExp);
      }
    }
  }, [systemCategories, formSource, expCategory]);

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
        
        {/* BUDGET PROGRESS */}
        <div className="bw-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/student/budgets')}>
          <h3 className="bw-card-title">📊 Budget Progress</h3>
          <p className="bw-card-sub">Your top active budgets</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '12px' }}>
            {budgetsDashboard.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No active budgets found. Click to create one.</p>
            ) : (
              budgetsDashboard.slice(0, 3).map(b => {
                const percent = Math.min(b.percentageUsed || 0, 100);
                let color = '#10b981';
                if (percent >= 75) color = '#eab308';
                if (percent >= 90) color = '#f97316';
                if (percent >= 100) color = '#ef4444';
                
                return (
                  <div key={b.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{b.name}</span>
                      <span>{b.spentAmount || 0} / {b.amount} ETB ({percent.toFixed(1)}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(var(--overlay-rgb),0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: color, transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>ETB {categoryBreakdown[src].toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(var(--overlay-rgb),0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(categoryBreakdown[src] / maxBar) * 100}%`, background: SOURCE_COLORS[src] || '#94a3b8', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
              {INCOME_SOURCES.every(s => categoryBreakdown[s] === 0) && (
                <p style={{ color: 'rgba(var(--overlay-rgb),0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>Add income records to see the chart</p>
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
                    <span style={{ fontSize: '0.65rem', color: 'rgba(var(--overlay-rgb),0.4)', marginTop: 5 }}>{label}</span>
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
                  <select value={formSource} onChange={e => setFormSource(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.95rem' }}>
                    {systemCategories.filter(c => c.type === 'income').map(s => <option key={s.name} value={s.name} style={{ background: 'var(--bg-solid)' }}>{s.icon} {s.name}</option>)}
                    {/* Fallback for historical data */}
                    {!systemCategories.some(c => c.type === 'income' && c.name === formSource) && <option value={formSource} style={{ background: 'var(--bg-solid)' }}>{formSource} (Historical)</option>}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Date *</label>
                  <input type="date" value={formDate} min={new Date().toISOString().slice(0, 10)} max={new Date().toISOString().slice(0, 10)} onChange={e => setFormDate(e.target.value)} required style={{ colorScheme: 'dark' }} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <input type="text" placeholder="Optional note..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(var(--overlay-rgb),0.8)', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={formRecurring} onChange={e => setFormRecurring(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#7c5cfc' }} />
                  🔄 Recurring Income
                </label>
                {formRecurring && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'rgba(var(--overlay-rgb),0.6)', fontSize: '0.85rem' }}>Repeats:</span>
                    <select value={formInterval} onChange={e => setFormInterval(e.target.value)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.85rem' }}>
                      {RECURRENCE_INTERVALS.map(r => <option key={r} value={r} style={{ background: 'var(--bg-solid)' }}>{r}</option>)}
                    </select>
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(var(--overlay-rgb),0.8)', fontSize: '0.9rem' }}>
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
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--overlay-rgb),0.3)' }}>🔍</span>
              <input
                type="text" placeholder="Search source or description..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>
            {/* Source filter */}
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.9rem' }}>
              <option value="All" style={{ background: 'var(--bg-solid)' }}>All Sources</option>
              {systemCategories.filter(c => c.type === 'income').map(s => <option key={s.name} value={s.name} style={{ background: 'var(--bg-solid)' }}>{s.icon} {s.name}</option>)}
                    {/* Fallback for historical data */}
                    {!systemCategories.some(c => c.type === 'income' && c.name === formSource) && <option value={formSource} style={{ background: 'var(--bg-solid)' }}>{formSource} (Historical)</option>}
            </select>
            {/* Recurring filter */}
            <select value={filterRecurring} onChange={e => setFilterRecurring(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.9rem' }}>
              <option value="All"       style={{ background: 'var(--bg-solid)' }}>All Types</option>
              <option value="Recurring" style={{ background: 'var(--bg-solid)' }}>🔄 Recurring</option>
              <option value="One-time"  style={{ background: 'var(--bg-solid)' }}>📌 One-time</option>
            </select>
            {/* Export */}
            <button onClick={handleExport} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0 }}>
              ⬇️ Export CSV
            </button>
          </div>

          {/* Results count */}
          <div style={{ fontSize: '0.8rem', color: 'rgba(var(--overlay-rgb),0.4)', marginBottom: 12 }}>
            Showing {filteredIncomes.length} of {incomes.length} records
          </div>

          {incomeLoading && <p style={{ color: 'rgba(var(--overlay-rgb),0.4)', textAlign: 'center' }}>Loading...</p>}

          {filteredIncomes.length === 0 && !incomeLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(var(--overlay-rgb),0.3)' }}>
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
                          : <span style={{ color: 'rgba(var(--overlay-rgb),0.3)', fontSize: '0.78rem' }}>One-time</span>
                        }
                      </td>
                      <td style={{ textAlign: 'center' }}>{inc.remindMe ? '🔔' : '—'}</td>
                      <td style={{ color: 'rgba(var(--overlay-rgb),0.5)', fontSize: '0.85rem' }}>{inc.description || '—'}</td>
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
                    <span style={{ color: 'rgba(var(--overlay-rgb),0.4)', marginLeft: 8, fontSize: '0.8rem' }}>Repeats {i.recurrenceInterval}</span>
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
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>ETB {expCategoryBreakdown[cat].toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(var(--overlay-rgb),0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(expCategoryBreakdown[cat] / maxBar) * 100}%`, background: EXPENSE_COLORS[cat] || '#94a3b8', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
              {EXPENSE_CATEGORIES.every(c => expCategoryBreakdown[c] === 0) && (
                <p style={{ color: 'rgba(var(--overlay-rgb),0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>Add expenses to see the chart</p>
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
                    <span style={{ fontSize: '0.65rem', color: 'rgba(var(--overlay-rgb),0.4)', marginTop: 5 }}>{label}</span>
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
                  <select value={expCategory} onChange={e => setExpCategory(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.95rem' }}>
                    {systemCategories.filter(c => c.type === 'expense').map(c => <option key={c.name} value={c.name} style={{ background: 'var(--bg-solid)' }}>{c.icon} {c.name}</option>)}
                    {/* Fallback for historical data */}
                    {!systemCategories.some(c => c.type === 'expense' && c.name === expCategory) && <option value={expCategory} style={{ background: 'var(--bg-solid)' }}>{expCategory} (Historical)</option>}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Date *</label>
                  <input type="date" value={expDate} min={new Date().toISOString().slice(0, 10)} max={new Date().toISOString().slice(0, 10)} onChange={e => setExpDate(e.target.value)} required style={{ colorScheme: 'dark' }} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <input type="text" placeholder="Coffee, Rent, etc..." value={expDesc} onChange={e => setExpDesc(e.target.value)} />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: 16 }}>
                <label>Receipt Note (Optional)</label>
                <textarea placeholder="Paste receipt ID or extra notes here..." value={expReceiptNote} onChange={e => setExpReceiptNote(e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(var(--overlay-rgb),0.8)', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={expRecurring} onChange={e => setExpRecurring(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#ef4444' }} />
                  🔄 Recurring Expense
                </label>
                {expRecurring && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'rgba(var(--overlay-rgb),0.6)', fontSize: '0.85rem' }}>Repeats:</span>
                    <select value={expInterval} onChange={e => setExpInterval(e.target.value)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.85rem' }}>
                      {RECURRENCE_INTERVALS.map(r => <option key={r} value={r} style={{ background: 'var(--bg-solid)' }}>{r}</option>)}
                    </select>
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(var(--overlay-rgb),0.8)', fontSize: '0.9rem' }}>
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
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--overlay-rgb),0.3)' }}>🔍</span>
              <input type="text" placeholder="Search category, desc or receipt..." value={expSearchQuery} onChange={e => setExpSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.9rem' }} />
            </div>
            {/* Category filter */}
            <select value={expFilterCat} onChange={e => setExpFilterCat(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.9rem' }}>
              <option value="All" style={{ background: 'var(--bg-solid)' }}>All Categories</option>
              {systemCategories.filter(c => c.type === 'expense').map(c => <option key={c.name} value={c.name} style={{ background: 'var(--bg-solid)' }}>{c.icon} {c.name}</option>)}
                    {/* Fallback for historical data */}
                    {!systemCategories.some(c => c.type === 'expense' && c.name === expCategory) && <option value={expCategory} style={{ background: 'var(--bg-solid)' }}>{expCategory} (Historical)</option>}
            </select>
            {/* Recurring filter */}
            <select value={expFilterRec} onChange={e => setExpFilterRec(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(var(--overlay-rgb),0.07)', border: '1px solid rgba(var(--overlay-rgb),0.15)', color: "var(--text-primary)", fontFamily: 'inherit', fontSize: '0.9rem' }}>
              <option value="All"       style={{ background: 'var(--bg-solid)' }}>All Types</option>
              <option value="Recurring" style={{ background: 'var(--bg-solid)' }}>🔄 Recurring</option>
              <option value="One-time"  style={{ background: 'var(--bg-solid)' }}>📌 One-time</option>
            </select>
            {/* Export */}
            <button onClick={handleExportExpenses} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0 }}>⬇️ Export</button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'rgba(var(--overlay-rgb),0.4)', marginBottom: 12 }}>
            Showing {filteredExpenses.length} of {expenses.length} records
          </div>

          {expLoading && <p style={{ color: 'rgba(var(--overlay-rgb),0.4)', textAlign: 'center' }}>Loading...</p>}

          {filteredExpenses.length === 0 && !expLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(var(--overlay-rgb),0.3)' }}>
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
                          ? <span style={{ color: exp.isPaused ? 'rgba(var(--overlay-rgb),0.3)' : '#f97316', fontSize: '0.78rem', fontWeight: 600 }}>{exp.isPaused ? '⏸️ Paused' : `🔄 ${exp.recurrenceInterval}`}</span>
                          : <span style={{ color: 'rgba(var(--overlay-rgb),0.3)', fontSize: '0.78rem' }}>One-time</span>
                        }
                      </td>
                      <td>
                        {exp.receiptNote ? (
                          <button onClick={() => setShowReceiptId(showReceiptId === exp.id ? null : exp.id)} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '0.85rem' }}>📎 View</button>
                        ) : <span style={{ color: 'rgba(var(--overlay-rgb),0.2)' }}>—</span>}
                      </td>
                      <td style={{ color: 'rgba(var(--overlay-rgb),0.5)', fontSize: '0.85rem' }}>{exp.description || '—'}</td>
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
              <button onClick={() => setShowReceiptId(null)} style={{ background: 'none', border: 'none', color: "var(--text-primary)", cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: 'rgba(var(--overlay-rgb),0.8)', fontSize: '0.9rem', marginTop: 12, whiteSpace: 'pre-wrap' }}>
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
                    <span style={{ color: 'rgba(var(--overlay-rgb),0.4)', marginLeft: 8, fontSize: '0.8rem' }}>{e.recurrenceInterval} {e.remindMe ? '· 🔔' : ''}</span>
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem', marginTop: 4 }}>ETB {parseFloat(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!e.isPaid && e.remindMe && (
                      <button onClick={() => handleConfirmPayment(e.id)} style={{ background: '#10b981', color: "var(--text-primary)", border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>✓ Mark Paid</button>
                    )}
                    {e.isPaid && e.remindMe && (
                      <span style={{ color: '#10b981', fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: 6, fontWeight: 600 }}>✅ Paid</span>
                    )}
                    <button onClick={() => handleTogglePause(e.id)} style={{ background: 'rgba(var(--overlay-rgb),0.1)', color: "var(--text-primary)", border: '1px solid rgba(var(--overlay-rgb),0.2)', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
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
            <p style={{ color: 'rgba(var(--overlay-rgb),0.3)', textAlign: 'center', padding: '24px 0' }}>No transactions recorded yet.</p>
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
                      <td style={{ color: 'rgba(var(--overlay-rgb),0.4)', fontSize: '0.85rem' }}>{tx.description || '—'}</td>
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
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>ETB {categoryBreakdown[src].toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ height: 10, background: 'rgba(var(--overlay-rgb),0.05)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(categoryBreakdown[src] / maxCatInc) * 100}%`, background: SOURCE_COLORS[src], borderRadius: 6 }} />
                </div>
              </div>
            ))}
            {INCOME_SOURCES.every(s => categoryBreakdown[s] === 0) && <p style={{ color: 'rgba(var(--overlay-rgb),0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>No income data yet</p>}
          </div>

          <div className="bw-card">
            <h3 className="bw-card-title">📊 Expenses Breakdown</h3>
            {EXPENSE_CATEGORIES.filter(s => expCategoryBreakdown[s] > 0).map(cat => (
              <div key={cat} style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                  <span style={{ color: EXPENSE_COLORS[cat], fontWeight: 600 }}>{cat}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>ETB {expCategoryBreakdown[cat].toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ height: 10, background: 'rgba(var(--overlay-rgb),0.05)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(expCategoryBreakdown[cat] / maxCatExp) * 100}%`, background: EXPENSE_COLORS[cat], borderRadius: 6 }} />
                </div>
              </div>
            ))}
            {EXPENSE_CATEGORIES.every(s => expCategoryBreakdown[s] === 0) && <p style={{ color: 'rgba(var(--overlay-rgb),0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>No expense data yet</p>}
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
                  <span style={{ fontSize: '0.65rem', color: 'rgba(var(--overlay-rgb),0.4)', marginTop: 4 }}>{label}</span>
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
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(var(--overlay-rgb),0.4)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 8 }}>🤖</p>
                <p>Add income and expense records to unlock AI-powered financial insights!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Savings Rate Insight */}
              <div className="bw-card" style={{ border: `1px solid ${saveRate >= 20 ? 'rgba(16,185,129,0.3)' : saveRate > 0 ? 'rgba(249,115,22,0.3)' : 'rgba(239,68,68,0.3)'}`, background: `${saveRate >= 20 ? 'rgba(16,185,129,0.05)' : saveRate > 0 ? 'rgba(249,115,22,0.05)' : 'rgba(239,68,68,0.05)'}` }}>
                <h3 className="bw-card-title">{saveRate >= 20 ? '🏆 Excellent Savings Rate' : saveRate > 0 ? '⚠️ Moderate Savings Rate' : '🚨 Negative Cash Flow Warning'}</h3>
                <p style={{ color: 'rgba(var(--overlay-rgb),0.7)', lineHeight: 1.8, fontSize: '0.9rem', marginTop: 8 }}>
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
                  <p style={{ color: 'rgba(var(--overlay-rgb),0.7)', lineHeight: 1.8, fontSize: '0.9rem', marginTop: 8 }}>
                    A significant portion of your budget is going towards <strong style={{ color: EXPENSE_COLORS[topExpense[0]] || '#ef4444' }}>{topExpense[0]}</strong>, which accounts for <strong style={{ color: '#ef4444' }}>ETB {topExpense[1].toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> of your total expenses. Consider setting a strict budget limit for this category next month.
                  </p>
                </div>
              )}

              {/* Income Diversification */}
              <div className="bw-card" style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
                <h3 className="bw-card-title">📊 Diversification Score</h3>
                <p style={{ color: 'rgba(var(--overlay-rgb),0.7)', lineHeight: 1.8, fontSize: '0.9rem', marginTop: 8 }}>
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

  // ── Settings State ─────────────────────────────────────────
  const [settingsTab,     setSettingsTab]     = useState('profile');
  const [profUsername,    setProfUsername]    = useState('');
  const [profEmail,       setProfEmail]       = useState('');
  const [profPhone,       setProfPhone]       = useState('');
  const [profLoading,     setProfLoading]     = useState(false);
  const [profSuccess,     setProfSuccess]     = useState('');
  const [profError,       setProfError]       = useState('');

  const [pwdCurrent,      setPwdCurrent]      = useState('');
  const [pwdNew,          setPwdNew]          = useState('');
  const [pwdConfirm,      setPwdConfirm]      = useState('');
  const [pwdLoading,      setPwdLoading]      = useState(false);
  const [pwdSuccess,      setPwdSuccess]      = useState('');
  const [pwdError,        setPwdError]        = useState('');
  const [showPwdCurrent,  setShowPwdCurrent]  = useState(false);
  const [showPwdNew,      setShowPwdNew]      = useState(false);
  const [showPwdConfirm,  setShowPwdConfirm]  = useState(false);

  // Sync profile fields from user when entering settings
  const initSettingsForm = (u) => {
    setProfUsername(u?.username || '');
    setProfEmail(u?.email || '');
    setProfPhone(u?.phone || '');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfError(''); setProfSuccess('');
    const token = localStorage.getItem('token');
    setProfLoading(true);
    try {
      const res = await axios.put('/api/auth/profile',
        { username: profUsername, email: profEmail, phone: profPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data.user);
      setProfSuccess('Profile updated successfully!');
    } catch (err) {
      setProfError(err.response?.data?.message || 'Failed to update profile');
    } finally { setProfLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (pwdNew !== pwdConfirm) { setPwdError('New passwords do not match'); return; }
    if (pwdNew.length < 6) { setPwdError('Password must be at least 6 characters'); return; }
    const token = localStorage.getItem('token');
    setPwdLoading(true);
    try {
      await axios.put('/api/auth/change-password',
        { currentPassword: pwdCurrent, newPassword: pwdNew },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwdSuccess('Password changed successfully!');
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    } finally { setPwdLoading(false); }
  };

  const renderSettings = () => {
    const SETTINGS_TABS = [
      { id: 'profile',  icon: '👤', label: 'Profile' },
      { id: 'security', icon: '🔐', label: 'Security' },
      { id: 'kyc',      icon: '🎓', label: 'KYC Verification' },
      { id: 'account',  icon: '⚠️', label: 'Account' },
    ];

    const kycBadge = {
      pending:   { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      submitted: { label: 'Submitted', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
      verified:  { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      rejected:  { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    }[user?.kycStatus] || { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };

    return (
      <>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Settings</h1>
          <p style={{ color: 'rgba(var(--overlay-rgb),0.5)', margin: '4px 0 0', fontSize: '0.92rem' }}>Manage your account preferences and security.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Sidebar Tabs */}
          <div className="bw-card" style={{ padding: 12 }}>
            {SETTINGS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSettingsTab(tab.id); if (tab.id === 'profile') initSettingsForm(user); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '11px 14px',
                  borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2,
                  fontSize: '0.9rem', fontWeight: settingsTab === tab.id ? 600 : 500,
                  background: settingsTab === tab.id
                    ? 'linear-gradient(135deg, rgba(124,92,252,0.25), rgba(168,85,247,0.15))'
                    : 'transparent',
                  color: settingsTab === tab.id ? '#c4b5fd' : 'rgba(var(--overlay-rgb),0.55)',
                  borderLeft: settingsTab === tab.id ? '2px solid #7c5cfc' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}

            {/* Mini profile card */}
            <div style={{ marginTop: 16, padding: '14px', background: 'rgba(var(--overlay-rgb),0.04)', borderRadius: 10, borderTop: '1px solid rgba(var(--overlay-rgb),0.06)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7c5cfc,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', margin: '0 auto 10px', boxShadow: '0 0 20px rgba(124,92,252,0.4)' }}>
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ textAlign: 'center', fontWeight: 700, color: "var(--text-primary)", fontSize: '0.9rem' }}>{user?.username}</div>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(var(--overlay-rgb),0.4)', marginTop: 2 }}>{user?.email}</div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: kycBadge.bg, color: kycBadge.color }}>
                  KYC {kycBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {/* ── PROFILE TAB ─────────────────────────────────── */}
            {settingsTab === 'profile' && (
              <div className="bw-card">
                <h3 className="bw-card-title">Profile Information</h3>
                <p className="bw-card-sub">Update your name, email address, and phone number.</p>
                {profSuccess && <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '0.86rem', marginBottom: 16 }}>✅ {profSuccess}</div>}
                {profError   && <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.86rem', marginBottom: 16 }}>⚠ {profError}</div>}
                <form onSubmit={handleProfileUpdate}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(var(--overlay-rgb),0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
                      <input
                        value={profUsername} onChange={e => setProfUsername(e.target.value)}
                        placeholder="Your username"
                        style={{ padding: '10px 14px', background: 'rgba(var(--overlay-rgb),0.06)', border: '1px solid rgba(var(--overlay-rgb),0.12)', borderRadius: 9, color: "var(--text-primary)", fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(var(--overlay-rgb),0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                      <input
                        type="email" value={profEmail} onChange={e => setProfEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{ padding: '10px 14px', background: 'rgba(var(--overlay-rgb),0.06)', border: '1px solid rgba(var(--overlay-rgb),0.12)', borderRadius: 9, color: "var(--text-primary)", fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(var(--overlay-rgb),0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</label>
                      <input
                        value={profPhone} onChange={e => setProfPhone(e.target.value)}
                        placeholder="+251 900 000 000"
                        style={{ padding: '10px 14px', background: 'rgba(var(--overlay-rgb),0.06)', border: '1px solid rgba(var(--overlay-rgb),0.12)', borderRadius: 9, color: "var(--text-primary)", fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
                      />
                    </div>
                  </div>
                  {/* Account Info (read-only) */}
                  <div style={{ background: 'rgba(var(--overlay-rgb),0.03)', border: '1px solid rgba(var(--overlay-rgb),0.07)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><div style={{ fontSize: '0.72rem', color: 'rgba(var(--overlay-rgb),0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Role</div><div style={{ fontSize: '0.88rem', color: '#a78bfa', fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'rgba(var(--overlay-rgb),0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Account Status</div><div style={{ fontSize: '0.88rem', color: '#10b981', fontWeight: 600 }}>Active</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'rgba(var(--overlay-rgb),0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Verified</div><div style={{ fontSize: '0.88rem', color: user?.isVerified ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{user?.isVerified ? 'Yes' : 'Pending'}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'rgba(var(--overlay-rgb),0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>KYC</div><div style={{ fontSize: '0.88rem', fontWeight: 600, color: kycBadge.color, textTransform: 'capitalize' }}>{user?.kycStatus}</div></div>
                  </div>
                  <button type="submit" disabled={profLoading}
                    style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c5cfc,#a855f7)', color: "var(--text-primary)", fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: profLoading ? 0.6 : 1 }}>
                    {profLoading ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* ── SECURITY TAB ─────────────────────────────────── */}
            {settingsTab === 'security' && (
              <div className="bw-card">
                <h3 className="bw-card-title">Change Password</h3>
                <p className="bw-card-sub">Keep your account secure with a strong password.</p>
                {pwdSuccess && <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '0.86rem', marginBottom: 16 }}>✅ {pwdSuccess}</div>}
                {pwdError   && <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.86rem', marginBottom: 16 }}>⚠ {pwdError}</div>}
                <form onSubmit={handleChangePassword}>
                  {[
                    { label: 'Current Password', value: pwdCurrent, set: setPwdCurrent, show: showPwdCurrent, toggle: setShowPwdCurrent, id: 'pwd-current' },
                    { label: 'New Password',     value: pwdNew,     set: setPwdNew,     show: showPwdNew,     toggle: setShowPwdNew,     id: 'pwd-new' },
                    { label: 'Confirm New Password', value: pwdConfirm, set: setPwdConfirm, show: showPwdConfirm, toggle: setShowPwdConfirm, id: 'pwd-confirm' },
                  ].map(f => (
                    <div key={f.id} style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(var(--overlay-rgb),0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id={f.id} type={f.show ? 'text' : 'password'} value={f.value}
                          onChange={e => f.set(e.target.value)}
                          placeholder="••••••••"
                          style={{ width: '100%', padding: '10px 44px 10px 14px', background: 'rgba(var(--overlay-rgb),0.06)', border: '1px solid rgba(var(--overlay-rgb),0.12)', borderRadius: 9, color: "var(--text-primary)", fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
                        />
                        <button type="button" onClick={() => f.toggle(v => !v)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(var(--overlay-rgb),0.4)', cursor: 'pointer', fontSize: '1rem' }}>
                          {f.show ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Password strength hint */}
                  {pwdNew.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(var(--overlay-rgb),0.4)', marginBottom: 4 }}>Password strength</div>
                      <div style={{ height: 4, borderRadius: 4, background: 'rgba(var(--overlay-rgb),0.08)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.3s, background 0.3s',
                          width: pwdNew.length < 6 ? '25%' : pwdNew.length < 10 ? '55%' : '100%',
                          background: pwdNew.length < 6 ? '#ef4444' : pwdNew.length < 10 ? '#f59e0b' : '#10b981',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', marginTop: 3, color: pwdNew.length < 6 ? '#fca5a5' : pwdNew.length < 10 ? '#fcd34d' : '#6ee7b7' }}>
                        {pwdNew.length < 6 ? 'Too weak' : pwdNew.length < 10 ? 'Moderate' : 'Strong'}
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={pwdLoading}
                    style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c5cfc,#a855f7)', color: "var(--text-primary)", fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: pwdLoading ? 0.6 : 1 }}>
                    {pwdLoading ? 'Changing…' : 'Change Password'}
                  </button>
                </form>

                {/* Security tips */}
                <div style={{ marginTop: 24, padding: '16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#a5b4fc', marginBottom: 10 }}>🔒 Security Tips</div>
                  {['Use at least 8 characters with a mix of letters, numbers, and symbols.', 'Never reuse passwords from other websites.', 'Change your password regularly for best security.'].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }}>•</span>
                      <span style={{ fontSize: '0.82rem', color: 'rgba(var(--overlay-rgb),0.55)' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── KYC TAB ──────────────────────────────────────── */}
            {settingsTab === 'kyc' && (
              <div className="bw-card">
                <h3 className="bw-card-title">KYC Verification</h3>
                <p className="bw-card-sub">Submit your student details to complete identity verification.</p>

                {/* Status banner */}
                <div style={{ padding: '14px 18px', borderRadius: 12, background: kycBadge.bg, border: `1px solid ${kycBadge.color}33`, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(var(--overlay-rgb),0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: kycBadge.color, marginTop: 2, textTransform: 'capitalize' }}>{user?.kycStatus}</div>
                  </div>
                  <div style={{ fontSize: '2rem' }}>{user?.kycStatus === 'verified' ? '✅' : user?.kycStatus === 'submitted' ? '⏳' : '📋'}</div>
                </div>

                {kycSuccess && <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '0.86rem', marginBottom: 16 }}>✅ {kycSuccess}</div>}
                {kycError   && <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.86rem', marginBottom: 16 }}>⚠ {kycError}</div>}

                <form onSubmit={handleKycSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(var(--overlay-rgb),0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student ID *</label>
                      <input id="student-id-input" type="text" placeholder="STU-987654"
                        value={studentId} onChange={e => setStudentId(e.target.value)} required
                        style={{ padding: '10px 14px', background: 'rgba(var(--overlay-rgb),0.06)', border: '1px solid rgba(var(--overlay-rgb),0.12)', borderRadius: 9, color: "var(--text-primary)", fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(var(--overlay-rgb),0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institution *</label>
                      <input id="institution-input" type="text" placeholder="Addis Ababa University"
                        value={institution} onChange={e => setInstitution(e.target.value)} required
                        style={{ padding: '10px 14px', background: 'rgba(var(--overlay-rgb),0.06)', border: '1px solid rgba(var(--overlay-rgb),0.12)', borderRadius: 9, color: "var(--text-primary)", fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                  </div>

                  {user?.kycStatus === 'submitted' && (
                    <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 16, fontSize: '0.85rem', color: 'rgba(var(--overlay-rgb),0.6)' }}>
                      📋 <strong style={{ color: '#a5b4fc' }}>Submitted Details —</strong> ID: <u>{user.studentId}</u> · Institution: <u>{user.institution}</u>
                    </div>
                  )}

                  <button type="submit" id="btn-submit-kyc"
                    style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c5cfc,#a855f7)', color: "var(--text-primary)", fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Submit KYC
                  </button>
                </form>
              </div>
            )}

            {/* ── ACCOUNT TAB ──────────────────────────────────── */}
            {settingsTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Profile Photo */}
                <div className="bw-card">
                  <h3 className="bw-card-title">Profile Photo</h3>
                  <p className="bw-card-sub">Update your avatar here.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(var(--overlay-rgb),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                    )}
                    <label style={{ cursor: 'pointer', padding: '8px 16px', background: 'rgba(var(--overlay-rgb),0.1)', borderRadius: 8, fontSize: '0.85rem' }}>
                      Upload Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('profilePhoto', file);
                        
                        try {
                          const res = await axios.put('/api/auth/profile', formData, {
                            headers: { 
                              Authorization: `Bearer ${localStorage.getItem('token')}`,
                              'Content-Type': 'multipart/form-data'
                            }
                          });
                          setUser(res.data.user);
                        } catch (err) {
                          console.error('Failed to upload photo', err);
                        }
                      }} />
                    </label>
                  </div>
                </div>

                {/* Account Summary */}
                <div className="bw-card">
                  <h3 className="bw-card-title">Account Summary</h3>
                  <p className="bw-card-sub">Overview of your BirrWise account.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                    {[
                      { label: 'Username', value: user?.username },
                      { label: 'Email', value: user?.email },
                      { label: 'Phone', value: user?.phone || 'Not set' },
                      { label: 'Role', value: user?.role, color: '#a78bfa' },
                      { label: 'Verified', value: user?.isVerified ? 'Yes' : 'No', color: user?.isVerified ? '#10b981' : '#f59e0b' },
                      { label: 'KYC Status', value: user?.kycStatus, color: kycBadge.color },
                    ].map(item => (
                      <div key={item.label} style={{ background: 'rgba(var(--overlay-rgb),0.04)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(var(--overlay-rgb),0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: item.color || 'var(--text-primary)', textTransform: 'capitalize' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button onClick={handleExportData} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #10b981', background: 'rgba(16,185,129,0.1)', color: '#10b981', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                      📥 Export Financial Data (CSV)
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bw-card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
                  <h3 className="bw-card-title" style={{ color: '#fca5a5' }}>⚠ Sign Out</h3>
                  <p className="bw-card-sub">End your current session and return to the login page.</p>
                  <button
                    onClick={handleLogout}
                    style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8 }}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // ── AI Chat Section ──────────────────────────────────────────
  const renderChatSection = () => {
    const handleSendChat = async (e) => {
      e.preventDefault();
      if (!chatInput.trim()) return;

      const userMessage = chatInput.trim();
      setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
      setChatInput('');
      setChatLoading(true);

      try {
        const token = localStorage.getItem('token');
        const res = await axios.post('/api/chat', 
          { message: userMessage, history: chatHistory },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChatHistory(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
      } catch (error) {
        console.error('Chat error:', error);
        setChatHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
      } finally {
        setChatLoading(false);
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '800px', margin: '0 auto', gap: 20 }}>
        <div className="bw-welcome" style={{ marginBottom: 0 }}>
          <h1>🤖 AI Assistant</h1>
          <p>Ask questions about your finances, budgets, and spending habits.</p>
        </div>
        
        <div className="bw-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {chatHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(var(--overlay-rgb),0.4)', marginTop: 40 }}>
                <p style={{ fontSize: '3rem', marginBottom: 10 }}>🤖</p>
                <p>Hi! I'm your BirrWise AI Assistant.</p>
                <p>Try asking: "What are my highest expenses?" or "Am I within my budget this month?"</p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', background: msg.sender === 'user' ? 'linear-gradient(135deg, #7c5cfc, #a855f7)' : 'rgba(var(--overlay-rgb),0.1)', padding: '12px 16px', borderRadius: 16, borderBottomRightRadius: msg.sender === 'user' ? 4 : 16, borderBottomLeftRadius: msg.sender === 'ai' ? 4 : 16, color: "var(--text-primary)", fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {msg.text}
                </div>
              ))
            )}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(var(--overlay-rgb),0.1)', padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4, color: 'rgba(var(--overlay-rgb),0.6)', fontSize: '0.95rem' }}>
                Typing...
              </div>
            )}
          </div>
          
          <div style={{ padding: 16, borderTop: '1px solid rgba(var(--overlay-rgb),0.1)', background: 'rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 12 }}>
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid rgba(var(--overlay-rgb),0.15)', background: 'rgba(var(--overlay-rgb),0.05)', color: "var(--text-primary)", fontSize: '0.95rem', outline: 'none' }}
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                style={{ background: '#10b981', color: "var(--text-primary)", border: 'none', borderRadius: 24, padding: '0 24px', fontWeight: 600, cursor: chatLoading ? 'not-allowed' : 'pointer', opacity: chatLoading ? 0.7 : 1 }}
                disabled={chatLoading}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const sectionContent = () => {
    switch (activeSection) {
      case 'dashboard':    return renderStudentHome();
      case 'income':       return renderIncomeSection();
      case 'expenses':     return renderExpenseSection();
      case 'budgets':      return renderPlaceholder('Budgets', '📊', 'Set monthly budget limits and track progress.');
      case 'savings':      return renderPlaceholder('Savings Goals', '🎯', 'Create savings goals and monitor your progress.');
      case 'analytics':    return renderAnalytics();
      case 'ai-chat':      return renderChatSection();
      case 'ai':           return renderAiInsights();
      case 'transactions': return renderTransactions();
      case 'settings':     return renderSettings();
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

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside className="bw-sidebar">
        <div className="bw-sidebar-brand">
          <span className="bw-brand-icon">💰</span>
          <span className="bw-brand-text">BirrWise</span>
        </div>
        <nav className="bw-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`bw-nav-item${activeSection === item.id ? ' active' : ''}`} onClick={() => {
              if (['dashboard', 'income', 'expenses', 'analytics', 'ai-chat'].includes(item.id)) {
                setActiveSection(item.id);
              } else if (item.id === 'budgets') {
                navigate('/student/budgets');
              } else if (item.id === 'savings') {
                navigate('/student/savings-goals');
              } else if (item.id === 'transactions') {
                navigate('/student/transactions');
              } else if (item.id === 'reports') {
                navigate('/student/reports');
              }
            }} id={`nav-${item.id}`}>
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
            <button 
              onClick={toggleTheme}
              style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', marginRight: '16px' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.1rem', cursor: 'pointer', position: 'relative', marginRight: '16px' }}
              >
                🔔
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: "var(--text-primary)", fontSize: '0.65rem', padding: '2px 5px', borderRadius: 10, fontWeight: 'bold' }}>
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div style={{ position: 'absolute', top: '100%', right: 0, width: 320, background: "var(--bg-solid)", border: '1px solid rgba(var(--overlay-rgb),0.1)', borderRadius: 12, marginTop: 12, zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(var(--overlay-rgb),0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: "var(--text-primary)" }}>Notifications</strong>
                    <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: '0.75rem', cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'rgba(var(--overlay-rgb),0.5)', fontSize: '0.85rem' }}>No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => !n.isRead && handleMarkAsRead(n.id)} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(var(--overlay-rgb),0.05)', cursor: n.isRead ? 'default' : 'pointer', background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.1)' }}>
                          <div style={{ fontSize: '0.85rem', color: n.isRead ? 'rgba(var(--overlay-rgb),0.7)' : '#fff' }}>{n.message}</div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(var(--overlay-rgb),0.4)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
        <main className="bw-content">{sectionContent()}</main>
      </div>
    </div>
  );
}
