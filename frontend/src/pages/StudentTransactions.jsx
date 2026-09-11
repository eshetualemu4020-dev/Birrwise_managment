// src/pages/StudentTransactions.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

import StudentLayout from '../components/StudentLayout';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function Skeleton({ w = '100%', h = 18, r = 8, mb = 0 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'rgba(var(--overlay-rgb),0.06)', marginBottom: mb, animation: 'bw-skeleton 1.4s ease-in-out infinite' }} />;
}

export default function StudentTransactions() {
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
    <StudentLayout activeSection="transactions" user={user}>

        <main className="bw-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
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
    </StudentLayout>
  );
}
