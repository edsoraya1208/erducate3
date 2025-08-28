// src/components/class/stud-exercise-card.jsx
import React from 'react';

const StudExerciseCard = ({ 
  exercise, 
  showClassName = false,
  onStartExercise,
  onEditSubmission,
  onViewResults 
}) => {
  const getStatusBadge = (exercise) => {
    if (exercise.isCompleted || exercise.isSubmitted) {
      return { text: 'COMPLETED', class: 'stud-mc-status-graded' };
    } else {
      return { text: 'NOT STARTED', class: 'stud-mc-status-not-submitted' };
    }
  };

  const getEditButtonState = (exercise) => {
    const isSubmitted = exercise.isSubmitted || exercise.isCompleted;
    const progress = exercise.progress;
    
    if (!isSubmitted) {
      return { show: false };
    }
    
    // Check if graded by lecturer
    const isGraded = progress && (
      progress.score !== undefined && progress.score !== null ||
      progress.status === 'graded' ||
      progress.isGraded === true
    );
    
    if (isGraded) {
      return {
        show: true,
        enabled: false,
        text: 'Edit Disabled',
        class: 'stud-mc-btn-edit-disabled',
        tooltip: 'Cannot edit - Exercise has been graded'
      };
    }
    
    // Check edit count (default to 0 if not set)
    const editCount = progress?.editCount || 0;
    const maxEdits = progress?.maxEdits || 2;
    
    if (editCount >= maxEdits) {
      return {
        show: true,
        enabled: false,
        text: 'Edit Disabled',
        class: 'stud-mc-btn-edit-disabled',
        tooltip: 'Edit limit reached (2 edits used)'
      };
    }
    
    const editsLeft = maxEdits - editCount;
    const buttonText = editsLeft === maxEdits ? 'Edit Submission' : `Edit Submission (${editsLeft} left)`;
    const buttonClass = editsLeft === 1 ? 'stud-mc-btn-edit-warning' : 'stud-mc-btn-edit';
    
    return {
      show: true,
      enabled: true,
      text: buttonText,
      class: buttonClass
    };
  };

  const getViewResultsButtonState = (exercise) => {
    const isSubmitted = exercise.isSubmitted || exercise.isCompleted;
    
    if (!isSubmitted) {
      return { show: false };
    }
    
    if (!exercise.resultsReady) {
      return {
        show: true,
        enabled: false,
        text: 'View Results',
        class: 'stud-mc-btn-results-disabled',
        tooltip: 'Results are not ready yet - Exercise not graded'
      };
    }
    
    return {
      show: true,
      enabled: true,
      text: 'View Results',
      class: 'stud-mc-btn-results'
    };
  };

  const getActionButton = (exercise) => {
    if (!exercise.isCompleted && !exercise.isSubmitted) {
      return {
        text: 'Start Exercise',
        class: 'stud-mc-btn-start',
        action: () => onStartExercise(exercise.classId, exercise.id)
      };
    }
    return null;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No due date';
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getScore = (exercise) => {
    if (exercise.progress && exercise.progress.score !== undefined) {
      return `${exercise.progress.score}/${exercise.totalMarks || 100}`;
    }
    return null;
  };

  const status = getStatusBadge(exercise);
  const actionButton = getActionButton(exercise);
  const editButton = getEditButtonState(exercise);
  const viewResultsButton = getViewResultsButtonState(exercise);
  const score = getScore(exercise);

  return (
    <div className="stud-mc-exercise-card">
      <div className="stud-mc-card-header">
        <div>
          <h3 className="stud-mc-exercise-title">{exercise.title}</h3>
          {showClassName && <p className="stud-mc-class-name">{exercise.className}</p>}
        </div>
        <span className={`stud-mc-status-badge ${status.class}`}>
          {status.text}
        </span>
      </div>
      
      <div className="stud-mc-card-content">
        <div className="stud-mc-exercise-info">
          <p className="stud-mc-due-date">
            Due: {formatDate(exercise.dueDate)} • {exercise.totalMarks || 100} marks
          </p>
          {score && (
            <p className="stud-mc-grade">Score: {score}</p>
          )}
        </div>
        
        <div className="stud-mc-card-actions">
          {/* Show Start Exercise button only for non-submitted exercises */}
          {actionButton && (
            <button 
              className={`stud-mc-action-btn ${actionButton.class}`}
              onClick={actionButton.action}
            >
              {actionButton.text}
            </button>
          )}
          
          {/* Show Edit and View Results buttons for submitted exercises */}
          {(editButton.show || viewResultsButton.show) && (
            <div className="stud-mc-submitted-actions">
              {/* Edit Submission Button */}
              {editButton.show && (
                <button 
                  className={`stud-mc-action-btn ${editButton.class}`}
                  onClick={editButton.enabled ? () => onEditSubmission(exercise.classId, exercise.id) : undefined}
                  disabled={!editButton.enabled}
                >
                  {editButton.text}
                </button>
              )}
              
              {/* View Results Button */}
              {viewResultsButton.show && (
                <button 
                  className={`stud-mc-action-btn ${viewResultsButton.class}`}
                  onClick={viewResultsButton.enabled ? () => onViewResults(exercise.classId, exercise.id) : undefined}
                  disabled={!viewResultsButton.enabled}
                  title={viewResultsButton.tooltip || ''}
                >
                  {viewResultsButton.text}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudExerciseCard;