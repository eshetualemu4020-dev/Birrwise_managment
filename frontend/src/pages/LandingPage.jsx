import { Link } from 'react-router-dom';
import '../index.css';

const muted = { fontSize: '0.9rem', color: 'rgba(var(--overlay-rgb),0.7)', lineHeight: 1.75, marginTop: '0.5rem' };
const mutedSmall = { fontSize: '0.85rem', color: 'rgba(var(--overlay-rgb),0.6)', marginTop: '0.25rem', lineHeight: 1.7 };

export default function LandingPage() {
  return (
    <div className="dashboard-wrapper" style={{ display: 'block' }}>
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

      {/* ── HERO ───────────────────────────── */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">✨ Built for Ethiopian students</div>
          <h1 className="hero-title">
            Know exactly where your <br />
            <span className="gradient-text">Birr goes every month</span>
          </h1>
          <p className="hero-subtitle">
            BirrWise is a personal finance tracker that turns scattered allowance,
            scholarship and part-time income into one clear picture — so you can plan
            a budget you can actually keep, save toward real goals, and stop running
            out of money before the month ends.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn-hero-primary">Create a free account</Link>
            <Link to="/login" className="btn-hero-secondary">Sign In</Link>
          </div>

          <div className="hero-tech-pills" style={{ marginTop: '3rem' }}>
            <span>🔒 JWT-secured accounts</span>
            <span>📊 Live charts &amp; reports</span>
            <span>🎯 Savings goals</span>
            <span>💵 All amounts in ETB</span>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ────────────────────── */}
      <section className="section-container" style={{ paddingTop: '1rem' }}>
        <div className="section-header">
          <h2>The problem it solves</h2>
          <p className="section-subtitle">
            Student money arrives in irregular chunks and leaves in small, forgettable ones.
          </p>
        </div>

        <div className="skills-grid">
          <div className="skill-card">
            <div className="skill-icon">🌊</div>
            <div className="skill-info">
              <h4>Income is lumpy, not monthly</h4>
              <p style={mutedSmall}>
                A stipend in September, a scholarship tranche in December, tutoring
                money whenever it comes. A normal monthly budget sheet has nothing to
                hang these on.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">🕳️</div>
            <div className="skill-info">
              <h4>Small spending is invisible</h4>
              <p style={mutedSmall}>
                Air time, minibus fares, coffee, printing, shared rent. No single one
                feels significant, yet together they are usually what eats the month.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">📉</div>
            <div className="skill-info">
              <h4>Saving happens "later"</h4>
              <p style={mutedSmall}>
                Money with no named purpose is money that gets spent. Goals like a
                laptop or an emergency fund never get a real target or deadline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT IT DOES ───────────────────── */}
      <section className="section-container" style={{ paddingTop: '1rem' }}>
        <div className="section-header">
          <h2>What BirrWise does</h2>
          <p className="section-subtitle">
            Six connected pieces that replace the notebook, the mental maths and the
            end-of-month guesswork.
          </p>
        </div>

        <div className="skills-grid">
          <div className="skill-card">
            <div className="skill-icon">📥</div>
            <div className="skill-info">
              <h4>Record income by source</h4>
              <p style={mutedSmall}>
                Log allowance, scholarship, family support, freelance or part-time work
                with a date and description, so you can see which sources you actually
                rely on.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">🧾</div>
            <div className="skill-info">
              <h4>Track expenses by category</h4>
              <p style={mutedSmall}>
                Food, transport, rent, books, air time, entertainment. Searchable, with
                an optional receipt note for anything you may need to justify later.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">📉</div>
            <div className="skill-info">
              <h4>Budgets that enforce reality</h4>
              <p style={mutedSmall}>
                Set a limit per category and period. BirrWise compares it against real
                spending, raises an alert before you cross the line, and archives or
                pauses budgets as your term changes.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">🎯</div>
            <div className="skill-info">
              <h4>Goal-based savings</h4>
              <p style={mutedSmall}>
                Give every saved birr a name — laptop, deposit, emergency fund. Add
                contributions over time and watch the progress bar close the gap.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">🔁</div>
            <div className="skill-info">
              <h4>Recurring items &amp; reminders</h4>
              <p style={mutedSmall}>
                Mark repeating rent, internet or subscriptions once. BirrWise tracks the
                next due date, flags what is unpaid and reminds you so nothing silently
                slips.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">📊</div>
            <div className="skill-info">
              <h4>Reports, charts &amp; exports</h4>
              <p style={mutedSmall}>
                See income against expenses, category breakdowns and your savings rate
                over time — then export it to CSV when you need the numbers elsewhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────── */}
      <section className="section-container" style={{ paddingTop: '1rem' }}>
        <div className="section-header">
          <h2>How it works</h2>
          <p className="section-subtitle">Four steps, and it starts paying off in the first week.</p>
        </div>

        <div className="skills-grid">
          <div className="skill-card">
            <div className="skill-icon">1️⃣</div>
            <div className="skill-info">
              <h4>Create your account</h4>
              <p style={mutedSmall}>
                Register with your student details, then optionally complete your
                profile with institution, student ID, year and semester.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">2️⃣</div>
            <div className="skill-info">
              <h4>Paste in this month's reality</h4>
              <p style={mutedSmall}>
                Add the income you started with and the expenses you already know are
                coming. Ten minutes now saves the whole month of guessing.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">3️⃣</div>
            <div className="skill-info">
              <h4>Set budgets and one goal</h4>
              <p style={mutedSmall}>
                Pick the two or three categories you overspend on and cap them. Name a
                single savings goal with a target amount — one is enough to start.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">4️⃣</div>
            <div className="skill-info">
              <h4>Check in, not obsess</h4>
              <p style={mutedSmall}>
                Log expenses as they happen and open the dashboard weekly. Trend charts,
                insights and alerts tell you what changed before it becomes a problem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESIGN DECISIONS / WHAT IT DOESN'T DO ──────────── */}
      <section className="section-container" style={{ paddingTop: '1rem' }}>
        <div className="section-header">
          <h2>What it deliberately does not do</h2>
          <p className="section-subtitle">
            Being honest about the scope is part of the design.
          </p>
        </div>

        <div className="skills-grid">
          <div className="skill-card">
            <div className="skill-icon">🏦</div>
            <div className="skill-info">
              <h4>It does not touch your bank account</h4>
              <p style={mutedSmall}>
                There is no link to CBE, telebirr or any wallet. Everything is entered
                by you, which means no credentials to leak and no third-party access.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">🧠</div>
            <div className="skill-info">
              <h4>Insights are calculated, not generated</h4>
              <p style={mutedSmall}>
                Savings rate, largest category and income diversification are plain
                arithmetic over your own records. No language model guesses at your
                finances.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">🚫</div>
            <div className="skill-info">
              <h4>No lending, no investing</h4>
              <p style={mutedSmall}>
                BirrWise never offers credit or recommends financial products. It is a
                record-keeping and planning tool, not an advisor of last resort.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRIVACY / SECURITY ─────────────────────────────── */}
      <section className="section-container bg-dark-card" style={{ padding: '4rem 2rem' }}>
        <div className="about-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '860px', margin: '0 auto' }}>
          <div className="about-text-card" style={{ padding: '2rem' }}>
            <h3>Security &amp; privacy</h3>
            <p style={muted}>
              Accounts are protected with bcrypt-hashed passwords and JSON Web Tokens,
              so your password is never stored in readable form. Sensitive routes are
              rate-limited, HTTP security headers are set on every response, and every
              record is scoped to the user who created it — one account can never read
              another's finances.
            </p>
            <p style={muted}>
              A forgotten password is reset through a single-use link. Only a hash of
              that reset token is stored, it expires in 15 minutes, and changing your
              password cancels any outstanding link.
            </p>
            <p style={{ ...muted, fontSize: '0.85rem', color: 'rgba(var(--overlay-rgb),0.55)' }}>
              Run it yourself with SQLite for a zero-setup local install, or point it at
              MySQL for a hosted deployment.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHO IT IS FOR ──────────────────── */}
      <section className="section-container" style={{ paddingTop: '1rem' }}>
        <div className="section-header">
          <h2>Who it is for</h2>
          <p className="section-subtitle">
            Undergraduate and postgraduate students in Ethiopia living on a limited,
            irregular budget.
          </p>
        </div>

        <div className="skills-grid">
          <div className="skill-card">
            <div className="skill-icon">🎓</div>
            <div className="skill-info">
              <h4>Students on a stipend</h4>
              <p style={mutedSmall}>
                You receive a fixed amount each term and need it to last. Budget caps and
                a weekly check-in show how much runway is really left.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">💼</div>
            <div className="skill-info">
              <h4>Students who also earn</h4>
              <p style={mutedSmall}>
                Tutoring, freelance design, campus jobs. Track several income streams
                separately and see how much of your month is actually self-funded.
              </p>
            </div>
          </div>

          <div className="skill-card">
            <div className="skill-icon">🧭</div>
            <div className="skill-info">
              <h4>Anyone learning to budget</h4>
              <p style={mutedSmall}>
                If this is the first time you have had to plan money rather than just
                spend it, the structure here is intentionally simple and forgiving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────── */}
      <section className="section-container bg-dark-card" style={{ padding: '4rem 2rem' }}>
        <div className="about-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
          <div className="about-stats-grid">
            <div className="stat-box">
              <span className="stat-number">100%</span>
              <span className="stat-label">Free to use</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">ETB</span>
              <span className="stat-label">Built for Birr, not dollars</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">6</span>
              <span className="stat-label">Connected money areas</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────── */}
      <section className="section-container" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Start with one month</h2>
        <p className="section-subtitle" style={{ maxWidth: 620, margin: '0 auto 2rem' }}>
          You do not need a perfect system. Record what you spent yesterday, cap the
          category that hurts most, and let the dashboard do the remembering.
        </p>
        <div className="hero-cta" style={{ justifyContent: 'center' }}>
          <Link to="/register" className="btn-hero-primary">Create a free account</Link>
          <Link to="/login" className="btn-hero-secondary">I already have one</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid rgba(var(--overlay-rgb),0.08)' }}>
        <p style={{ color: 'rgba(var(--overlay-rgb),0.45)', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} Birrwise — a student finance tracker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
