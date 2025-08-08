import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="welcome-container">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 1024.5 576">
                  <defs>
                    <clipPath id="54c61c8446">
                      <path d="M 0 0.140625 L 1024 0.140625 L 1024 575.859375 L 0 575.859375 Z M 0 0.140625 " />
                    </clipPath>
                    <clipPath id="d8454990b4">
                      <path d="M 284.785156 17.242188 L 739.0625 17.242188 L 739.0625 541.984375 L 284.785156 541.984375 Z M 284.785156 17.242188 " />
                    </clipPath>
                  </defs>
                  <g id="9098073d47">
                    <g clipRule="nonzero" clipPath="url(#54c61c8446)">
                      <path fill="#ffffff" fillOpacity="1" d="M 0 0.140625 L 1024 0.140625 L 1024 575.859375 L 0 575.859375 Z M 0 0.140625 " />
                    </g>
                    <g clipRule="nonzero" clipPath="url(#d8454990b4)">
                      <path fill="#000000" fillOpacity="1" d="M 511.929688 541.671875 L 284.835938 410.550781 L 284.832031 148.34375 L 511.925781 17.242188 L 739.019531 148.335938 L 739.019531 410.550781 Z M 301.484375 400.941406 L 511.929688 522.445312 L 722.371094 400.941406 L 722.371094 157.945312 L 511.925781 36.464844 L 301.480469 157.957031 Z M 301.484375 400.941406 " />
                    </g>
                    <path fill="#c8c8c8" fillOpacity="1" d="M 529.277344 298.402344 L 528.597656 298.414062 L 494.148438 298.421875 L 493.484375 298.421875 L 331.066406 392.164062 L 331.816406 392.597656 L 331.789062 392.621094 L 511.105469 496.121094 L 511.375 495.964844 L 511.65625 496.117188 L 673.882812 402.484375 L 673.867188 402.449219 L 673.863281 382.699219 L 673.867188 381.902344 Z M 622.125 392.566406 L 511.363281 456.433594 L 400.632812 392.566406 L 511.382812 328.171875 Z M 622.125 392.566406 " />
                    <path fill="#b30101" fillOpacity="1" d="M 501.683594 65.167969 L 501.75 105.3125 L 354.828125 190.125 L 354.832031 233.320312 L 354.828125 235.285156 L 501.191406 150.8125 L 501.257812 190.964844 L 354.832031 275.5 L 354.839844 319.667969 L 501.742188 234.785156 L 501.765625 274.957031 L 320.078125 379.859375 L 319.988281 170.015625 Z M 501.683594 65.167969 " />
                    <path fill="#5ce1e6" fillOpacity="1" d="M 685.6875 157.988281 L 520.796875 62.789062 L 520.789062 63.652344 L 520.753906 63.640625 L 520.769531 273.863281 L 521.054688 274.027344 L 521.054688 274.34375 L 555.796875 294.398438 L 555.796875 208.121094 L 668.347656 273.09375 L 668.472656 359.4375 L 703.859375 379.859375 L 703.851562 293.957031 L 703.292969 292.96875 L 685.941406 262.9375 L 703.371094 252.859375 L 703.851562 252.589844 L 703.859375 189.457031 L 703.511719 188.875 L 686.027344 158.582031 Z M 668.476562 232.785156 L 555.78125 167.796875 L 555.757812 124.136719 L 668.609375 188.832031 Z M 668.476562 232.785156 " />
                  </g>
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
            className="get-started-btn"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="feature-title">AI-Powered Analysis</h3>
            <p className="feature-description">
              Advanced algorithms detect errors by comparing with answer schemes and provide detailed explanations
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Instant Feedback</h3>
            <p className="feature-description">
              Get immediate results without waiting for manual grading or review sessions
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Smart Learning</h3>
            <p className="feature-description">
              Learn from mistakes with contextual explanations and improvement suggestions
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                <path d="m2 17 10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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