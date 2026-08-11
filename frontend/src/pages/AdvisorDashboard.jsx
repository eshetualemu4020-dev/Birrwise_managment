// src/pages/AdvisorDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ADVISOR_NAV_ITEMS = [
  { id: 'dashboard',      icon: '💼', label: 'Dashboard' },
  { id: 'reviews',        icon: '📋', label: 'KYC Reviews' },
  { id: 'messages',       icon: '💬', label: 'Messages' },
];

export default function AdvisorDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser]       = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);

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
      if (userData.role !== 'advisor') {
        if (userData.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
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

  useEffect(() => {
    fetchProfile();
    const t = setInterval(fetchProfile, 4000);
    return () => clearInterval(t);
  }, [fetchProfile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderAdvisorHome = () => (
    <>
      <div className="bw-welcome">
        <h1>Welcome, Advisor 💼</h1>
        <p>Review student KYC submissions and provide financial guidance</p>
      </div>

      <div className="bw-card">
        <h3 className="bw-card-title">💼 Advisor Workspace</h3>
        <p className="bw-card-sub">This area is currently under active development.</p>
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          ⚙️ Advisor dashboard metrics and controls will appear here.
        </div>
      </div>
    </>
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
      case 'dashboard': return renderAdvisorHome();
      case 'reviews':   return renderPlaceholder('KYC Reviews', '📋', 'Review AAU student identity cards and status updates.');
      case 'messages':  return renderPlaceholder('Messages', '💬', 'Engage directly with students requesting financial advise.');
      default:          return renderAdvisorHome();
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
          <span className="bw-brand-icon">💼</span>
          <span className="bw-brand-text">Advisor Workspace</span>
        </div>

        <nav className="bw-nav">
          {ADVISOR_NAV_ITEMS.map(item => (
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
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div className="bw-main">
        {/* Top bar */}
        <header className="bw-topbar">
          <div className="bw-topbar-title">
            {[...ADVISOR_NAV_ITEMS].find(n => n.id === activeSection)?.icon}{' '}
            {[...ADVISOR_NAV_ITEMS].find(n => n.id === activeSection)?.label}
          </div>
          <div className="bw-topbar-right">
            <span className="bw-user-chip" id="user-badge-display">
              👤 {user?.username || 'Advisor'}
              <span className="bw-admin-badge" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>ADVISOR</span>
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
