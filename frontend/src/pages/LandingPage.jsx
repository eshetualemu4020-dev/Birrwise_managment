import { Link } from 'react-router-dom';
import '../index.css';

export default function LandingPage() {
  return (
    <div className="dashboard-wrapper">
      {/* Navigation */}
      <nav className="portfolio-navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            💰 <span className="logo-accent">Birrwise</span>
          </Link>
          <div className="nav-actions">
            <Link to="/login" className="btn-secondary-link">Log In</Link>
            <Link to="/register" className="btn-primary-link">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">✨ Smart Financial Management</div>
          <h1 className="hero-title">Take Control of Your <br /><span className="gradient-text">Financial Future</span></h1>
          <p className="hero-subtitle">
            Track your income, control your expenses, and reach your savings goals with AI-powered insights. Designed for students and professionals alike.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn-hero-primary">Get Started Free</Link>
            <Link to="/login" className="btn-hero-secondary">Sign In</Link>
          </div>
          
          <div className="hero-tech-pills" style={{ marginTop: '3rem' }}>
            <span>🔒 Secure Encryption</span>
            <span>📊 Real-time Analytics</span>
            <span>🤖 AI Advisor</span>
          </div>
        </div>
      </section>

      {/* Features Section using existing styles */}
      <section className="section-container" style={{ paddingTop: '2rem' }}>
        <div className="section-header">
          <h2>Why Choose Birrwise?</h2>
          <p className="section-subtitle">Everything you need to master your money in one beautiful dashboard.</p>
        </div>

        <div className="skills-grid">
          {/* Feature 1 */}
          <div className="skill-card">
            <div className="skill-icon">📉</div>
            <div className="skill-info">
              <h4>Strict Budget Tracking</h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                Set limits and get notified before you overspend. We ensure your expenses never exceed your actual income.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="skill-card">
            <div className="skill-icon">🤖</div>
            <div className="skill-info">
              <h4>AI Financial Assistant</h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                Chat with an intelligent AI that analyzes your spending habits and offers personalized advice to save more.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="skill-card">
            <div className="skill-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="skill-icon" style={{ padding: '0.4rem', fontSize: '1.5rem' }}>🎯</div>
                <h4>Goal-Oriented Savings</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                Set targets for the things you love. Track your progress visually and stay motivated to reach your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-container bg-dark-card" style={{ padding: '4rem 2rem' }}>
        <div className="about-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
          <div className="about-stats-grid">
            <div className="stat-box">
              <span className="stat-number">100%</span>
              <span className="stat-label">Free to Use</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">24/7</span>
              <span className="stat-label">AI Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} Birrwise Management. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
