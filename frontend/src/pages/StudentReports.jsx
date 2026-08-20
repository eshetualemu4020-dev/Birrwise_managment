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
  { id: 'analytics',    icon: '📈', label: 'Analytics' },
  { id: 'transactions', icon: '🧾', label: 'Transactions' },
  { id: 'reports',      icon: '📑', label: 'Reports' },
  { id: 'ai-chat',      icon: '🤖', label: 'AI Assistant' },
];

export default function StudentReports() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem('user'));

  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const [incRes, expRes] = await Promise.all([
        axios.get('/api/income', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/expenses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setIncomes(incRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportIncomes = () => {
    const header = 'Date,Source,Amount (ETB),Recurring,Interval,Description\n';
    const rows = incomes.map(i =>
      `${i.date},${i.source},${parseFloat(i.amount).toFixed(2)},${i.isRecurring ? 'Yes' : 'No'},${i.recurrenceInterval || ''},${(i.description || '').replace(/,/g, ' ')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'income_records.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExpenses = () => {
    const header = 'Date,Category,Amount (ETB),Recurring,Interval,Paid,Description\n';
    const rows = expenses.map(e =>
      `${e.date},${e.Category?.name || 'Unknown'},${parseFloat(e.amount).toFixed(2)},${e.isRecurring ? 'Yes' : 'No'},${e.recurrenceInterval || ''},${e.isPaid ? 'Yes' : 'No'},${(e.description || '').replace(/,/g, ' ')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'expense_records.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    let csv = "Type,Date,Amount,Source/Category,Description,Recurring\n";
    incomes.forEach(inc => {
      csv += `"Income","${inc.date}","${inc.amount}","${inc.source}","${(inc.description || '').replace(/"/g, '""')}","${inc.isRecurring ? inc.recurrenceInterval : 'No'}"\n`;
    });
    expenses.forEach(exp => {
      csv += `"Expense","${exp.date}","${exp.amount}","${exp.Category?.name || 'Unknown'}","${(exp.description || '').replace(/"/g, '""')}","${exp.isRecurring ? exp.recurrenceInterval : 'No'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `BirrWise_Complete_Data_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="bw-layout">
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="bw-sidebar">
        <div className="bw-sidebar-brand">
          <span className="bw-brand-icon">🎓</span>
          <span className="bw-brand-text">BirrWise</span>
        </div>
        <nav className="bw-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`bw-nav-item${item.id === 'reports' ? ' active' : ''}`} onClick={() => {
              if (item.id === 'budgets') navigate('/student/budgets');
              else if (item.id === 'savings') navigate('/student/savings-goals');
              else if (item.id === 'transactions') navigate('/student/transactions');
              else if (item.id === 'reports') navigate('/student/reports');
              else navigate('/student/dashboard', { state: { activeSection: item.id } });
            }}>
              <span className="bw-nav-icon">{item.icon}</span>
              <span className="bw-nav-label">{item.label}</span>
            </button>
          ))}
          <button className="bw-nav-item bw-settings-item" onClick={() => navigate('/student/dashboard', { state: { activeSection: 'settings' } })} style={{ marginTop: 'auto' }} id="nav-settings">
            <span className="bw-nav-icon">⚙️</span>
            <span className="bw-nav-label">Settings</span>
          </button>
        </nav>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <main className="bw-main">
        {/* Header */}
        <header className="bw-topbar">
          <div className="bw-topbar-left">
            <h1 className="bw-page-title">📑 Reports & Exports</h1>
            <p className="bw-page-subtitle" style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Download your financial data for offline use and analysis.</p>
          </div>
          <div className="bw-topbar-right">
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', marginRight: '16px' }} title="Toggle Theme">
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

        {/* Content Area */}
        <div className="bw-content-area" style={{ padding: '24px' }}>
          {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: 20 }}>{error}</div>}
          
          <div className="bw-card" style={{ marginBottom: 24, padding: 24 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Download CSV Data</h2>
            <p style={{ color: 'rgba(var(--overlay-rgb), 0.7)', fontSize: '0.9rem', marginBottom: 24 }}>
              Export your records in standard CSV format. These files can be opened in Excel, Google Sheets, or any data analysis tool.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <button 
                onClick={handleExportIncomes} 
                disabled={loading}
                className="btn-primary" 
                style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, cursor: 'pointer' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💰</div>
                <div style={{ fontWeight: 'bold' }}>Export Income</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>Download all income records</div>
              </button>
              
              <button 
                onClick={handleExportExpenses} 
                disabled={loading}
                className="btn-primary" 
                style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, cursor: 'pointer' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💸</div>
                <div style={{ fontWeight: 'bold' }}>Export Expenses</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>Download all expense records</div>
              </button>

              <button 
                onClick={handleExportData} 
                disabled={loading}
                className="btn-primary" 
                style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, cursor: 'pointer' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📊</div>
                <div style={{ fontWeight: 'bold' }}>Complete Export</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>Download everything in one file</div>
              </button>
            </div>
            
            {loading && <p style={{ marginTop: 24, color: 'rgba(var(--overlay-rgb), 0.5)' }}>Loading your data...</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
