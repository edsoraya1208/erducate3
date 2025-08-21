// src/components/dashboard/lecturer-dashboard.jsx
import React, { useState } from 'react';
import '../../styles/lecturer-shared-header.css';
import '../../styles/lecturer-dashboard.css';

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

  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Create Class Modal UI Component
  const CreateClassModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Create New Class</h2>
        
        <div className="form-group">
          <label className="form-label">Class Name</label>
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
          <label className="form-label">Max Students (Optional)</label>
          <input
            type="number"
            value={maxStudents}
            onChange={(e) => onMaxStudentsChange(e.target.value)}
            placeholder="Leave empty for unlimited"
            min="1"
            className="form-input"
          />
        </div>
        
        <div className="modal-buttons">
          <button
            onClick={onCloseCreateModal}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={onSubmitCreateClass}
            disabled={!newClassName.trim() || creating}
            className="create-class-button"
          >
            {creating ? 'Creating...' : 'Create Class'}
          </button>
        </div>
      </div>
    </div>
  );

  // Delete Confirmation Modal UI Component
  const DeleteConfirmationModal = () => (
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

  return (
    <div className="lecturer-dashboard">
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
          {/* Desktop Navigation */}
          <nav className="nav-items desktop-nav">
            <span className="nav-item active">Dashboard</span>
            <span className="nav-item">{getUserDisplayName()}</span>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </nav>

          {/* Mobile Hamburger Button */}
          <button 
            className="hamburger-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </button>

          {/* Mobile Navigation Menu */}
          <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-nav-overlay" onClick={closeMobileMenu}></div>
            <div className="mobile-nav-content">
              <span className="nav-item active" onClick={closeMobileMenu}>Dashboard</span>
              <span className="nav-item" onClick={closeMobileMenu}>{getUserDisplayName()}</span>
              <button 
                className="logout-btn" 
                onClick={() => {
                  onLogout();
                  closeMobileMenu();
                }}
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

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
                classes.map((classItem) => (
                  <div 
                    key={classItem.id} 
                    className="class-card clickable-card"
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
      {showCreateModal && <CreateClassModal />}
      {deleteModal.isOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default LecturerDashboard;