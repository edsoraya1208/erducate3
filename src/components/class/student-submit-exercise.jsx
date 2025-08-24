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

  // 📁 File Upload Component (MINOR UPDATES for better messaging)
  const FileUploadArea = () => (
    <div className="se-upload-section">
      <h3 className="se-section-title">Submit Your ERD</h3>
      
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
          
          {/* 💡 UPDATED: Better file type messaging */}
          <p className="upload-hint">
            Supports: PNG, JPEG, GIF, WebP (Max 10MB)
          </p>
          
          <input
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="se-file-input"
            id="erd-file-input"
          />
          <label htmlFor="erd-file-input" className="se-browse-btn">
            Choose File
          </label>
        </div>
      ) : (
        // Preview area when file is selected (ENHANCED with file info)
        <div className="se-file-preview">
          <div className="se-preview-header">
            <span className="se-file-name">{selectedFile.name}</span>
            <div className="se-file-info">
              {/* ✅ Show file size in a readable format */}
              <span className="se-file-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <button 
                onClick={onRemoveFile}
                className="se-remove-file-btn"
                title="Remove file"
              >
                ×
              </button>
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

  // 💬 Comments Section Component (UNCHANGED)
  const CommentsSection = () => (
    <div className="se-comments-section">
      <h3 className="se-section-title">Additional Comments (Optional)</h3>
      <textarea
        value={additionalComments}
        onChange={(e) => onCommentsChange(e.target.value)}
        placeholder="Any notes about your submission..."
        className="se-comments-textarea"
        rows="4"
      />
    </div>
  );

  return (
    <div className="se-container">
      {/* Main content area */}
      <main className="se-main">
        <div className="se-content">
          
          {/* Loading state (unchanged) */}
          {loading ? (
            <div className="se-loading">
              <p>Loading exercise...</p>
            </div>
          ) : (
            <>
              {/* Page header with exercise title (unchanged) */}
              <div className="se-header">
                <div className="se-header-content">
                  <button onClick={onGoBack} className="se-back-btn">
                    ← Back to Class
                  </button>
                  <h1 className="se-page-title">My Exercises</h1>
                  <p className="se-page-subtitle">View and submit your ERD answers</p>
                </div>
              </div>

              {/* Exercise details section */}
              <div className="se-exercise-card">
                <div className="se-exercise-header">
                  <h2 className="se-exercise-title">
                    {exercise?.title || 'Exercise Title'}
                  </h2>
                  <p className="se-exercise-subtitle">
                    {exercise?.description || 'Create your ERD diagram for submission'}
                  </p>
                </div>

                <div className="se-exercise-content">
                  {/* Left side - Instructions (unchanged) */}
                  <div className="se-instructions-panel">
                    <h3 className="se-panel-title">Exercise Instructions</h3>
                    <div className="se-instructions-content">
                      <p><strong>Objective:</strong> Design an ERD for a university database system.</p>
                      
                      <div className="se-requirements">
                        <h4>Requirements:</h4>
                        <ul>
                          <li>Include entities: Student, Course, Department, Professor</li>
                          <li>Show appropriate relationships between entities</li>
                          <li>Include primary and foreign keys</li>
                          <li>Add relevant attributes to each entity</li>
                        </ul>
                      </div>

                      <div className="se-due-info">
                        <p><strong>Due Date:</strong> {exercise?.dueDate || 'March 15, 2024 at 11:59 PM'}</p>
                        <p><strong>Total Marks:</strong> {exercise?.totalMarks || '20'}</p>
                      </div>

                      {/* 💡 UPDATED: Submission Guidelines with Cloudinary benefits */}
                      <div className="se-guidelines">
                        <h4>Submission Guidelines:</h4>
                        <ul>
                          <li>Submit PNG, JPEG, GIF, or WebP files</li>
                          <li>Maximum file size: 10MB (generous limit!)</li>
                          <li>Keep diagram clear and well-organized</li>
                          <li>Ensure all text is readable</li>
                          <li>High resolution images are preferred</li>
                          <li>Files are optimized automatically for best viewing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Submission area */}
                  <div className="se-submission-panel">
                    <FileUploadArea />
                    <CommentsSection />
                    
                    {/* Submit button with updated messaging */}
                    <div className="se-submit-section">
                      <button
                        onClick={onSubmitExercise}
                        disabled={!selectedFile || uploading}
                        className="se-submit-btn"
                      >
                        {uploading ? 'Uploading to Cloud...' : 'Submit Exercise'}
                      </button>
                      
                      {/* ✅ NEW: Helper text about upload process */}
                      {uploading && (
                        <p className="se-upload-status">
                          📤 Your file is being uploaded to our secure cloud storage...
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