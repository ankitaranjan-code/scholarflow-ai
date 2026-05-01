import './HomePage.css';

export default function HomePage({ onGetStarted }) {
  return (
    <div className="home-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Unlock Your Academic <span className="text-primary">Potential</span>
          </h1>
          <p className="hero-subtitle">
            ScholarFlow AI blends machine learning predictions with an empathetic AI mentor to help you stay ahead, stay focused, and stay calm.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onGetStarted}>
              Get Started
            </button>
            <a href="#features" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="t-h2 text-center" style={{ marginBottom: '3rem' }}>Why Choose ScholarFlow?</h2>
        <div className="features-grid">
          <div className="feature-card glass-card">
            <span className="material-symbols-outlined feature-icon text-primary">insights</span>
            <h3 className="t-h3">ML Predictions</h3>
            <p className="t-muted">Our custom Random Forest model predicts your future grades based on your current habits and context.</p>
          </div>
          <div className="feature-card glass-card">
            <span className="material-symbols-outlined feature-icon text-secondary">forum</span>
            <h3 className="t-h3">Empathetic AI</h3>
            <p className="t-muted">A personalized AI mentor powered by Gemini that adapts its tone to your mood and academic stress levels.</p>
          </div>
          <div className="feature-card glass-card">
            <span className="material-symbols-outlined feature-icon text-tertiary">military_tech</span>
            <h3 className="t-h3">Gamification</h3>
            <p className="t-muted">Earn points, unlock badges, build your streak, and climb the global leaderboard by completing daily routines.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
