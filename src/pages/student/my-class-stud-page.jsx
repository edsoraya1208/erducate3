// src/pages/student/MyClassStudPage.jsx  
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useUser } from '../../contexts/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import StudentMyClass from '../../components/class/student-my-class';
import DashboardHeader from '../../components/dashboard/dashboard-header'; 
import '../../styles/lecturer-shared-header.css';

const MyClassStudPage = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [user] = useAuthState(auth);
  const { getUserDisplayName } = useUser();

  return (
    <div className="dashboard-container">
      {/* REPLACED: Old header with shared component */}
      <DashboardHeader 
        userType="student"
        currentPage="class"
        additionalNavItems={[]}
      />

      <main className="dashboard-main">
        <StudentMyClass classId={classId} />
      </main>
    </div>
  );
};

export default MyClassStudPage;