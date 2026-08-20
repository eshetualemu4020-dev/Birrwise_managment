import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      const res = await axios.post('/api/auth/register', { username, email, password });
      const loginRes = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', loginRes.data.token);
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const EyeIcon = ({ visible, onClick }) => (
    <svg 
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{
        position: 'absolute', right: '14px', top: '35px', 
        width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
        transition: 'color 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
      onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
    >
      {visible ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </>
      )}
    </svg>
  );

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '440px', padding: '40px 32px' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(124, 92, 252, 0.4)'
          }}>
            <span style={{ fontSize: '18px' }}>💰</span>
          </div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
            Birr Wise
          </span>
        </div>

        {/* Headings */}
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px' }}>
          Create account
        </h2>
        <p className="subtitle" style={{ marginBottom: '32px' }}>
          Start tracking your spending today.
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          
          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="username">Full name</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters with a number"
              style={{ paddingRight: '40px' }}
              required
            />
            <EyeIcon visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              style={{ paddingRight: '40px' }}
              required
            />
            <EyeIcon visible={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
            Create Account
          </button>
        </form>

        <p className="switch-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

      </div>
    </div>
  );
}
