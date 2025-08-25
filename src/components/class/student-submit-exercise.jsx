// src/components/class/student-submit-class.jsx
import React from 'react';
import '../../styles/submit-exercise.css';

const StudentSubmitClass = ({
  // Exercise data props (unchanged)
  exercise,
  loading,
  
  // File upload props (unchanged)
  selectedFile,
  dragOver,
  uploading,
  
  // Form data props (unchanged)
  additionalComments,
  
  // 🆕 NEW: Submission states
  submissionStatus,
  submitted,
  validationMessage,
  
  // Event handlers (unchanged)
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveFile,
  onCommentsChange,
  onSubmitExercise,
  onGoBack
}) => {

  // 📁 File Upload Component 
  const FileUploadArea = () => (
    <div className="se-upload-section">
      <h3 className="se-section-title">Submit Your ERD</h3>
      
      {/* 🚨 NEW: Validation Message Display */}
      {validationMessage && (
        <div className={`se-validation-message ${validationMessage.type}`}>
          {validationMessage.text}
        </div>
      )}
      
      {!selectedFile ? (
        // Upload area when no file selected
        <div 
          className={`se-upload-area ${dragOver ? 'se-drag-over' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="se-upload-icon">📁</div>
          <h4>Upload Your ERD Diagram</h4>
          <p>Drag and drop your image here or click to browse</p>
          
          <p className="upload-hint">
            Supports: PNG, JPEG, GIF, WebP (Max 10MB)
          </p>
          
          <input
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="se-file-input"
            id="erd-file-input"
            disabled={submitted}
          />
          <label 
            htmlFor="erd-file-input" 
            className={`se-browse-btn ${submitted ? 'disabled' : ''}`}
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
              {!submitted && (
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
        placeholder="Any notes about your submission..."
        className="se-comments-textarea"
        rows="4"
        disabled={submitted}
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
      {/* Main content area */}
      <main className="se-main">
        <div className="se-content">
          
          {/* Loading state */}
          {loading ? (
            <div className="se-loading">
              <p>Loading exercise...</p>
            </div>
          ) : (
            <>
              {/* Page header */}
              <div className="se-header">
                <div className="se-header-content">
                  <button onClick={onGoBack} className="se-back-btn">
                    ← Back to Class
                  </button>
                  <h1 className="se-page-title">My Exercises</h1>
                  <p className="se-page-subtitle">View and submit your ERD answers</p>
                </div>
              </div>

              {/* 🎉 SUCCESS MESSAGE - Shows after submission */}
              {submitted && (
                <div className="se-success-banner">
                  <div className="se-success-content">
                    <div className="se-success-icon">✅</div>
                    <div className="se-success-text">
                      <h3>Exercise Submitted Successfully!</h3>
                      <p>Your ERD has been uploaded and submitted for grading.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Exercise details section - NO ANSWER SCHEME LINKS */}
              <div className="se-exercise-card">
                <div className="se-exercise-header">
                  <h2 className="se-exercise-title">
                    {exercise?.title || 'Loading exercise...'}
                  </h2>
                  <p className="se-exercise-subtitle">
                    {exercise?.description || 'Loading description...'}
                  </p>
                </div>

                <div className="se-exercise-content">
                  {/* Left side - Instructions */}
                  <div className="se-instructions-panel">
                    <h3 className="se-panel-title">Exercise Instructions</h3>
                    <div className="se-instructions-content">
                      
                      {/* 📝 REAL DESCRIPTION FROM FIREBASE */}
                      <div className="se-exercise-description">
                        <h4>Description:</h4>
                        <p>{exercise?.description || 'No description available'}</p>
                      </div>

                      {/* 📅 REAL DUE DATE AND MARKS */}
                      <div className="se-due-info">
                        <p><strong>Due Date:</strong> {formatDueDate(exercise?.dueDate)}</p>
                        <p><strong>Total Marks:</strong> {exercise?.totalMarks || 'Not specified'}</p>
                      </div>

                      {/* ✅ REMOVED: Answer scheme and rubric links (no cheating!) */}

                      {/* 💡 SUBMISSION GUIDELINES */}
                      <div className="se-guidelines">
                        <h4>Submission Guidelines:</h4>
                        <ul>
                          <li>Submit PNG, JPEG, GIF, or WebP files</li>
                          <li>Maximum file size: 10MB</li>
                          <li>Keep diagram clear and well-organized</li>
                          <li>Ensure all text is readable</li>
                          <li>High resolution images are preferred</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Submission area */}
                  <div className="se-submission-panel">
                    <FileUploadArea />
                    <CommentsSection />
                    
                    {/* Submit button section */}
                    <div className="se-submit-section">
                      {/* 🔄 UPLOAD STATUS */}
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

                      {/* 📤 SUBMIT BUTTON */}
                      <button
                        onClick={onSubmitExercise}
                        disabled={!selectedFile || uploading || submitted}
                        className={`se-submit-btn ${submitted ? 'submitted' : ''}`}
                      >
                        {submitted ? '✅ Submitted' : 
                         uploading ? 'Uploading...' : 
                         'Submit Exercise'}
                      </button>

                      {/* 🎉 SUBMISSION CONFIRMATION */}
                      {submitted && (
                        <p className="se-submitted-note">
                          Your exercise has been successfully submitted and is ready for grading.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentSubmitClass;