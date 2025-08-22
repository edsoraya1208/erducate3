import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Added useSearchParams
import LecturerCreateExercise from '../../components/class/lecturer-create-exercise.jsx';
import '../../styles/lecturer-shared-header.css';
import '../../styles/create-exercise.css';

// 🏠 PAGE WRAPPER: Handles page-level concerns like layout, authentication, and navigation
const CreateExercisePage = () => {
  const { getUserDisplayName } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Added to get classId
  
  // Get classId from URL parameters
  const classId = searchParams.get('classId');

  // 🏠 NAVIGATION HANDLERS - Page-level navigation logic
  const onDashboardClick = () => {
    navigate('/lecturer/dashboard1');
  };

  // 🚫 CANCEL HANDLER - Navigate back to the specific class page
  const handleCancel = () => {
    if (classId) {
      navigate(`/lecturer/class/${classId}`);
    } else {
      // Fallback to dashboard if no classId
      navigate('/lecturer/dashboard1');
    }
  };

  // 🚪 LOGOUT HANDLER - You may want to implement this
  const handleLogout = () => {
    // Add your logout logic here
    console.log('Logout clicked');
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
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </nav>
        </div>
      </header>

      {/* 🎯 MAIN COMPONENT: The actual create exercise form with cancel handler */}
      <LecturerCreateExercise onCancel={handleCancel} />

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