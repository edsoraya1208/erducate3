// src/components/dashboard/lecturer-dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/lecturer-shared-header.css';
import '../../styles/lecturer-dashboard.css';


const LecturerDashboard = () => {
  // Sample data for classes - you can replace this with real data from API/database
  const classes = [
    {
      id: 1,
      title: "Database Principles - CS301-G1",
      classCode: "DB301-2025",
      description: "Share this code with students to join your class"
    },
    {
      id: 2,
      title: "Database Principles - CS301-G2", 
      classCode: "DB301-2025",
      description: "Share this code with students to join your class"
    },
    {
      id: 3,
      title: "Advanced Database - CS302",
      classCode: "DB301-2025", 
      description: "Share this code with students to join your class"
    }
  ];

  // Function to handle copying class code to clipboard
  const handleCopyCode = (classCode) => {
    navigator.clipboard.writeText(classCode);
    alert(`Class code ${classCode} copied to clipboard!`);
    // You can replace alert with a toast notification for better UX
  };

  // Function to handle class deletion
  const handleDeleteClass = (classId, className) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${className}"?`);
    if (confirmDelete) {
      // Here you would typically call an API to delete the class
      console.log(`Deleting class with ID: ${classId}`);
      // Add your delete logic here
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      // Add your logout logic here (clear tokens, redirect, etc.)
      console.log('Logging out...');
    }
  };

  return (
    <div className="lecturer-dashboard">
      {/* 🏠 TOP NAVIGATION HEADER - Contains logo and navigation */}
      <header className="dashboard-header">
        <div className="header-left">
          {/* 🎨 LOGO SECTION - ERDucate branding */}
          <div className="logo-container">
            <div className="logo-icon">
              <img 
                src="/logo.svg" 
                alt="ERDucate Logo" 
                className="custom-logo"
              />
            </div>
            {/* Brand name with CSS styling */}
            <span className="brand-name">
              ERDucate
            </span>
          </div>
        </div>
        
        <div className="header-right">
          {/* Navigation items */}
          <nav className="nav-items">
            <span className="nav-item active">Dashboard</span>
            <span className="nav-item">Prof. Johnson</span>
            {/* Logout button */}
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Page Title */}
          <h1 className="dashboard-title">Instructor's Dashboard</h1>
          
          {/* Classes Grid - This is where all class cards are displayed */}
          <div className="classes-grid">
            {classes.map((classItem) => (
              <div key={classItem.id} className="class-card">
                {/* Class Header with Title and Delete Button */}
                <div className="class-header">
                  <h3 className="class-title">{classItem.title}</h3>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteClass(classItem.id, classItem.title)}
                    title="Delete this class"
                  >
                    Delete Class
                  </button>
                </div>
                
                {/* Class Code Section */}
                <div className="class-code-section">
                  <div className="code-label">Class Code</div>
                  <div className="code-container">
                    {/* The actual class code - students use this to join */}
                    <span className="class-code">{classItem.classCode}</span>
                    {/* Copy button to copy code to clipboard */}
                    <button 
                      className="copy-btn"
                      onClick={() => handleCopyCode(classItem.classCode)}
                      title="Copy class code"
                    >
                      Copy Code
                    </button>
                  </div>
                  {/* Description text below the code */}
                  <p className="class-description">{classItem.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LecturerDashboard;