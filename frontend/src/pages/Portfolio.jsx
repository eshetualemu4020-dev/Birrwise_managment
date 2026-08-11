// src/pages/Portfolio.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Portfolio() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);


  const skillsData = [
    { category: 'Frontend', name: 'React.js / Next.js', level: '95%', icon: '⚛️' },
    { category: 'Frontend', name: 'JavaScript (ES6+) / TypeScript', level: '90%', icon: '💻' },
    { category: 'Frontend', name: 'HTML5 & CSS3 / Modern Flexbox & Grid', level: '98%', icon: '🎨' },
    { category: 'Styling', name: 'TailwindCSS / Styled Components / Vanilla CSS', level: '92%', icon: '✨' },
    { category: 'State & Tools', name: 'Redux Toolkit / Zustand / Context API', level: '88%', icon: '📦' },
    { category: 'State & Tools', name: 'Vite / Webpack / Babel', level: '90%', icon: '⚡' },
    { category: 'API Integration', name: 'REST APIs / Axios / GraphQL / WebSocket', level: '92%', icon: '🌐' },
    { category: 'Quality & Workflow', name: 'Git & GitHub / CI/CD Pipelines / Jest', level: '85%', icon: '🛠️' },
  ];

  const projects = [
    {
      id: 1,
      title: 'E-Commerce Platform UI',
      category: 'React',
      description: 'A modern, lightning-fast online shopping dashboard featuring real-time product filter, cart management, and payment checkout simulation.',
      tags: ['React', 'Vite', 'CSS Modules', 'Axios'],
      image: '🛍️',
      liveUrl: 'https://example.com/demo1',
      githubUrl: 'https://github.com/example/ecommerce-ui',
      details: 'Features sleek glassmorphism product cards, responsive grid layout, persistent shopping cart state, and smooth checkout flow.'
    },
    {
      id: 2,
      title: 'Real-Time Analytics Dashboard',
      category: 'Web App',
      description: 'Interactive analytics dashboard with data visualizations, live charts, user role permissions, and dark mode toggling.',
      tags: ['React', 'TypeScript', 'Chart.js', 'TailwindCSS'],
      image: '📊',
      liveUrl: 'https://example.com/demo2',
      githubUrl: 'https://github.com/example/analytics-dashboard',
      details: 'Includes customizable widget grids, exported CSV reports, real-time WebSocket metrics feeds, and customizable theme palettes.'
    },
    {
      id: 3,
      title: 'SaaS Landing Page & Auth Flow',
      category: 'UI/UX',
      description: 'High-converting landing page with subtle micro-animations, glassmorphism authentication modal, and integrated pricing calculator.',
      tags: ['HTML5', 'Vanilla CSS', 'JavaScript', 'JWT Auth'],
      image: '🚀',
      liveUrl: 'https://example.com/demo3',
      githubUrl: 'https://github.com/example/saas-landing',
      details: 'Built with mobile-first responsive architecture, optimized Google Fonts typography, keyboard-navigable form inputs, and SEO metadata.'
    },
    {
      id: 4,
      title: 'Task & Workflow Manager',
      category: 'React',
      description: 'Kanban-style task management app with drag-and-drop task ordering, tag filtering, and local storage state persistence.',
      tags: ['React', 'Redux', 'DnD Kit', 'Styled Components'],
      image: '📋',
      liveUrl: 'https://example.com/demo4',
      githubUrl: 'https://github.com/example/task-manager',
      details: 'Features intuitive column board drag-and-drop operations, progress tracking progress bars, and custom task priority badges.'
    }
  ];

  const experiences = [
    {
      role: 'Senior Frontend Developer',
      company: 'Tech Solutions Inc.',
      period: '2024 - Present',
      description: 'Leading frontend architecture for enterprise SaaS web applications using React, TypeScript, and micro-frontend design patterns. Improved page load times by 40%.'
    },
    {
      role: 'Frontend UI/UX Developer',
      company: 'Digital Creative Agency',
      period: '2022 - 2024',
      description: 'Built 25+ bespoke responsive client websites and interactive web dashboards. Collaborated with UI designers to implement pixel-perfect Figma designs.'
    },
    {
      role: 'Junior Web Developer',
      company: 'Innovate Studio',
      period: '2021 - 2022',
      description: 'Developed reusable UI component libraries, integrated RESTful backend APIs, and performed cross-browser testing and performance audits.'
    }
  ];

  const filteredProjects = activeCategory === 'All' 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setContactSent(false), 5000);
  };

  return (
    <div className="portfolio-wrapper">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">✨ Frontend Developer & UI Specialist</div>
          <h1 className="hero-title">
            Crafting Digital Experiences <br />
            With <span className="gradient-text">Clean Code & High Performance</span>
          </h1>
          <p className="hero-subtitle">
            Passionate about building responsive, accessible, and visual-first web applications using React, JavaScript, and modern CSS architecture.
          </p>
          <div className="hero-cta">
            <a href="#projects" className="btn-hero-primary">Explore Projects 🚀</a>
            <a href="#contact" className="btn-hero-secondary">Get In Touch 💬</a>
          </div>
          <div className="hero-tech-pills">
            <span>React.js</span>
            <span>JavaScript ES6+</span>
            <span>TypeScript</span>
            <span>Vite</span>
            <span>CSS3 / Flexbox</span>
            <span>REST API</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-container">
        <div className="section-header">
          <h2>About Me</h2>
          <p className="section-subtitle">Passionate about clean architecture and smooth user interfaces</p>
        </div>
        <div className="about-grid">
          <div className="about-text-card">
            <h3>Hello, I&apos;m a Frontend Developer 👨‍💻</h3>
            <p>
              I specialize in transforming complex requirements and UI/UX mockups into fast, responsive, and reliable web applications. My focus is on writing clean, modular, and maintainable code while delivering smooth user experiences with subtle animations and pixel-perfect layouts.
            </p>
            <p>
              Whether building interactive single-page apps or complex dashboard interfaces, I prioritize web performance, accessibility, and modern design standards.
            </p>
          </div>
          <div className="about-stats-grid">
            <div className="stat-box">
              <span className="stat-number">3+</span>
              <span className="stat-label">Years Experience</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">30+</span>
              <span className="stat-label">Projects Completed</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">99%</span>
              <span className="stat-label">Code Quality Rating</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">100%</span>
              <span className="stat-label">Client Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="section-container bg-dark-card">
        <div className="section-header">
          <h2>Tech Stack & Skills</h2>
          <p className="section-subtitle">Technologies and tools I use to bring products to life</p>
        </div>
        <div className="skills-grid">
          {skillsData.map((skill, index) => (
            <div key={index} className="skill-card">
              <div className="skill-icon">{skill.icon}</div>
              <div className="skill-info">
                <h4>{skill.name}</h4>
                <span className="skill-category">{skill.category}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: skill.level }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="section-container">
        <div className="section-header">
          <h2>Featured Projects</h2>
          <p className="section-subtitle">A showcase of recent frontend projects and applications</p>
        </div>

        <div className="project-filters">
          {['All', 'React', 'Web App', 'UI/UX'].map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-preview">
                <span className="project-emoji">{project.image}</span>
              </div>
              <div className="project-body">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag, i) => (
                    <span key={i} className="tag-pill">{tag}</span>
                  ))}
                </div>
                <div className="project-actions">
                  <button className="btn-detail" onClick={() => setSelectedProject(project)}>
                    View Details 🔍
                  </button>
                  <a href={project.githubUrl} target="_blank" rel="noreferrer" className="link-github">
                    GitHub ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Project Modal */}
      {selectedProject && (
        <div className="modal-backdrop" onClick={() => setSelectedProject(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProject(null)}>✕</button>
            <div className="modal-header">
              <span className="modal-emoji">{selectedProject.image}</span>
              <h2>{selectedProject.title}</h2>
            </div>
            <p className="modal-desc">{selectedProject.description}</p>
            <div className="modal-section">
              <h4>Key Implementation Details:</h4>
              <p>{selectedProject.details}</p>
            </div>
            <div className="modal-tags">
              {selectedProject.tags.map((tag, i) => (
                <span key={i} className="tag-pill">{tag}</span>
              ))}
            </div>
            <div className="modal-actions">
              <a href={selectedProject.liveUrl} target="_blank" rel="noreferrer" className="btn-hero-primary">
                Live Demo 🌐
              </a>
              <a href={selectedProject.githubUrl} target="_blank" rel="noreferrer" className="btn-hero-secondary">
                Source Code 💻
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Work Experience Section */}
      <section id="experience" className="section-container bg-dark-card">
        <div className="section-header">
          <h2>Work Experience</h2>
          <p className="section-subtitle">My professional journey in web development</p>
        </div>
        <div className="timeline">
          {experiences.map((exp, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="timeline-period">{exp.period}</span>
                <h3>{exp.role}</h3>
                <h4 className="company-name">{exp.company}</h4>
                <p>{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-container">
        <div className="section-header">
          <h2>Get In Touch</h2>
          <p className="section-subtitle">Interested in collaborating or hiring? Let&apos;s build something great together.</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info-card">
            <h3>Let&apos;s Connect ✉️</h3>
            <p>I am available for full-time frontend roles, freelance projects, and open-source collaborations.</p>
            <div className="info-list">
              <div className="info-item">
                <span>📍 Location:</span> Remote / Worldwide
              </div>
              <div className="info-item">
                <span>📧 Email:</span> developer@example.com
              </div>
              <div className="info-item">
                <span>🌐 GitHub:</span> github.com/frontend-dev
              </div>
              <div className="info-item">
                <span>💼 LinkedIn:</span> linkedin.com/in/frontend-dev
              </div>
            </div>
          </div>

          <form className="contact-form-card" onSubmit={handleContactSubmit}>
            {contactSent && (
              <div className="contact-success">
                ✅ Thank you! Your message has been sent successfully.
              </div>
            )}
            <div className="input-group">
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                placeholder="Project Inquiry"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows="4"
                placeholder="Tell me about your project or opportunity..."
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
              ></textarea>
            </div>
            <button type="submit" className="btn-primary">Send Message 🚀</button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
