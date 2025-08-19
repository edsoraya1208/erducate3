import React from 'react';
import '../../styles/my-class-lect.css';
import '../../styles/lecturer-shared-header.css';

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
  onPublishExercise,
  onEditExercise,
  onViewSubmissions,
  onNewExercise,
  onDashboardClick,
  onLogout
}) => {

  // Shared header component
  const Header = () => (
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
          <span className="nav-item" onClick={onDashboardClick}>Dashboard</span>
          <span className="nav-item">{getUserDisplayName()}</span>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );

  if (!classData) {
    return (
      <div className="page-container">
        <Header />
        <main className="mc-main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading class data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />

      <main className="mc-main-content">
        {/* Main title outside the white container */}
        <h1 className="mc-main-title">My Exercises</h1>
        
        <div className="lecturer-my-class">
          <div className="class-details">
            <h2>{classData.name || classData.title}</h2>
            {/* Updated to use actual classData properties without hardcoded fallbacks */}
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
                ) : (
                  exercises.map((exercise) => (
                    <div key={exercise.id} className="exercise-card">
                      <div className="exercise-header">
                        <h3>{exercise.title}</h3>
                        <span className={`status-badge ${getStatusBadge(exercise.status)}`}>
                          {exercise.status?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="exercise-meta">
                        <p>Due: {exercise.dueDate}</p>
                        <p>{exercise.submissions || 0}/{exercise.maxSubmissions || 0} submissions</p>
                        <p>{exercise.marks} marks</p>
                      </div>

                      <div className="exercise-actions">
                        {exercise.status === 'draft' ? (
                          <>
                            <button 
                              className="btn-class-lect btn-publish"
                              onClick={() => onPublishExercise(exercise.id)}
                            >
                              Publish
                            </button>
                            <button 
                              className="btn btn-edit"
                              onClick={() => onEditExercise(exercise.id)}
                            >
                              Edit
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-view"
                            onClick={() => onViewSubmissions(exercise.id)}
                          >
                            View Submission
                          </button>
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
                ) : (
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
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LecturerMyClass;