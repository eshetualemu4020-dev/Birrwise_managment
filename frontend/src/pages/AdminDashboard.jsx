// src/pages/AdminDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ADMIN_NAV_ITEMS = [
  { id: 'dashboard',      icon: '👑', label: 'Dashboard' },
  { id: 'users',          icon: '👥', label: 'Users' },
  { id: 'financial',      icon: '💵', label: 'Financial Overview' },
  { id: 'reports',        icon: '📝', label: 'Reports' },
  { id: 'categories',     icon: '🏷️', label: 'Categories' },
  { id: 'ai-monitoring',  icon: '🔍', label: 'AI Monitoring' },
  { id: 'alerts',         icon: '⚠️', label: 'Alerts' },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser]       = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);

  // User list and stats
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminMsg,   setAdminMsg]   = useState('');

  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res.data.user;

      // Route protection check
      if (userData.role !== 'admin') {
        if (userData.role === 'advisor') {
          navigate('/advisor/dashboard', { replace: true });
        } else {
          navigate('/student/dashboard', { replace: true });
        }
        return;
      }

      setUser(userData);
      setIsFrozen(userData.isFrozen);
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

  const fetchAdminUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('/api/auth/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminUsers(res.data.users);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProfile();
    const t = setInterval(fetchProfile, 4000);
    return () => clearInterval(t);
  }, [fetchProfile]);

  useEffect(() => {
    fetchAdminUsers();
    const t = setInterval(fetchAdminUsers, 4000);
    return () => clearInterval(t);
  }, [fetchAdminUsers]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleToggleFreeze = async (uid, frozen) => {
    const token = localStorage.getItem('token');
    setAdminMsg('');
    try {
      await axios.post('/api/auth/admin/freeze-user',
        { userId: uid, isFrozen: !frozen },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdminMsg(`User #${uid} ${!frozen ? 'frozen ❄️' : 'unfrozen ✅'}`);
      fetchAdminUsers();
    } catch (err) {
      setAdminMsg(err.response?.data?.message || 'Failed to update status');
    }
  };

  /* ── Chart Renderers ───────────────────────────────────────── */
  
  const renderRegistrationChart = () => {
    // Elegant SVG chart showing growth
    return (
      <div className="bw-card">
        <h3 className="bw-card-title">📈 User Registration Growth</h3>
        <p className="bw-card-sub">Daily new user sign-ups over the past week</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', marginTop: '16px', padding: '0 8px' }}>
          {[
            { day: 'Mon', count: 12 },
            { day: 'Tue', count: 19 },
            { day: 'Wed', count: 15 },
            { day: 'Thu', count: 28 },
            { day: 'Fri', count: 22 },
            { day: 'Sat', count: 35 },
            { day: 'Sun', count: 42 },
          ].map((bar) => {
            const heightPct = `${(bar.count / 45) * 100}%`;
            return (
              <div key={bar.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#a78bfa', marginBottom: '4px', fontWeight: 600 }}>{bar.count}</span>
                <div style={{
                  width: '60%',
                  height: '100px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '100%',
                    height: heightPct,
                    background: 'linear-gradient(180deg, #a855f7 0%, #7c5cfc 100%)',
                    borderRadius: '4px',
                    transition: 'height 0.5s ease'
                  }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>{bar.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSpendingChart = () => {
    return (
      <div className="bw-card">
        <h3 className="bw-card-title">📊 System Spending Patterns</h3>
        <p className="bw-card-sub">Aggregated user allowance vs expense distribution</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', marginTop: '16px', padding: '0 8px' }}>
          {[
            { label: 'Allowances', value: 85, color: '#10b981' },
            { label: 'Food', value: 65, color: '#ef4444' },
            { label: 'Rent', value: 45, color: '#f59e0b' },
            { label: 'Books', value: 30, color: '#3b82f6' },
            { label: 'Others', value: 20, color: '#6366f1' },
          ].map((bar) => {
            const heightPct = `${(bar.value / 95) * 100}%`;
            return (
              <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: bar.color, marginBottom: '4px', fontWeight: 600 }}>{bar.value}%</span>
                <div style={{
                  width: '50%',
                  height: '100px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '100%',
                    height: heightPct,
                    backgroundColor: bar.color,
                    borderRadius: '4px',
                    opacity: 0.85
                  }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '6px', whiteSpace: 'nowrap' }}>{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Admin Subsections ─────────────────────────────────────── */

  const renderAdminHome = () => (
    <>
      <div className="bw-welcome">
        <h1>Welcome, Admin 👑</h1>
        <p>Monitor users, manage accounts and system access</p>
      </div>

      {/* Stats Grid */}
      <div className="bw-stats-grid">
        {[
          { icon: '👥', label: 'Total Users',      value: `${adminUsers.length}`,                              color: '#6366f1' },
          { icon: '🎓', label: 'Active Students',  value: `${adminUsers.filter(u => u.role === 'student' || u.role === 'user').length}`, color: '#10b981' },
          { icon: '💰', label: 'Total Income',     value: 'ETB 145,200.00',                                    color: '#8b5cf6' },
          { icon: '💸', label: 'Total Expenses',   value: 'ETB 68,420.00',                                     color: '#f43f5e' },
        ].map((s) => (
          <div className="bw-stat-card" key={s.label}>
            <span className="bw-stat-icon">{s.icon}</span>
            <div>
              <p className="bw-stat-label">{s.label}</p>
              <p className="bw-stat-value" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: 24 }}>
        {renderRegistrationChart()}
        {renderSpendingChart()}
      </div>

      {/* Recent Users & System Alerts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: 24 }}>
        {/* Recent Users Card */}
        <div className="bw-card">
          <h3 className="bw-card-title">👤 Recent Users</h3>
          <p className="bw-card-sub">Recently registered accounts on the platform</p>
          <div className="bw-info-grid" style={{ marginTop: '16px' }}>
            {adminUsers.slice(-4).reverse().map((u) => (
              <div className="bw-info-row" key={u.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>{u.username} ({u.email})</span>
                <strong style={{ color: '#a78bfa' }}>{u.role}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts Card */}
        <div className="bw-card">
          <h3 className="bw-card-title">⚠️ System Alerts</h3>
          <p className="bw-card-sub">Critical system notifications and activities</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {[
              { type: 'warning', msg: 'KYC Verification limit reached for AAU student ID' },
              { type: 'success', msg: 'System backup completed successfully' },
              { type: 'info',    msg: 'Daily analytics report generated' }
            ].map((alert, idx) => (
              <div key={idx} style={{
                padding: '12px',
                borderRadius: '8px',
                background: alert.type === 'warning' ? 'rgba(245, 158, 11, 0.08)' : alert.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                border: `1px solid ${alert.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : alert.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                color: alert.type === 'warning' ? '#f59e0b' : alert.type === 'success' ? '#10b981' : '#6366f1',
                fontSize: '0.85rem'
              }}>
                {alert.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderUsersPanel = () => (
    <div className="bw-card">
      <h3 className="bw-card-title">👑 User Management</h3>
      <p className="bw-card-sub">Freeze or unfreeze user accounts</p>
      {adminMsg && <p id="admin-msg" style={{ color: '#ef4444', fontWeight: 600, margin: '8px 0' }}>{adminMsg}</p>}
      <div className="bw-table-wrap">
        <table className="bw-table">
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>KYC</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map(u => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                <td style={{ textTransform: 'capitalize', color: u.kycStatus === 'submitted' ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
                  {u.kycStatus || 'pending'}
                </td>
                <td>
                  <span id={`user-status-${u.id}`}
                    style={{ color: u.isFrozen ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    {u.isFrozen ? 'FROZEN 🚫' : 'ACTIVE ✅'}
                  </span>
                </td>
                <td>
                  <button
                    id={`btn-freeze-user-${u.id}`}
                    className="bw-freeze-btn"
                    data-frozen={u.isFrozen}
                    onClick={() => handleToggleFreeze(u.id, u.isFrozen)}>
                    {u.isFrozen ? 'Unfreeze' : 'Freeze'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPlaceholder = (title, icon, desc) => (
    <div className="bw-placeholder">
      <span className="bw-placeholder-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  );

  const sectionContent = () => {
    switch (activeSection) {
      case 'dashboard':      return renderAdminHome();
      case 'users':          return renderUsersPanel();
      case 'financial':      return renderPlaceholder('Financial Overview', '💵', 'Administrative financial system logs and summaries.');
      case 'reports':        return renderPlaceholder('Reports', '📝', 'Export system-wide financial and user reports.');
      case 'categories':     return renderPlaceholder('Categories', '🏷️', 'Manage financial transaction categories.');
      case 'ai-monitoring':  return renderPlaceholder('AI Monitoring', '🔍', 'Track performance and usage of AI insights.');
      case 'alerts':         return renderPlaceholder('Alerts', '⚠️', 'Configure system-wide notifications and webhooks.');
      case 'settings':
        return (
          <div className="bw-card">
            <h3 className="bw-card-title">⚙️ Admin Settings</h3>
            <p className="bw-card-sub">Configure system policies and default constraints</p>
            <div className="bw-info-grid" style={{ marginTop: 16 }}>
              <div className="bw-info-row"><span>Admin User</span><strong>{user?.username}</strong></div>
              <div className="bw-info-row"><span>Email</span><strong>{user?.email}</strong></div>
              <div className="bw-info-row"><span>Role Privilege</span><strong style={{ color: '#ef4444' }}>Super Administrator</strong></div>
            </div>
          </div>
        );
      default:               return renderAdminHome();
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
            <p id="block-notice-message">
              Your account has been suspended by an administrator.<br />All actions are blocked immediately.
            </p>
            <div className="bw-frozen-code">Status: <strong>ACCOUNT_SUSPENDED</strong></div>
            <button onClick={handleLogout} className="bw-frozen-btn">Sign Out</button>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="bw-sidebar">
        <div className="bw-sidebar-brand">
          <span className="bw-brand-icon">👑</span>
          <span className="bw-brand-text">BirrWise Admin</span>
        </div>

        <nav className="bw-nav">
          {ADMIN_NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`bw-nav-item${activeSection === item.id ? ' active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              id={`nav-${item.id}`}
            >
              <span className="bw-nav-icon">{item.icon}</span>
              <span className="bw-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          className="bw-nav-item bw-settings-item"
          onClick={() => setActiveSection('settings')}
          style={{ marginTop: 'auto' }}
          id="nav-settings"
        >
          <span className="bw-nav-icon">⚙️</span>
          <span className="bw-nav-label">Settings</span>
        </button>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div className="bw-main">
        {/* Top bar */}
        <header className="bw-topbar">
          <div className="bw-topbar-title">
            {[...ADMIN_NAV_ITEMS, { id: 'settings', label: 'Settings' }].find(n => n.id === activeSection)?.icon}{' '}
            {[...ADMIN_NAV_ITEMS, { id: 'settings', label: 'Settings' }].find(n => n.id === activeSection)?.label}
          </div>
          <div className="bw-topbar-right">
            <span className="bw-user-chip" id="user-badge-display">
              👤 {user?.username || 'Admin'}
              <span className="bw-admin-badge" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>ADMIN</span>
            </span>
            <button className="bw-logout-btn" id="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="bw-content">
          {sectionContent()}
        </main>
      </div>
    </div>
  );
}
