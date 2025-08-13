// src/pages/lecturer/my-class-lect-page.jsx
import React from 'react';
import LecturerMyClass from '../../components/class/lecturer-my-class';

const MyClassLectPage = () => {
  return (
    <div className="my-class-page">
      {/* 
        Main Class Management Component
        All the class functionality is contained in this component
      */}
      <LecturerMyClass />
    </div>
  );
};

export default MyClassLectPage;