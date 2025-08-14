import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom'; // Add this import
import LecturerCreateExercise from '../../components/class/lecturer-create-exercise.jsx';
import '../../styles/lecturer-shared-header.css';
import '../../styles/create-exercise.css';

// 🏠 PAGE WRAPPER: Handles page-level concerns like layout, authentication, and navigation
const CreateExercisePage = () => {
  const { getUserDisplayName } = useUser();
  const navigate = useNavigate(); // Add this hook

  // Define the dashboard click handler
  const onDashboardClick = () => {
    navigate('/lecturer/dashboard1'); // Adjust the path as needed
  };

  return (
    <div className="ce-page create-exercise-container">
      {/* 🏠 HEADER SECTION - Page-level navigation and branding */}
      <header className="dashboard-header">
        <div className="header-left">
          {/* 🎨 LOGO AND BRAND SECTION */}
          <div className="logo-container">
            <div className="logo-icon">
              <img 
                src="/logo.svg" 
                alt="ERDucate Logo" 
                className="custom-logo"
              />
            </div>
            {/* Brand name with consistent styling */}
            <span className="brand-name">ERDucate</span>
          </div>
        </div>
        
        <div className="header-right">
          <nav className="nav-items">
            <span className="nav-item" onClick={onDashboardClick}>Dashboard</span>
            <span className="nav-item">{getUserDisplayName()}</span>
            <button className="logout-btn">Logout</button>
          </nav>
        </div>
      </header>

      {/* 🎯 MAIN COMPONENT: The actual create exercise form */}
      <LecturerCreateExercise />

      {/* 
        💡 ADDITIONAL PAGE FEATURES: You can add more sections if needed
        Examples:
        - Footer
        - Side navigation  
        - Help tooltips
        - Progress indicators
        - Breadcrumbs
        - Error boundaries
      */}
    </div>
  );
};

export default CreateExercisePage;