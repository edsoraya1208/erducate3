// src/components/dashboard/lecturer-dashboard.jsx
import React, { useState } from 'react';
import '../../styles/lecturer-shared-header.css';
import '../../styles/lecturer-dashboard.css';

// ✅ MOVED OUTSIDE - This fixes the focus loss issue!
const CreateClassModal = ({ 
  newClassName, 
  maxStudents, 
  creating, 
  onClassNameChange, 
  onMaxStudentsChange, 
  onSubmitCreateClass, 
  onCloseCreateModal 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Create New Class</h2>
        
        <div className="form-group">
          <label className="form-label">
            Class Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={newClassName}
            onChange={(e) => onClassNameChange(e.target.value)}
            placeholder="e.g., Database Principles - CS301-G1"
            className="form-input"
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Max Students <span style={{ color: 'red' }}>*</span>
            <div 
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {/* ✅ BETTER BLUE INFO ICON */}
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                style={{ cursor: 'help' }}
              >
                <circle cx="8" cy="8" r="7" fill="#3b82f6" stroke="#2563eb" strokeWidth="1"/>
                <text x="8" y="11.5" fontSize="11" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial">i</text>
              </svg>
              
              {showTooltip && (
                <div style={{
                  position: 'absolute',
                  top: '25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  Enter your actual number of students to prevent duplicate submissions
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0',
                    height: '0',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: '5px solid #1f2937'
                  }}></div>
                </div>
              )}
            </div>
          </label>
          <input
            type="number"
            value={maxStudents}
            onChange={(e) => onMaxStudentsChange(e.target.value)}
            placeholder="Enter number (Max: 45)"
            min="1"
            max="45"
            className="form-input"
          />
        </div>
        
        <div className="modal-buttons">
         <button
            onClick={onCloseCreateModal}
            disabled={creating}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={onSubmitCreateClass}
            disabled={!newClassName.trim() || !maxStudents || creating}
            className="create-class-button"
          >
            {creating ? 'Creating...' : 'Create Class'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ MOVED OUTSIDE - For consistency
const DeleteConfirmationModal = ({ deleteModal, onConfirmDelete, onCloseDeleteModal }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2 className="modal-title">Delete Class</h2>
      <p className="modal-text">
        Are you sure you want to delete "<strong>{deleteModal.className}</strong>"? 
        This action cannot be undone.
      </p>
      <div className="modal-buttons">
        <button
          onClick={onCloseDeleteModal}
          disabled={deleteModal.isDeleting}
          className="cancel-btn"
        >
          Cancel
        </button>
        <button
          onClick={onConfirmDelete}
          disabled={deleteModal.isDeleting}
          className="delete-btn"
        >
          {deleteModal.isDeleting ? 'Deleting...' : 'Delete Class'}
        </button>
      </div>
    </div>
  </div>
);

const LecturerDashboard = ({
  // State props
  classes,
  loading,
  creating,
  showCreateModal,
  newClassName,
  maxStudents,
  deleteModal,
  
  // User data
  getUserDisplayName,
  
  // Event handlers
  onCreateClass,
  onCloseCreateModal,
  onClassNameChange,
  onMaxStudentsChange,
  onSubmitCreateClass,
  onCopyCode,
  onDeleteClass,
  onConfirmDelete,
  onCloseDeleteModal,
  onLogout,
  onClassClick
}) => {

  //make class card colorful edge
  const getRandomColorClass = (classId) => {
    const colors = [
      'color-pink-light',
      'color-blue', 
      'color-green',
      'color-orange',
      'color-red',
      'color-indigo',
      'color-pink',
      'color-teal',
      'color-cyan',
      'color-yellow'
    ];
    
    // Convert classId to a number for consistent ordering
    let hash = 0;
    for (let i = 0; i < classId.length; i++) {
      hash += classId.charCodeAt(i);
    }
    
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className="lecturer-dashboard">
      {/* REMOVED: Navigation Header - now using imported DashboardHeader */}
      
      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Page Title Section */}
          <div className="dashboard-header-section">            
            <h1 className="dashboard-title">Instructor's Dashboard</h1>
          </div>

          {/* Create Class Button - Show only when classes exist */}
          {classes.length > 0 && (
            <div className="create-class-container">
              <button 
                onClick={onCreateClass}
                disabled={creating}
                className="create-class-button-dashboard"
              >
                {creating ? 'Creating...' : '+ New Class'}
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
              {classes.length === 0 ? (
                /* Empty State - No Classes Created Yet */
                <div className="empty-state-container">
                  <div className="empty-state-content">
                    <div className="empty-state-icon">
                      <img src="/empty-class.svg" alt="No Classes" className="empty-class" />
                    </div>
                    <h2 className="empty-state-title">No Classes Yet</h2>
                    <p className="empty-state-description">
                      You haven't created any classes yet. Start by creating your first class to manage students and exercises.
                    </p>
                    <button 
                      onClick={onCreateClass}
                      disabled={creating}
                      className="create-class-button"
                    >
                      {creating ? 'Creating...' : 'Create Class'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Class Cards Grid */
                [...classes].sort((a, b) => b.createdAt.seconds - a.createdAt.seconds).map((classItem, index) => (                  <div 
                    key={classItem.id} 
                    className={`class-card clickable-card ${getRandomColorClass(classItem.id)}`}
                    onClick={() => onClassClick(classItem)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Class Header with Title and Delete Button */}
                    <div className="class-header-dashboard">
                      <h3 className="class-title">{classItem.title}</h3>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          onDeleteClass(classItem.id, classItem.title);
                        }}
                        title="Delete this class"
                      >
                        Delete Class
                      </button>
                    </div>
                    
                    {/* Class Code Section with Copy Functionality */}
                    <div className="class-code-section">
                      <div className="code-label">Class Code</div>
                      <div className="code-container">
                        <span className="class-code">{classItem.classCode}</span>
                        <button 
                          className="copy-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            onCopyCode(classItem.classCode);
                          }}
                          title="Copy class code"
                        >
                          Copy Code
                        </button>
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
      {showCreateModal && (
        <CreateClassModal
          newClassName={newClassName}
          maxStudents={maxStudents}
          creating={creating}
          onClassNameChange={onClassNameChange}
          onMaxStudentsChange={onMaxStudentsChange}
          onSubmitCreateClass={onSubmitCreateClass}
          onCloseCreateModal={onCloseCreateModal}
        />
      )}
      {deleteModal.isOpen && (
        <DeleteConfirmationModal
          deleteModal={deleteModal}
          onConfirmDelete={onConfirmDelete}
          onCloseDeleteModal={onCloseDeleteModal}
        />
      )}
    </div>
  );
};

export default LecturerDashboard;