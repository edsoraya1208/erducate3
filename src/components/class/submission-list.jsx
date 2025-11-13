// src/components/class/submission-list.jsx
import React, { useState, useMemo } from 'react';
import '../../styles/submission-list-style.css';

// Format submission date
const formatSubmissionDate = (timestamp) => {
  if (!timestamp) return 'No date';
  
  try {
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Invalid date';
    }
    
    return date.toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Check if due date has passed
const isDueDatePassed = (dueDate) => {
  if (!dueDate) return true;
  
  try {
    let dueDateObj;
    if (dueDate.toDate) {
      dueDateObj = dueDate.toDate();
    } else if (dueDate instanceof Date) {
      dueDateObj = dueDate;
    } else if (typeof dueDate === 'string') {
      dueDateObj = new Date(dueDate);
    } else {
      return true;
    }
    
    return new Date() > dueDateObj;
  } catch (error) {
    console.error('Error checking due date:', error);
    return true;
  }
};

// 🔄 CHANGED: Simplified status config - only for display, not button behavior
// 🔄 FIXED: Handle grade being object/undefined/null properly
// 🔄 FIXED: grade is a map, need to access grade.total and grade.maxScore
// 🔄 UPDATED: No icon for grades, icon only for status text
const getStatusConfig = (submission) => {
  const { status, grade } = submission;
  
  // Extract scores from grade map
  const totalScore = grade?.totalScore;
  const maxScore = grade?.maxScore || 100;
  const isValidGrade = totalScore !== null && totalScore !== undefined && typeof totalScore === 'number';
  
  if (status === 'published' && isValidGrade) {
    return {
      type: 'success',
      icon: '',  // ✅ No icon for published grades
      text: `${totalScore}/${maxScore}`
    };
  } else if (status === 'graded' && isValidGrade) {
    return {
      type: 'warning',
      icon: '',  // ✅ No icon for pending grades
      text: `${totalScore}/${maxScore} (Pending)`
    };
  } else if (status === 'published') {
    return {
      type: 'success',
      icon: '✓',  // Keep icon for status text
      text: 'Published (No Grade)'
    };
  } else {
    return {
      type: 'warning',
      icon: '⚠',  // Keep icon for status text
      text: 'Pending Review'
    };
  }
};

const LecturerSubmissions = ({
  exerciseData,
  submissions,
  stats,
  loading,
  onViewAndGrade, // 🔄 CHANGED: Single handler prop
}) => {
  
  const [filterStatus, setFilterStatus] = useState('all');
  
  const canGrade = isDueDatePassed(exerciseData?.dueDate);
  
  const filteredSubmissions = useMemo(() => {
    if (filterStatus === 'all') return submissions;
    
    return submissions.filter(submission => {
      if (filterStatus === 'published') return submission.status === 'published';
      if (filterStatus === 'pending') return submission.status === 'submitted' || submission.status === 'graded';
      return true;
    });
  }, [submissions, filterStatus]);
  
  if (loading) {
    return (
      <div className="page-container">
        <main className="submissions-main-content">
          <div className="submissions-loading-container">
            <div className="submissions-loading-spinner"></div>
            <p>Loading submissions...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <main className="submissions-main-content">
      
        <h1 className="submissions-page-title">
          {exerciseData ? exerciseData.title : (
            <span className="title-skeleton">Loading...</span>
          )}
        </h1>

        {/* Due Date Warning Banner */}
        {exerciseData && !canGrade && exerciseData.dueDate && (
          <div className="due-date-banner">
            <div className="banner-icon">⏰</div>
            <div className="banner-content">
              <strong>Grading will be available after the due date</strong>
              <p>
                Due: {formatSubmissionDate(exerciseData.dueDate)} • 
                Students can still resubmit until then
              </p>
            </div>
          </div>
        )}

        {/* Submissions Section */}
        <div className="submissions-container">
          <div className="submissions-header">
            <h2 className="submissions-heading">
              Student Submissions <span className="total-count">({stats.total})</span>
            </h2>
            
            {/* Filter Pills */}
            <div className="filter-pills">
              <button
                className={`filter-pill all ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All ({stats.total})
              </button>
              <button
                className={`filter-pill published ${filterStatus === 'published' ? 'active' : ''}`}
                onClick={() => setFilterStatus('published')}
              >
                ✓ Published ({stats.published})
              </button>
              <button
                className={`filter-pill pending ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                ⚠ Pending ({stats.pendingReview + stats.pendingConfirmation})
              </button>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="no-submissions">
              <div className="no-submissions-content">
                <div className="no-submissions-icon">📝</div>
                <h3>No {filterStatus !== 'all' ? filterStatus : ''} submissions</h3>
                <p>
                  {filterStatus === 'all' 
                    ? "Students haven't submitted their work for this exercise yet."
                    : `No submissions found with status: ${filterStatus}`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="submissions-list">
              {filteredSubmissions.map((submission) => {
                const statusConfig = getStatusConfig(submission);
                
                return (
                  <div key={submission.id} className="submission-card">
                    <div className="submission-info">
                      <h3 className="student-name">{submission.studentName}</h3>
            
                      <p className="submission-meta">
                        <span className="meta-label">Submitted:</span> {formatSubmissionDate(submission.submittedAt)}
                      </p>
                    </div>

                    <div className="submission-status">
                      <div className={`status-indicator ${statusConfig.type}`}>
                        <span className="status-icon">{statusConfig.icon}</span>
                        <span className="status-text">{statusConfig.text}</span>
                      </div>
                      
                      {/* 🔄 CHANGED: Single button that always goes to grading page */}
                      <div className="button-wrapper">
                      {/* ✅ NEW CODE - Different button based on status */}
                        {submission.status === 'published' ? (
                          <button
                            className="submission-action-btn btn-view"
                            onClick={() => onViewAndGrade(submission.id)}
                          >
                            View
                          </button>
                        ) : (
                          <button
                            className={`submission-action-btn btn-grade ${!canGrade ? 'disabled' : ''}`}
                            onClick={() => {
                              if (!canGrade) return;
                              onViewAndGrade(submission.id);
                            }}
                            disabled={!canGrade}
                          >
                            View & Grade
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LecturerSubmissions;