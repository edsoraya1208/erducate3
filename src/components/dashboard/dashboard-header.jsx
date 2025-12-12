import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth'; 
import { auth } from '../../config/firebase';
import { useUser } from '../../contexts/UserContext';
import NotificationBell from './NotificationBell';
import '../../styles/lecturer-shared-header.css';

const DashboardHeader = ({ 
  userType = 'student',
  currentPage = 'dashboard',
  additionalNavItems = []
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getUserDisplayName } = useUser();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const onDashboardClick = () => {
    // Keep 'dashboard1' to match your routes
    const dashboardPath = userType === 'student' ? '/student/dashboard' : '/lecturer/dashboard1';
    navigate(dashboardPath);
    closeMobileMenu();
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      try {
        await signOut(auth);
        // ✅ FIXED: Redirects to Landing Page / Welcome Screen
        navigate('/'); 
      } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
      }
    }
    closeMobileMenu();
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    if (!name) return 'U';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button 
          className="logo-container clickable-logo" 
          onClick={onDashboardClick}
          aria-label="Go to dashboard"
        >
          <div className="logo-icon">
            <img 
              src="/logo.svg" 
              alt="ERDucate Logo" 
              className="custom-logo"
            />
          </div>
          <span className="brand-name">ERDucate</span>
        </button>
      </div>
      
      <div className="header-right">
        <nav className="nav-items desktop-nav">
          {additionalNavItems.map((item, index) => (
            <span 
              key={index}
              className={`nav-item ${item.active ? 'active' : ''}`}
              onClick={() => {
                item.onClick();
                closeMobileMenu();
              }}
            >
              {item.label}
            </span>
          ))}
          
          <NotificationBell userType={userType} />
          
          <div className="user-avatar" title={getUserDisplayName()}>
            {getUserInitials()}
          </div>
          
          <button className="logout-btn" onClick={handleLogout}>
            <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Logout
          </button>
        </nav>

        <button 
          className="hamburger-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
          <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
          <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
        </button>

        <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-overlay" onClick={closeMobileMenu}></div>
          <div className="mobile-nav-content">
            {additionalNavItems.map((item, index) => (
              <span 
                key={index}
                className={`nav-item ${item.active ? 'active' : ''}`}
                onClick={() => {
                  item.onClick();
                  closeMobileMenu();
                }}
              >
                {item.label}
              </span>
            ))}
            
            <div className="mobile-notification-section">
              <NotificationBell userType={userType} />
            </div>
            
            <div className="mobile-user-info">
              <div className="user-avatar">{getUserInitials()}</div>
              {/* 👇 Added className and a title so you can see full name if you hold press */}
              <span className="mobile-user-name" title={getUserDisplayName()}>
                {getUserDisplayName()}
              </span>
            </div>
            
            <button className="logout-btn mobile-logout" onClick={handleLogout}>
              <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;