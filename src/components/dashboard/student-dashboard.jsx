// src/components/dashboard/student-dashboard.jsx
import React from 'react';
import '../../styles/lecturer-shared-header.css';
import '../../styles/student-dashboard.css';

const StudentDashboard = ({
  // State props
  joinedClasses,
  loading,
  joining,
  showJoinModal,
  classCode,
  leaveModal,
  
  // User data
  getUserDisplayName,
  
  // Event handlers
  onJoinClass,
  onCloseJoinModal,
  onClassCodeChange,
  onSubmitJoinClass,
  onLeaveClass,
  onConfirmLeave,
  onCloseLeaveModal,
  onLogout,
  onClassClick
}) => {

  // Join Class Modal UI Component
  const JoinClassModal = () => (
    <div className="stud-modal-overlay">
      <div className="stud-modal-content">
        {/* Icon section - similar to your existing join class icon */}
        
        <h2 className="stud-modal-title">Join Your Class</h2>
        <p className="stud-modal-description">
          Enter the unique class code from your lecturer to get started.
        </p>
        
        <div className="form-group">
          <label className="form-label">Class Code</label>
          <input
            type="text"
            value={classCode}
            onChange={(e) => onClassCodeChange(e.target.value.toUpperCase())}
            placeholder="ENTER CLASS CODE (E.G., DB301ABC)"
            className="form-input"
            autoFocus
            maxLength={8}
          />
        </div>
        
        <div className="stud-modal-buttons">
          <button
            onClick={onCloseJoinModal}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={onSubmitJoinClass}
            disabled={!classCode.trim() || joining}
            className="join-class-button"
          >
            {joining ? 'Joining...' : 'Join Class'}
          </button>
        </div>
        
        <div className="help-section">
          <div className="help-icon">ℹ️</div>
          <div className="help-content">
            <strong>Need Help?</strong>
            <p>Class codes are typically provided by your lecturer via email or announced in class. If you don't have a class code, please contact your lecturer.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Leave Confirmation Modal UI Component
  const LeaveConfirmationModal = () => (
    <div className="stud-modal-overlay">
      <div className="stud-modal-content">
        <h2 className="stud-modal-title">Leave Class</h2>
        <p className="stud-modal-text">
          Are you sure you want to leave "<strong>{leaveModal.className}</strong>"? 
          You will need the class code to rejoin later.
        </p>
        <div className="stud-modal-buttons">
          <button
            onClick={onCloseLeaveModal}
            disabled={leaveModal.isLeaving}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmLeave}
            disabled={leaveModal.isLeaving}
            className="delete-btn"
          >
            {leaveModal.isLeaving ? 'Leaving...' : 'Leave Class'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="student-dashboard">
      {/* Navigation Header */}
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
            <span className="nav-item">{getUserDisplayName()}</span>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="stud-dashboard-main">
        <div className="stud-dashboard-container">
          {/* Page Title Section */}
          <div className="stud-dashboard-header-section">            
            <h1 className="stud-dashboard-title">Student's Dashboard</h1>
          </div>

          {/* Join Class Button - Show only when classes exist */}
          {joinedClasses.length > 0 && (
            <div className="join-class-container">
              <button 
                onClick={onJoinClass}
                disabled={joining}
                className="join-class-button-dashboard"
              >
                {joining ? 'Joining...' : '+ Join Class'}
              </button>
            </div>
          )}
                    
          {/* Loading State Display */}
          {loading ? (
            <div className="loading-container">
              <p>Loading classes...</p>
            </div>
          ) : (
            /* Classes Grid Layout */
            <div className="classes-grid">
              {joinedClasses.length === 0 ? (
                /* Empty State - No Classes Joined Yet */
                <div className="stud-empty-state-container">
                  <div className="stud-empty-state-content">
                    <div className="stud-empty-state-icon">
                      <img src="/empty-class.svg" alt="No Classes" className="stud-empty-class" />
                    </div>
                    <h2 className="stud-empty-state-title">No Classes Joined Yet</h2>
                    <p className="stud-empty-state-description">
                      You haven't joined any classes yet. Enter a class code from your lecturer to get started with ERD exercises and learning materials.
                    </p>
                    <button 
                      onClick={onJoinClass}
                      disabled={joining}
                      className="join-class-button"
                    >
                      {joining ? 'Joining...' : 'Join Class'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Class Cards Grid */
                joinedClasses.map((classItem) => (
                  <div 
                    key={classItem.id} 
                    className="class-card clickable-card"
                    onClick={() => onClassClick(classItem)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Class Header with Title and Leave Button */}
                    <div className="class-header-dashboard">
                      <h3 className="class-title">{classItem.title}</h3>
                      <button 
                        className="leave-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          onLeaveClass(classItem.id, classItem.title);
                        }}
                        title="Leave this class"
                      >
                        Leave Class
                      </button>
                    </div>
                    
                    {/* Class Info Section */}
                    <div className="class-info-section">
                      <div className="info-item">
                        <span className="info-label">Instructor:</span>
                        <span className="info-value">{classItem.instructorName || 'Unknown'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Class Code:</span>
                        <span className="info-value class-code">{classItem.classCode}</span>
                      </div>
                      <p className="class-description">{classItem.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Components */}
      {showJoinModal && <JoinClassModal />}
      {leaveModal.isOpen && <LeaveConfirmationModal />}
    </div>
  );
};

export default StudentDashboard;