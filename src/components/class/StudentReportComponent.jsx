// src/components/class/StudentReportComponent.jsx
import React from 'react';

const StudentReportComponent = ({ submission, exerciseData, loading, error, classId }) => {
  // Loading state
  if (loading) {
    return (
      <div className="report-loading-overlay">
        <div className="report-loading-spinner"></div>
        <p className="report-loading-text">Loading your results...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="report-error-state">
        <div className="report-error-icon">❌</div>
        <h2>Error Loading Results</h2>
        <p>{error}</p>
      </div>
    );
  }

  // No data state
  if (!submission || !exerciseData) {
    return (
      <div className="report-error-state">
        <div className="report-error-icon">📭</div>
        <h2>No Results Available</h2>
        <p>Your results are not yet published by the instructor.</p>
      </div>
    );
  }

  const { grade } = submission;

   const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-MY', { 
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };
  

  const handleDownloadPDF = () => {
    // 1. Get the data
    const studentName = submission.studentEmail.split('@')[0];
    const exerciseTitle = exerciseData.title.replace(/\s+/g, '_');
    
    // 2. Save original title
    const originalTitle = document.title;
    
    // 3. Set custom title IMMEDIATELY
    // We do this first so it has the best chance of being picked up
    document.title = `${studentName}_${exerciseTitle}`;
    
    // 4. Trigger Print IMMEDIATELY (No setTimeout)
    // This satisfies the iOS security requirement so the dialog opens
    window.print();
    
    // 5. Restore title after a delay
    // We can delay this part safely because the print dialog is already open
    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  };
  

  // Helper function to get color class based on score
  const getScoreColorClass = (earned, max) => {
    if (earned === max) return 'score-full';
    if (earned > 0) return 'score-partial';
    return 'score-zero';
  };

  return (
    <div className="report-container">
      {/* Print Header */}
      <div className="report-print-header print-only">
        <h1>Exercise: {exerciseData.title}</h1>
        <p>Student: {submission.studentEmail}</p>
        <p>Submitted: {formatDate(submission.submittedAt)}</p>
      </div>

      {/* Top Header - Exercise Title & Grade */}
      <div className="report-top-header">
        <div className="report-header-left">
          <h1>Exercise: {exerciseData.title}</h1>
          <p>{formatDate(submission.submittedAt)}</p>
        </div>
        <div className="report-header-right">
          <div className="report-grade-display">
            <span className="report-grade-label">Current Grade</span>
            <span className="report-grade-value">{grade.totalScore}/{grade.maxScore}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="report-main-content">
        
        {/* ✅ NEW: Question Section (Full Width) */}
        {exerciseData.description && (
          <div className="report-question-section">
            <h3>📝 Question / Instructions</h3>
            <div className="report-question-content">
              {exerciseData.description}
            </div>
          </div>
        )}

        {/* LEFT: Student Submission */}
        <div className="report-submission-section">
          <h2>Your Submission</h2>
          {submission.fileURL ? (
            <div className="report-submission-image-container">
              <img src={submission.fileURL} alt="Student ERD Submission" />
            </div>
          ) : (
            <div className="report-no-image">
              <p>No image submitted</p>
            </div>
          )}
          {submission.comments && (
            <div className="report-student-comments">
              <h4>Your Comments:</h4>
              <p>{submission.comments}</p>
            </div>
          )}
        </div>

        {/* RIGHT: Component Breakdown */}
        <div className="report-breakdown-section">
          <h2>Component Breakdown</h2>
          <div className={`report-breakdown-grid ${grade?.breakdown?.length % 2 !== 0 ? 'has-odd' : ''}`}>
            {grade?.breakdown && grade.breakdown.map((item, idx) => (
              <div key={idx} className={`report-breakdown-box ${getScoreColorClass(item.earned, item.max)}`}>
                <div className="report-breakdown-score-large">
                  {item.earned}/{item.max}
                </div>
                <div className="report-breakdown-label">{item.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      

      {/* Feedback Section */}
      {grade?.feedback && (
        <div className="report-feedback-section">
          <h2 className="report-feedback-title">✨ Detailed Feedback</h2>

          {/* Strengths */}
          {grade.feedback.correct && grade.feedback.correct.length > 0 && (
            <div className="report-feedback-box report-feedback-strengths">
              <h3>✅ Strengths</h3>
              <ul>
                {grade.feedback.correct.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Elements */}
          {grade.feedback.missing && grade.feedback.missing.length > 0 && (
            <div className="report-feedback-box report-feedback-missing">
              <h3>❌ Missing Elements</h3>
              <ul>
                {grade.feedback.missing.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {grade.feedback.incorrect && grade.feedback.incorrect.length > 0 && (
            <div className="report-feedback-box report-feedback-incorrect">
              <h3>⚠️ Areas for Improvement</h3>
              <ul>
                {grade.feedback.incorrect.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Overall Comment */}
          {grade.overallComment && (
            <div className="report-feedback-box report-feedback-overall">
              <h3>💬 Overall Comment</h3>
              <p>{grade.overallComment}</p>
            </div>
          )}
        </div>
      )}

      {/* Download Button - Bottom Right */}
      <div className="report-download-container no-print">
        <button onClick={handleDownloadPDF} className="report-download-button">
          Download
        </button>
      </div>

      {/* Print Footer */}
      <div className="report-print-footer print-only">
        Generated on {new Date().toLocaleDateString()} | ERDucate System
      </div>
    </div>
  );
};

export default StudentReportComponent;