// src/components/shared/DashboardHeader.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { useUser } from '../../contexts/UserContext';
import '../../styles/lecturer-shared-header.css';

const DashboardHeader = ({ 
  userType = 'student', // 'student' or 'lecturer'
  currentPage = 'dashboard', // for highlighting active nav items
  additionalNavItems = [] // array of {label, onClick} objects
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getUserDisplayName } = useUser();
  const navigate = useNavigate();

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Navigate to dashboard
  const onDashboardClick = () => {
    const dashboardPath = userType === 'student' ? '/student/dashboard' : '/lecturer/dashboard1';
    navigate(dashboardPath);
    closeMobileMenu();
  };

  // Handle logout with confirmation
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      try {
        await auth.signOut();
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
      }
    }
    closeMobileMenu();
  };

  return (
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
          <span className="brand-name">ERDucate</span>
        </div>
      </div>
      
      <div className="header-right">
        {/* Desktop Navigation */}
        <nav className="nav-items desktop-nav">
          <span 
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={onDashboardClick}
          >
            Dashboard
          </span>
          
          {/* Render additional nav items */}
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
              className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={onDashboardClick}
            >
              Dashboard
            </span>
            
            {/* Render additional nav items for mobile */}
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
            
            <span className="nav-item">{getUserDisplayName()}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;