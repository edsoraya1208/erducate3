import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="welcome-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="background-circles">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
          </div>
        </div>
        <div className="hero-content">
          <div className="logo-section">
            <div className="logo">
              <div className="logo-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="3" fill="url(#gradient1)"/>
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="url(#gradient2)" opacity="0.8"/>
                  <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff"/>
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#8b5cf6"/>
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b"/>
                      <stop offset="100%" stopColor="#f97316"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 className="logo-text">ERDucate</h1>
            </div>
          </div>
          <h2 className="hero-subtitle">An AI-Powered ERD Assessment & Feedback Tool</h2>
          <p className="hero-description">
            Revolutionize database design education with AI-powered feedback. 
            Students upload ERD diagrams and receive instant, intelligent analysis 
            that helps them learn from mistakes without waiting for manual review sessions.
          </p>
          <button 
            className="btn btn-primary btn-large get-started-btn"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </section>
      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" fill="#6366f1"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="feature-title">AI-Powered Analysis</h3>
            <p className="feature-description">
              Advanced algorithms detect errors by comparing with answer schemes and provide detailed explanations
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#f59e0b"/>
              </svg>
            </div>
            <h3 className="feature-title">Instant Feedback</h3>
            <p className="feature-description">
              Get immediate results without waiting for manual grading or review sessions
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#ef4444" strokeWidth="2"/>
                <circle cx="12" cy="12" r="6" fill="none" stroke="#ef4444" strokeWidth="2"/>
                <circle cx="12" cy="12" r="2" fill="#ef4444"/>
              </svg>
            </div>
            <h3 className="feature-title">Smart Learning</h3>
            <p className="feature-description">
              Learn from mistakes with contextual explanations and improvement suggestions
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#8b5cf6"/>
                <path d="m2 17 10 5 10-5M2 12l10 5 10-5" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-title">Instructor Control</h3>
            <p className="feature-description">
              Instructors can edit AI feedback and grades to ensure accuracy and quality
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;