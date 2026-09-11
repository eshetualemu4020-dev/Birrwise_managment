import { useState, useEffect } from 'react';
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
];

export default function StudentLayout({ children, activeSection, onNavClick, user, isFrozen }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
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
    };
    fetchNotifications();
    const t = setInterval(fetchNotifications, 4000);
    return () => clearInterval(t);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavClick = (id) => {
    if (onNavClick) {
      onNavClick(id);
    } else {
      if (['dashboard', 'income', 'expenses', 'analytics', 'settings'].includes(id)) {
        navigate('/student/dashboard', { state: { activeSection: id } });
      } else if (id === 'budgets') {
        navigate('/student/budgets');
      } else if (id === 'savings') {
        navigate('/student/savings-goals');
      } else if (id === 'transactions') {
        navigate('/student/transactions');
      } else if (id === 'reports') {
        navigate('/student/reports');
      }
    }
  };

  const currentNav = [...NAV_ITEMS, { id: 'settings', label: 'Settings', icon: '⚙️' }].find(n => n.id === activeSection);

  return (
    <div className={`bw-layout ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
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
      <aside className="bw-sidebar" style={{ overflowY: 'auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="bw-sidebar-brand">
          <span className="bw-brand-icon">🎓</span>
          <span className="bw-brand-text">BirrWise</span>
        </div>
        <nav className="bw-nav">
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id} 
              className={`bw-nav-item${activeSection === item.id ? ' active' : ''}`} 
              onClick={() => handleNavClick(item.id)}
            >
              <span className="bw-nav-icon">{item.icon}</span>
              <span className="bw-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <button 
          className={`bw-nav-item bw-settings-item${activeSection === 'settings' ? ' active' : ''}`} 
          onClick={() => handleNavClick('settings')} 
          style={{ marginTop: 'auto' }}
        >
          <span className="bw-nav-icon">⚙️</span>
          <span className="bw-nav-label">Settings</span>
        </button>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div className="bw-main" style={{ overflowY: 'auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="bw-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
              title="Toggle Sidebar"
            >
              ☰
            </button>
            <div className="bw-topbar-title">
              {currentNav?.icon}{' '}
              {currentNav?.label}
            </div>
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

        {children}
      </div>
    </div>
  );
}
