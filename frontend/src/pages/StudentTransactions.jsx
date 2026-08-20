// src/pages/StudentTransactions.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
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

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function Skeleton({ w = '100%', h = 18, r = 8, mb = 0 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'rgba(var(--overlay-rgb),0.06)', marginBottom: mb, animation: 'bw-skeleton 1.4s ease-in-out infinite' }} />;
}

export default function StudentTransactions() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering
  const [searchQ, setSearchQ] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Income, Expense
  const [filterDate, setFilterDate] = useState('All Time'); // All Time, This Month, Last Month

  const token = () => localStorage.getItem('token');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/transactions', { headers: authHeader() });
      setTransactions(res.data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (user) fetchTransactions(); }, [user, fetchTransactions]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNav = (id) => {
    if (id === 'transactions') return; // already here
    if (id === 'dashboard') navigate('/student/dashboard', { state: { activeSection: 'dashboard' } });
    else if (id === 'income') navigate('/student/dashboard', { state: { activeSection: 'income' } });
    else if (id === 'expenses') navigate('/student/dashboard', { state: { activeSection: 'expenses' } });
    else if (id === 'analytics') navigate('/student/dashboard', { state: { activeSection: 'analytics' } });
    else if (id === 'ai-chat') navigate('/student/dashboard', { state: { activeSection: 'ai-chat' } });
    else if (id === 'budgets') navigate('/student/budgets');
    else if (id === 'savings') navigate('/student/savings-goals');
    else if (id === 'reports') navigate('/student/reports');
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter(t => {
      // Search
      if (searchQ) {
        const q = searchQ.toLowerCase();
        if (!t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Type Filter
      if (filterType === 'Income' && t.type !== 'income') return false;
      if (filterType === 'Expense' && t.type !== 'expense') return false;

      // Date Filter
      if (filterDate === 'This Month') {
        const d = new Date(t.date);
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;
      }
      if (filterDate === 'Last Month') {
        const d = new Date(t.date);
        let targetMonth = currentMonth - 1;
        let targetYear = currentYear;
        if (targetMonth < 0) {
          targetMonth = 11;
          targetYear -= 1;
        }
        if (d.getMonth() !== targetMonth || d.getFullYear() !== targetYear) return false;
      }

      return true;
    });
  }, [transactions, searchQ, filterType, filterDate]);

  // Summaries
  const totalInflow = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
              className={`bw-nav-item${item.id === 'transactions' ? ' active' : ''}`}
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
          <div className="bw-topbar-title">🧾 Transactions</div>
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
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:28 }}>
            <div>
              <h1 style={{ fontSize:'1.6rem', fontWeight:800, color: 'var(--text-primary)', margin:0 }}>Transaction History</h1>
              <p style={{ color:'rgba(var(--overlay-rgb),0.5)', margin:'4px 0 0', fontSize:'0.92rem' }}>All your incomes and expenses in one place.</p>
            </div>
          </div>

          {error && (
            <div className="bw-alert" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: 15, borderRadius: 8, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 25 }}>
            <div className="bw-card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(var(--overlay-rgb),0.5)', marginBottom: 5 }}>Total Inflow</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>+ {fmt(totalInflow)} ETB</div>
            </div>
            <div className="bw-card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(var(--overlay-rgb),0.5)', marginBottom: 5 }}>Total Outflow</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>- {fmt(totalOutflow)} ETB</div>
            </div>
            <div className="bw-card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(var(--overlay-rgb),0.5)', marginBottom: 5 }}>Net Cash Flow</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: netCashFlow >= 0 ? '#10b981' : '#ef4444' }}>
                {netCashFlow > 0 ? '+' : ''}{fmt(netCashFlow)} ETB
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="bw-card" style={{ marginBottom: 20, padding: '15px 20px', display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{ width: '100%', padding: '10px 15px', borderRadius: 8, background: 'rgba(var(--overlay-rgb),0.05)', border: '1px solid rgba(var(--overlay-rgb),0.1)', color: "var(--text-primary)" }}
              />
            </div>
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              style={{ padding: '10px 15px', borderRadius: 8, background: 'rgba(var(--overlay-rgb),0.05)', border: '1px solid rgba(var(--overlay-rgb),0.1)', color: "var(--text-primary)", cursor: 'pointer' }}
            >
              <option value="All">All Types</option>
              <option value="Income">Income Only</option>
              <option value="Expense">Expense Only</option>
            </select>
            <select 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)}
              style={{ padding: '10px 15px', borderRadius: 8, background: 'rgba(var(--overlay-rgb),0.05)', border: '1px solid rgba(var(--overlay-rgb),0.1)', color: "var(--text-primary)", cursor: 'pointer' }}
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
            </select>
          </div>

          {/* LIST */}
          <div className="bw-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 20 }}>
                <Skeleton h={40} mb={10} />
                <Skeleton h={40} mb={10} />
                <Skeleton h={40} />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(var(--overlay-rgb),0.4)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 10 }}>🧾</div>
                No transactions found for the current filters.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(var(--overlay-rgb),0.1)', color: 'rgba(var(--overlay-rgb),0.5)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px 20px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '15px 20px', fontWeight: 600 }}>Details</th>
                    <th style={{ padding: '15px 20px', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '15px 20px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(var(--overlay-rgb),0.05)', transition: 'background 0.2s', ':hover': { background: 'rgba(var(--overlay-rgb),0.02)' } }}>
                      <td style={{ padding: '15px 20px', color: 'rgba(var(--overlay-rgb),0.7)', fontSize: '0.9rem' }}>
                        {formatDate(t.date)}
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.description}</div>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: 20, 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          background: t.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: t.type === 'income' ? '#10b981' : '#f59e0b'
                        }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 700, color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                        {t.type === 'income' ? '+' : '-'} {fmt(t.amount)} ETB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
