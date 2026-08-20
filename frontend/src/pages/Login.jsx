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



  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Welcome Back birrwise</h2>
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
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#a855f7', textDecoration: 'none' }}>Forgot Password?</Link>
          </div>

        <p className="switch-link">
          Don&apos;t have an account? <Link to="/register" id="link-create-account">Create one</Link>
        </p>
      </div>
    </div>
  );
}

