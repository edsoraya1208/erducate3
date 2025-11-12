import React from 'react';
import LecturerGradeERDComponent from '../../components/class/LecturerGradeERDComponent';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const GradeERDPage = () => {
  return (
    <div>
      <DashboardHeader 
        userType="lecturer"
        currentPage="grading"
      />
      <LecturerGradeERDComponent />
    </div>
  );
};

export default GradeERDPage;