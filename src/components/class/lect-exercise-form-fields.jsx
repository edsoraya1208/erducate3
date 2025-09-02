import React from 'react';

// 📝 FORM FIELDS COMPONENT: Basic form inputs (title, description, due date, marks)
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

      {/* 📅 DUE DATE & MARKS ROW */}
      <div className="form-row">
        <div className="form-group half-width">
          <label htmlFor="dueDate" className="ce-form-label">Due Date *</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className={`form-input ${validationErrors.dueDate ? 'error' : ''}`}
            disabled={isLoading}
          />
          {validationErrors.dueDate && (
            <div className="validation-error">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{validationErrors.dueDate}</span>
            </div>
          )}
        </div>
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