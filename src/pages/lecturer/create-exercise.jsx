// 📝 UPDATED: Added draft saving functionality when canceling
import React, { useState } from 'react'; // ✅ FIXED: Import useState
import { useUser } from '../../contexts/UserContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LecturerCreateExercise from '../../components/class/lecturer-create-exercise.jsx';
import '../../styles/lecturer-shared-header.css';
import '../../styles/create-exercise.css';
import DashboardHeader from '../../components/dashboard/dashboard-header'; // ✅ FIXED: Correct import path

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
    <div className="ce-page create-exercise-container"> {/* ✅ KEPT: Your existing container class */}
      {/* ✅ REPLACED: Old header with reusable DashboardHeader */}
      <DashboardHeader 
        userType="lecturer"
        currentPage="create-exercise"
        additionalNavItems={[]} // Add any extra nav items here if needed
      />

      {/* ✅ UNCHANGED: Your existing component */}
      <LecturerCreateExercise 
        onCancel={handleCancel}
        classId={classId}
        onLogout={handleLogout}
        onDashboardClick={onDashboardClick}
      />
    </div>
  );
};

export default CreateExercisePage;