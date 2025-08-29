import React, { useState } from 'react';
import '../../styles/my-class-lect.css';
import '../../styles/lecturer-shared-header.css';

// 🆕 NEW: Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "default" // default, danger, success
}) => {
  if (!isOpen) return null;

  return (
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mc-modal-header">
          <h3 className={`mc-modal-title ${type}`}>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="mc-modal-body">
          <p>{message}</p>
        </div>
        <div className="mc-modal-actions">
          <button className="mc-modal-btn mc-modal-btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`mc-modal-btn mc-modal-btn-confirm ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 🆕 NEW: Success Modal Component
const SuccessModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal-content success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mc-modal-header">
          <div className="success-icon">✓</div>
          <h3 className="mc-modal-title success">{title}</h3>
        </div>
        <div className="mc-modal-body">
          <p>{message}</p>
        </div>
        <div className="mc-modal-actions">
          <button className="mc-modal-btn mc-modal-btn-confirm success" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const LecturerMyClass = ({
  // State props
  classData,
  activeTab,
  exercises,
  students,
  searchTerm,
  statusFilter,
  loading,
  
  // User data
  getUserDisplayName,
  
  // Utility functions
  getStatusBadge,
  getInitials,
  
  // Event handlers
  onTabChange,
  onSearchChange,
  onStatusFilterChange,
  onEditExercise,
  onDeleteExercise,
  onDraftExerciseClick,
  onViewSubmissions,
  onNewExercise,
  onDashboardClick,
  onLogout
}) => {

  // 🆕 NEW: Modal states
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, exerciseId: null, exerciseTitle: '' });
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  
  // 🆕 NEW: Handle delete confirmation
  const handleDeleteConfirmation = (exerciseId, exerciseTitle) => {
    setDeleteModal({ 
      isOpen: true, 
      exerciseId, 
      exerciseTitle 
    });
  };


  // 🆕 NEW: Confirm delete action
  const confirmDelete = async () => {
    try {
      await onDeleteExercise(deleteModal.exerciseId);
      setDeleteModal({ isOpen: false, exerciseId: null, exerciseTitle: '' });
      setSuccessModal({
        isOpen: true,
        title: 'Exercise Deleted',
        message: 'The exercise has been successfully deleted.'
      });
    } catch (error) {
      console.error('Delete failed:', error);
      // Handle error - maybe show an error modal
    }
  };

if (!classData) {
  return (
    <div className="page-container">
      <main className="mc-main-content">
        <div className="mc-loading-container">
          <div className="mc-loading-spinner"></div>
          <p>Loading class data...</p>
        </div>
      </main>
    </div>
  );
}

return (
  <div className="page-container">
    <main className="mc-main-content">
      <h1 className="mc-main-title">My Exercises</h1>
      
      <div className="lecturer-my-class">
        <div className="class-details">
          <h2>{classData.name || classData.title}</h2>
          <p className="class-meta">
            {students?.length || 0} students enrolled
          </p>
        </div>

        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
            onClick={() => onTabChange('exercises')}
          >
            Exercises
          </button>
          <button 
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => onTabChange('students')}
          >
            Students
          </button>
        </div>

        {activeTab === 'exercises' && (
          <div className="exercises-content">
            <div className="exercises-controls">
              <div className="search-filter">
                <input 
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="search-input"
                />
                <select 
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button 
                className="new-exercise-btn"
                onClick={onNewExercise}
              >
                + New Exercise
              </button>
            </div>

            <div className="exercise-grid">
              {loading ? (
                <div className="loading">Loading exercises...</div>
              ) : exercises.length === 0 ? (
                <div className="no-exercises">
                  <div className="no-exercises-content">
                    <div className="no-exercises-icon">📝</div>
                    <h3>No exercises found</h3>
                    <p>
                      {statusFilter === 'all' 
                        ? "Start by creating your first exercise for this class."
                        : `No ${statusFilter} exercises found. Try changing the filter or search term.`
                      }
                    </p>
                    {statusFilter === 'all' && (
                      <button 
                        className="create-first-exercise-btn"
                        onClick={onNewExercise}
                      >
                        Create Your First Exercise
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                exercises.map((exercise) => (
                  <div 
                    key={exercise.id} 
                   className="exercise-card clickable"
                    onClick={() => onEditExercise(exercise.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="exercise-header">
                      <h3>{exercise.title}</h3>
                      <span className={`status-badge ${getStatusBadge(exercise.status)}`}>
                        {exercise.status?.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="exercise-meta">
                      <p>Due: {exercise.dueDate || 'No due date'}</p>
                      {/* Show submissions count only if available */}
                      {exercise.submissionCount !== undefined && (
                        <p>{exercise.submissionCount} submission{exercise.submissionCount !== 1 ? 's' : ''}</p>
                      )}
                      {/* Show marks only if available */}
                      {exercise.totalMarks !== undefined && exercise.totalMarks > 0 && (
                        <p>{exercise.totalMarks} marks</p>
                      )}
                    </div>

                    <div className="exercise-actions">
               {exercise.status === 'draft' ? (
                  <button 
                    className="btn btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConfirmation(exercise.id, exercise.title);
                    }}
                  >
                    Delete
                  </button>
                      ) : exercise.status === 'active' ? (
                        <>
                          <button 
                            className="btn btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewSubmissions(exercise.id);
                            }}
                          >
                            View Submissions
                          </button>
                          <button 
                            className="btn btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirmation(exercise.id, exercise.title);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="btn btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewSubmissions(exercise.id);
                            }}
                          >
                            View Submissions
                          </button>
                          <button 
                            className="btn btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirmation(exercise.id, exercise.title);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-content">
            <h3>Enrolled Students</h3>
            <div className="students-list">
              {loading ? (
                <div className="loading">Loading students...</div>
              ) : students && students.length > 0 ? (
                students.map((student) => (
                  <div key={student.id} className="student-item">
                    <div className="student-avatar">
                      {getInitials(student.name)}
                    </div>
                    <div className="student-info">
                      <h4>{student.name}</h4>
                      <p>{student.email}</p>
                    </div>
                    <div className="student-progress">
                      {student.completedExercises || 0}/{exercises.length} exercises completed
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-students" style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                  <div className="no-students-content">
                    <div className="no-students-icon">👥</div>
                    <h3>No students enrolled</h3>
                    <p>Students haven't joined this class yet. Share the class code with your students to get started.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>

    <ConfirmationModal
      isOpen={deleteModal.isOpen}
      onClose={() => setDeleteModal({ isOpen: false, exerciseId: null, exerciseTitle: '' })}
      onConfirm={confirmDelete}
      title="Delete Exercise"
      message={`Are you sure you want to delete "${deleteModal.exerciseTitle}"? This action cannot be undone and all associated data will be permanently removed.`}
      confirmText="Delete"
      cancelText="Cancel"
      type="danger"
    />

    <SuccessModal
      isOpen={successModal.isOpen}
      onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
      title={successModal.title}
      message={successModal.message}
    />
  </div>
);
};

export default LecturerMyClass;