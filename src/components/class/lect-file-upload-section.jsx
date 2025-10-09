import React from 'react';

// 📁 FILE UPLOAD SECTION COMPONENT: Handles answer scheme upload + rubric textarea
const LectFileUploadSection = ({ 
  formData, 
  validationErrors, 
  isLoading, 
  isPublishedExercise,
  originalFileNames,
  handleFileUpload,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleInputChange // 🆕 NEW: For textarea
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
              Supported formats: PNG, JPG (Max 1MB)
            </small>
            
            {/* Show newly selected file */}
            {formData.answerSchemeFile && (
              <p className="file-selected">
                ✅ Selected: {formData.answerSchemeFile.name} ({(formData.answerSchemeFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}

            {/* Show original file if no new file is selected */}
            {!formData.answerSchemeFile && originalFileNames?.answerScheme && (
              <p className="file-selected">
                📁 Current file: {originalFileNames.answerScheme}
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

      {/* 🆕 RUBRIC TEXTAREA SECTION */}
      <div className="upload-section">
        <div className="section-header">
          <span className="folder-icon">📋</span>
          <h3 className="section-title">Rubric *</h3>
        </div>
        
        <div className="rubric-textarea-container">
          <textarea
            id="rubricText"
            name="rubricText"
            value={formData.rubricText || ''}
            onChange={handleInputChange}
            placeholder="Enter your grading rubric here...&#10;&#10;Example:&#10;Entities (30 marks): All entities correctly identified&#10;Relationships (30 marks): Correct cardinality and naming&#10;Attributes (20 marks): All attributes properly placed&#10;Keys (20 marks): Primary and foreign keys identified"
            className={`rubric-textarea ${validationErrors.rubricText ? 'error' : ''}`}
            rows="10"
            disabled={isLoading || isPublishedExercise}
          />
          <small className="field-info">
            💡 Enter grading criteria, categories, and point allocations
          </small>
          
          {validationErrors.rubricText && (
            <div className="validation-error">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{validationErrors.rubricText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LectFileUploadSection;