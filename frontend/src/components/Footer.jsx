// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="portfolio-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="logo-accent">&lt;/&gt;</span> Frontend Developer Portfolio
          <p>Crafting high-performance, aesthetically stunning web applications.</p>
        </div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} All Rights Reserved. Built with React & Vite.
        </div>
      </div>
    </footer>
  );
}
