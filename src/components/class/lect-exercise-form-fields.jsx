// 🆕 CHANGE: Added time picker functionality to due date section
import React from 'react';

const LectExerciseFormFields = ({ 
  formData, 
  validationErrors, 
  isLoading, 
  handleInputChange 
}) => {
  return (
    <>
      {/* 📝 EXERCISE TITLE */}
      <div className="form-group">
        <label htmlFor="title" className="ce-form-label">Exercise Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="e.g., Exercise 3A - University Database"
          className={`form-input ${validationErrors.title ? 'error' : ''}`}
          disabled={isLoading}
        />
        {validationErrors.title && (
          <div className="validation-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{validationErrors.title}</span>
          </div>
        )}
      </div>

      {/* 📄 DESCRIPTION */}
      <div className="form-group">
        <label htmlFor="description" className="ce-form-label">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Provide some description for your exercise..."
          className={`form-textarea ${validationErrors.description ? 'error' : ''}`}
          rows="6"
          disabled={isLoading}
        />
        {validationErrors.description && (
          <div className="validation-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{validationErrors.description}</span>
          </div>
        )}
      </div>

      {/* 📅 DUE DATE & TIME + MARKS ROW */}
      {/* 🆕 CHANGE: Date & Time grouped together on left, Total Marks on right */}
      <div className="form-row">
        {/* 🎯 LEFT SIDE: Date and Time together */}
        <div className="form-group half-width">
          <label className="ce-form-label">Due Date & Time *</label>
          <div className="datetime-inputs">
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.dueDate ? 'error' : ''}`}
              disabled={isLoading}
            />
            <input
              type="time"
              id="dueTime"
              name="dueTime"
              value={formData.dueTime}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.dueTime ? 'error' : ''}`}
              disabled={isLoading}
            />
          </div>
          {(validationErrors.dueDate || validationErrors.dueTime) && (
            <div className="validation-error">
              <span className="error-icon">⚠️</span>
              <span className="error-message">
                {validationErrors.dueDate || validationErrors.dueTime}
              </span>
            </div>
          )}
          <p className="field-info" style={{ marginTop: '4px', fontSize: '0.85rem', color: '#666' }}>
            ⏰ Default time: 11:59 PM (end of day)
          </p>
        </div>

        {/* 🎯 RIGHT SIDE: Total Marks (matches Rubric width) */}
        <div className="form-group half-width">
          <label htmlFor="totalMarks" className="ce-form-label">Total Marks *</label>
          <input
            type="number"
            id="totalMarks"
            name="totalMarks"
            value={formData.totalMarks}
            onChange={handleInputChange}
            className={`form-input ${validationErrors.totalMarks ? 'error' : ''}`}
            min="1"
            placeholder="e.g., 100"
            disabled={isLoading}
          />
          {validationErrors.totalMarks && (
            <div className="validation-error">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{validationErrors.totalMarks}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LectExerciseFormFields;