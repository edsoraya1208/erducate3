import React from 'react';

// 📁 FILE UPLOAD SECTION COMPONENT: Handles both answer scheme and rubric uploads
const LectFileUploadSection = ({ 
  formData, 
  validationErrors, 
  isLoading, 
  isPublishedExercise,
  originalFileNames,
  handleFileUpload,
  handleDragOver,
  handleDragLeave,
  handleDrop 
}) => {
  return (
    <div className="upload-sections-container">
      {/* ANSWER SCHEME SECTION */}
      <div className="upload-section">
        <div className="section-header">
          <span className="folder-icon">📁</span>
          <h3 className="section-title">Answer Scheme *</h3>
        </div>
        
        <div 
          className="upload-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'answerSchemeFile')}
        >
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <h4 className="upload-title">Upload Answer Scheme</h4>
            <p className="upload-text">Drag and drop your ERD image here or click to browse</p>
            <input
              type="file"
              id="answerScheme"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'answerSchemeFile')}
              className="file-input"
              disabled={isLoading || isPublishedExercise}
            />
            <button 
              type="button" 
              className="browse-btn"
              onClick={() => document.getElementById('answerScheme').click()}
              disabled={isLoading || isPublishedExercise}
            >
              Browse Files
            </button>
            <small className="file-info">
              Supported formats: PNG, JPG (Max 2MB)
            </small>
            
            {(formData.answerSchemeFile || (isPublishedExercise && originalFileNames.answerScheme)) && (
              <p className="file-selected">
                {formData.answerSchemeFile ? 
                  `✅ Selected: ${formData.answerSchemeFile.name} (${(formData.answerSchemeFile.size / 1024 / 1024).toFixed(2)} MB)` :
                  `📁 Current file: ${originalFileNames.answerScheme}`
                }
              </p>
            )}

            {validationErrors.answerSchemeFile && (
              <div className="validation-error">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{validationErrors.answerSchemeFile}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RUBRIC SECTION */}
      <div className="upload-section">
        <div className="section-header">
          <span className="folder-icon">📋</span>
          <h3 className="section-title">Rubric *</h3>
        </div>
        
        <div 
          className="upload-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'rubricFile')}
        >
          <div className="upload-content">
            <div className="upload-icon">📋</div>
            <h4 className="upload-title">Upload Rubric</h4>
            <p className="upload-text">Drag and drop your PDF rubric here or click to browse</p>
            <input
              type="file"
              id="rubric"
              accept=".pdf"
              onChange={(e) => handleFileUpload(e, 'rubricFile')}
              className="file-input"
              disabled={isLoading || isPublishedExercise}
            />
            <button 
              type="button" 
              className="browse-btn"
              onClick={() => document.getElementById('rubric').click()}
              disabled={isLoading || isPublishedExercise}
            >
              Browse Files
            </button>
            <small className="file-info">
              Supported format: PDF (Max 2MB)
            </small>
            
            {(formData.rubricFile || (isPublishedExercise && originalFileNames.rubric)) && (
              <p className="file-selected">
                {formData.rubricFile ? 
                  `✅ Selected: ${formData.rubricFile.name} (${(formData.rubricFile.size / 1024 / 1024).toFixed(2)} MB)` :
                  `📁 Current file: ${originalFileNames.rubric}`
                }
              </p>
            )}
            
            {validationErrors.rubricFile && (
              <div className="validation-error">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{validationErrors.rubricFile}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectFileUploadSection;