// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.isFrozen) {
        setError('⚠️ YOUR ACCOUNT HAS BEEN FROZEN BY AN ADMINISTRATOR.');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  const handleAdminQuickFill = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your account</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" id="btn-login-submit">Sign In</button>
        </form>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
            <button
              type="button"
              className="btn-secondary"
              id="btn-admin-fill"
              onClick={handleAdminQuickFill}
              style={{ fontSize: '0.85rem', padding: '6px 12px', flex: 1 }}
            >
              🔑 Fill Admin
            </button>
            <button
              type="button"
              className="btn-secondary"
              id="btn-advisor-fill"
              onClick={() => { setEmail('advisor@example.com'); setPassword('advisor123'); }}
              style={{ fontSize: '0.85rem', padding: '6px 12px', flex: 1 }}
            >
              💼 Fill Advisor
            </button>
          </div>
          <button
            type="button"
            className="btn-secondary"
            id="btn-student-fill"
            onClick={() => { setEmail('student@example.com'); setPassword('student123'); }}
            style={{ fontSize: '0.85rem', padding: '6px 12px', width: '100%' }}
          >
            🎓 Fill Student
          </button>
        </div>
        <p className="switch-link">
          Don&apos;t have an account? <Link to="/register" id="link-create-account">Create one</Link>
        </p>
      </div>
    </div>
  );
}

