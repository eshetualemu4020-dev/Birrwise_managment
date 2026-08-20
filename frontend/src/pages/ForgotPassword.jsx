// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="subtitle">Enter your email to reset your password</p>
        {error && <p className="error">{error}</p>}
        {message && <p className="bw-success" style={{ color: '#10b981', marginBottom: '12px' }}>{message}</p>}
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
          <button type="submit" className="btn-primary" id="btn-forgot-password-submit">Send Reset Link</button>
        </form>
        <p className="switch-link">
          Remembered your password? <Link to="/login" id="link-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
