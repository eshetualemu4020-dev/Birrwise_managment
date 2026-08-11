// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="portfolio-navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-accent">&lt;/&gt;</span> DevPortfolio
        </Link>
        <nav className="nav-links">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="nav-actions">
          {token ? (
            <>
              <Link to="/dashboard" className="btn-dash-link">
                👤 {user?.username || 'Dashboard'}
              </Link>
              <button onClick={handleLogout} className="btn-nav-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary-link">Sign In</Link>
              <Link to="/register" className="btn-primary-link">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
