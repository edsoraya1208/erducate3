import React from 'react';
import StudentJoinClass from '../../components/class/student-join-class';
import '../../styles/lecturer-shared-header.css';

const JoinClassStud = () => {
  return (
    <div className="page-container">
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
          <span className="brand-name">
            ERDucate
          </span>
        </div>
      </div>
        <div className="header-right">
          <nav className="nav-items">
            <span className="nav-item active">Dashboard</span>
            <span className="nav-item">Siti Aminah</span>
            <button className="logout-btn">Logout</button>
          </nav>
        </div>
      </header>
      <div className="page-content-below-header">
        <div className="page-title-section">
          <h1 className="page-title">My Class</h1>
        </div>
        <div className="page-content">
          <StudentJoinClass />
        </div>
      </div>
    </div>
  );
};

export default JoinClassStud;