import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useUser } from '../../contexts/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import StudentMyClass from '../../components/class/student-my-class';
import '../../styles/lecturer-shared-header.css';

const MyClassStudPage = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [user] = useAuthState(auth);
  const { getUserDisplayName } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const onDashboardClick = () => {
    navigate('/student/dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <div className="logo-icon">
              <img 
                src="/logo.svg" 
                alt="ERDucate Logo" 
                className="custom-logo"
              />
            </div>
            <span className="brand-name">
              ERDucate
            </span>
          </div>
        </div>
        
        <div className="header-right">
          {/* Desktop Navigation */}
          <nav className="nav-items desktop-nav">
            <span className="nav-item" onClick={onDashboardClick}>Dashboard</span>
            <span className="nav-item">{getUserDisplayName()}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </nav>

          {/* Hamburger Button */}
          <button 
            className="hamburger-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
          </button>

          {/* Mobile Navigation */}
          <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-nav-overlay" onClick={closeMobileMenu}></div>
            <div className="mobile-nav-content">
              <span 
                className="nav-item" 
                onClick={() => {
                  onDashboardClick();
                  closeMobileMenu();
                }}
              >
                Dashboard
              </span>
              <span className="nav-item">{getUserDisplayName()}</span>
              <button 
                className="logout-btn" 
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <StudentMyClass classId={classId} />
      </main>
    </div>
  );
};

export default MyClassStudPage;