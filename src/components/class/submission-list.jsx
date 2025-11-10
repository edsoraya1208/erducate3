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

// Get status badge configuration
const getStatusConfig = (submission, canGrade) => {
  const { status, grade } = submission;
  
  if (status === 'published' && grade !== null) {
    return {
      type: 'success',
      icon: '✓',
      text: `${grade}/100`,
      buttonText: 'View',
      buttonClass: 'btn-view',
      disabled: false
    };
  } else if (status === 'graded' && grade !== null) {
    return {
      type: 'warning',
      icon: '⚠',
      text: `${grade}/100 (Pending)`,
      buttonText: 'Review & Confirm',
      buttonClass: 'btn-confirm',
      disabled: !canGrade
    };
  } else {
    return {
      type: 'warning',
      icon: '⚠',
      text: 'Pending Review',
      buttonText: 'Review & Grade',
      buttonClass: 'btn-grade',
      disabled: !canGrade
    };
  }
};

const LecturerSubmissions = ({
  exerciseData,
  submissions,
  stats,
  loading,
  onGradeSubmission,
  onViewSubmission,
}) => {
  
  const [filterStatus, setFilterStatus] = useState('all');
  
  const canGrade = isDueDatePassed(exerciseData?.dueDate);
  
  // ✅ Filter submissions based on selected status
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
      
        {/* Page Title with skeleton loader */}
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

        {/* Submissions Section with Integrated Filter Pills */}
        <div className="submissions-container">
          <div className="submissions-header">
            <h2 className="submissions-heading">
              Student Submissions <span className="total-count">({stats.total})</span>
            </h2>
            
            {/* ✅ NEW: Interactive Filter Pills (replaces both stats bar and dropdown) */}
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
                const statusConfig = getStatusConfig(submission, canGrade);
                
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
                      
                      <div className="button-wrapper">
                        <button
                          className={`submission-action-btn ${statusConfig.buttonClass} ${statusConfig.disabled ? 'disabled' : ''}`}
                          onClick={() => {
                            if (statusConfig.disabled) return;
                            
                            if (submission.status === 'published') {
                              onViewSubmission(submission.id);
                            } else {
                              onGradeSubmission(submission.id);
                            }
                          }}
                          disabled={statusConfig.disabled}
                          title={statusConfig.disabled ? 'Available after due date' : ''}
                        >
                          {statusConfig.buttonText}
                        </button>
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