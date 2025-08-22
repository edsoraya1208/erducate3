// 📝 UPDATED: Added draft saving functionality when canceling
import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LecturerCreateExercise from '../../components/class/lecturer-create-exercise.jsx';
import '../../styles/lecturer-shared-header.css';
import '../../styles/create-exercise.css';

const CreateExercisePage = () => {
  const { getUserDisplayName } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const classId = searchParams.get('classId');

  const onDashboardClick = () => {
    navigate('/lecturer/dashboard1');
  };

  // 🔄 UPDATED: Enhanced cancel handler to save draft before navigating
  const handleCancel = (formData = null) => {
    // 💾 NEW: If formData is provided, it means we should save as draft
    if (formData && classId) {
      // This will be handled by the LecturerCreateExercise component
      // Component will save draft and then call this function again without formData
      return;
    }
    
    // Navigate back to class page
    if (classId) {
      navigate(`/lecturer/class/${classId}`);
    } else {
      navigate('/lecturer/dashboard1');
    }
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <div className="ce-page create-exercise-container">
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
          <nav className="nav-items">
            <span className="nav-item" onClick={onDashboardClick}>Dashboard</span>
            <span className="nav-item">{getUserDisplayName()}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </nav>
        </div>
      </header>

      {/* 🎯 UPDATED: Pass classId to component for draft saving */}
      <LecturerCreateExercise 
        onCancel={handleCancel} 
        classId={classId}
      />
    </div>
  );
};

export default CreateExercisePage;