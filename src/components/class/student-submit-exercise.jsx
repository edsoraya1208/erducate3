// src/components/class/student-submit-exercise.jsx
import React from 'react';
import '../../styles/submit-exercise.css';

const StudentSubmitClass = ({
  // Exercise data props
  exercise,
  loading,
  
  // File upload props
  selectedFile,
  dragOver,
  uploading,
  
  // Form data props
  additionalComments,
  
  // Submission states
  submitted,
  validationMessage,
  
  // 🆕 FIXED: Correct props that match parent
  existingSubmission,
  editCount,
  maxEdits,
  isSubmissionDisabled,
  submissionButtonText,
  canEdit, // 🆕 NEW: Editing permission
  
  // Event handlers
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveFile,
  onCommentsChange,
  onSubmitExercise,
  onGoBack
}) => {

  // 📅 Helper function to check if assignment is past due
  const isPastDue = () => {
    if (!exercise?.dueDate) return false;
    const dueDate = exercise.dueDate.toDate ? exercise.dueDate.toDate() : new Date(exercise.dueDate);
    return new Date() > dueDate;
  };

  // 🚨 Get submission status message
  const getSubmissionStatusMessage = () => {
    if (isPastDue() && !submitted) {
      return {
        type: 'error',
        text: '⏰ Assignment is past due - submission is no longer allowed'
      };
    }
    
    if (submitted && isPastDue()) {
      const dueDate = exercise.dueDate.toDate ? exercise.dueDate.toDate() : new Date(exercise.dueDate);
      const submissionDate = new Date(); // or actual submission date if available
      const daysLate = Math.ceil((submissionDate - dueDate) / (1000 * 60 * 60 * 24));
      return {
        type: 'warning',
        text: `Assignment was submitted ${daysLate} day${daysLate > 1 ? 's' : ''} late`
      };
    } else if (submitted) {
      const remainingEdits = maxEdits - editCount;
      let text = 'Assignment submitted successfully';
      if (remainingEdits > 0 && !isPastDue()) {
        text += ` (${remainingEdits} edit${remainingEdits === 1 ? '' : 's'} remaining)`;
      }
      return {
        type: 'success',
        text: text
      };
    }
    return null;
  };

  const statusMessage = getSubmissionStatusMessage();

  // 📁 File Upload Component 
  const FileUploadArea = () => (
    <div className="se-upload-section">
      <h3 className="se-section-title">Submit Your ERD</h3>
      
      {/* 🆕 DISPLAY CURRENT FILE NAME WHEN EDITING (only when no new file selected) */}
      {(!selectedFile && submitted && existingSubmission?.fileName) && (
        <p className="se-file-selected">
          📁 Current file: {existingSubmission.fileName}
        </p>
      )}
      
      {/* 🚨 Validation Message Display */}
      {validationMessage && (
        <div className={`se-validation-message ${validationMessage.type}`}>
          {validationMessage.text}
        </div>
      )}
      
      {!selectedFile ? (
        // Upload area when no file selected
        <div 
          className={`se-upload-area ${dragOver ? 'se-drag-over' : ''} ${!canEdit ? 'se-disabled' : ''}`}
          onDragOver={canEdit ? onDragOver : undefined}
          onDragLeave={canEdit ? onDragLeave : undefined}
          onDrop={canEdit ? onDrop : undefined}
        >
          <div className="se-upload-icon">📁</div>
          <h4>{submitted ? 'Upload New ERD Diagram' : 'Upload Your ERD Diagram'}</h4>
          <p>Drag and drop your image here or click to browse</p>
          
          <p className="upload-hint">
            Supports: PNG, JPEG, JPG (Max 2MB)
          </p>
          
          <input
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="se-file-input"
            id="erd-file-input"
            disabled={!canEdit}
          />
          <label 
            htmlFor="erd-file-input" 
            className={`se-browse-btn ${!canEdit ? 'disabled' : ''}`}
          >
            Choose File
          </label>
        </div>
      ) : (
        // Preview area when file is selected
        <div className="se-file-preview">
          <div className="se-preview-header">
            <span className="se-file-name">{selectedFile.name}</span>
            <div className="se-file-info">
              <span className="se-file-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              {canEdit && (
                <button 
                  onClick={onRemoveFile}
                  className="se-remove-file-btn"
                  title="Remove file"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="se-image-preview">
            <img 
              src={URL.createObjectURL(selectedFile)} 
              alt="ERD Preview"
              className="se-preview-image"
            />
          </div>
        </div>
      )}
    </div>
  );

  // 💬 Comments Section Component
  const CommentsSection = () => (
    <div className="se-comments-section">
      <h3 className="se-section-title">Additional Comments (Optional)</h3>
      <textarea
        value={additionalComments}
        onChange={(e) => onCommentsChange(e.target.value)}
        className="se-comments-textarea"
        rows="4"
        disabled={!canEdit}
      />
    </div>
  );

  // 🎯 FORMAT DUE DATE: Helper function
  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date set';
    
    try {
      const date = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Invalid date format';
    }
  };

  return (
    <div className="se-container">
      {/* HEADER */}
      <div className="se-header">
        <h1 className="se-title">My Exercises</h1>
        <p className="se-subtitle">View available exercises and submit your answers</p>
      </div>

      {/* SECTION WRAPPER */}
      <div className="se-section">
        <div className="se-section-header">
          <h2 className="se-section-title">
            {exercise?.title || 'Loading exercise...'}
          </h2>
        </div>

        {/* STATUS MESSAGE - Success/Warning/Error */}
        {statusMessage && (
          <div className={`se-status-banner se-status-${statusMessage.type}`}>
            <div className="se-status-content">
              <div className="se-status-icon">
                {statusMessage.type === 'success' ? '✅' : 
                 statusMessage.type === 'warning' ? '⚠️' : '❌'}
              </div>
              <div className="se-status-text">
                <p>{statusMessage.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* EXERCISE CONTENT - Two column responsive layout */}
        <div className="se-exercise-content">
          {/* Left panel - Instructions */}
          <div className="se-instructions-panel">
            <h3 className="se-panel-title">Exercise Instructions</h3>
            <div className="se-instructions-content">
              
              {/* EXERCISE DESCRIPTION */}
              <div className="se-exercise-description">
                <h4>Description:</h4>
                <div className="se-description-text">
                  {exercise?.description || 'No description available'}
                </div>
              </div>

              {/* DUE DATE AND MARKS INFO */}
              <div className="se-due-info">
                <div className="se-info-item">
                  <strong>Due Date:</strong> 
                  <span className={isPastDue() ? 'se-overdue' : 'se-on-time'}>
                    {formatDueDate(exercise?.dueDate)}
                  </span>
                </div>
                <div className="se-info-item">
                  <strong>Total Marks:</strong> {exercise?.totalMarks || 'Not specified'}
                </div>
              </div>

              {/* SUBMISSION GUIDELINES */}
              <div className="se-guidelines">
                <h4>Submission Guidelines:</h4>
                <ul>
                  <li>Submit PNG, JPEG, or JPG files</li>
                  <li>Maximum file size: 2MB</li>
                  <li>Keep diagram clear and well-organized</li>
                  <li>Ensure all text is readable</li>
                  <li>High resolution images are preferred</li>
                  <li> <strong>Submit before due date</strong></li>
                  <li> <strong>Maximum 2 edits allowed</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right panel - Submission area */}
          <div className="se-submission-panel">
            <FileUploadArea />
            <CommentsSection />
            
            {/* Submit button section */}
            <div className="se-submit-section">
              {/* UPLOAD STATUS */}
              {uploading && (
                <div className="se-upload-progress">
                  <div className="se-progress-bar">
                    <div className="se-progress-fill"></div>
                  </div>
                  <p className="se-upload-status">
                    📤 Uploading to cloud storage...
                  </p>
                </div>
              )}

              {/* 🆕 FIXED: Submit button with proper logic */}
              <button
                onClick={onSubmitExercise}
                disabled={!selectedFile || isSubmissionDisabled}
                className={`se-submit-btn ${isSubmissionDisabled ? 'disabled' : ''}`}
              >
                {submissionButtonText}
              </button>

              {/* SUBMISSION CONFIRMATION */}
              {submitted && !isPastDue() && editCount < maxEdits && (
                <p className="se-submitted-note">
                  Your exercise has been submitted. You can still edit and resubmit before the due date.
                </p>
              )}
              
              {submitted && (isPastDue() || editCount >= maxEdits) && (
                <p className="se-submitted-note">
                  Your exercise has been submitted and is ready for grading.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSubmitClass;