// src/components/class/LecturerGradeERDComponent.jsx
import React from 'react';
// ❌ REMOVED: All Firebase and Router imports (logic is now in Parent Page)
import ERDReviewPanel from './ERDReviewPanel';
import '../../styles/review-erd.css';
import '../../styles/grade-erd.css';

const LecturerGradeERDComponent = ({
  // ✅ Props from Parent Page
  loading,
  grading,
  publishingGrade,
  studentSubmission,
  exerciseData,
  allElements,
  setAllElements,
  gradingResult,
  isReadOnly,
  notification,
  onRefreshGrade,
  onPublish,
  onCancel
}) => {
  
  if (loading) {
    return (
      <div className="grade-loading-overlay">
        <div className="grade-loading-spinner"></div>
        <p className="grade-loading-text">Loading submission...</p>
      </div>
    );
  }

  if (!studentSubmission || !exerciseData) {
    return (
      <div className="rev-container">
        <div className="grade-error-state">
          <p>❌ Failed to load submission data</p>
          <button onClick={onCancel} className="grade-back-button">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rev-container grade-container">
      <div className="grade-header-card">
        <h1 className="rev-title">
          <div className="grade-header-left">
            <span className="grade-header-title">
              Grading: {studentSubmission.studentName || 'Student'}
            </span>
            <span className="grade-header-subtitle">
              {exerciseData.title}
            </span>
          </div>

          <div className="grade-header-right">
            <span className="grade-current-label">Current Grade</span>

            <button 
              className="grade-score-display"
              onClick={onRefreshGrade} // ✅ Uses prop
              disabled={grading || isReadOnly}
              title="Refresh grade"
            >
              <span className="grade-refresh-icon">🔄</span>
              <span>
                {grading ? '...' : gradingResult ? `${gradingResult.totalScore}/${gradingResult.maxScore}` : '--/--'}
              </span>
            </button>
          </div>
        </h1>
      </div>
        
      <div className="rev-content">
        {/* Left: Image & Comments */}
        <div className="rev-image-section">
          <div className="grade-left-column">
            <h2>Student's ERD Submission</h2>
            
            <div className="grade-image-container">
              <div className="rev-image-display">
                {studentSubmission.fileURL ? (
                  <img src={studentSubmission.fileURL} alt="Student ERD" />
                ) : (
                  <div className="grade-image-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.5">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p>No image uploaded</p>
                  </div>
                )}
              </div>

              <div className="grade-student-comments">
                <h3>Student's Comments</h3>
                {studentSubmission.comments ? (
                  <div className="grade-comments-content">
                    <p>{studentSubmission.comments}</p>
                  </div>
                ) : (
                  <div className="grade-comments-empty">
                    <p>No comments provided</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ERDReviewPanel
          allElements={allElements}
          setAllElements={setAllElements}
          isReadOnly={isReadOnly}
          onPublish={onPublish} // ✅ Uses prop
          onCancel={onCancel}   // ✅ Uses prop
          isPublishing={publishingGrade}
          isLoading={loading}
          publishButtonText="Publish Grade"
        />
      </div>

      {/* AI Feedback */}
      {gradingResult && (
        <div className="grade-feedback-section">
          <div className="grade-feedback-box">
            <h3>✨ AI Feedback</h3>
            
            {gradingResult.feedback?.correct?.length > 0 && (
              <div className="feedback-strengths">
                <h4>✅ Strengths</h4>
                <ul>
                  {gradingResult.feedback.correct.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {gradingResult.feedback?.missing?.length > 0 && (
              <div className="feedback-missing">
                <h4>❌ Missing</h4>
                <ul>
                  {gradingResult.feedback.missing.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {gradingResult.feedback?.incorrect?.length > 0 && (
              <div className="feedback-incorrect">
                <h4>⚠️ Needs Improvement</h4>
                <ul>
                  {gradingResult.feedback.incorrect.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {gradingResult.overallComment && (
              <div className="feedback-overall">
                <p><strong>Overall:</strong> {gradingResult.overallComment}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`rev-notification ${notification.type}`}>
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default LecturerGradeERDComponent;