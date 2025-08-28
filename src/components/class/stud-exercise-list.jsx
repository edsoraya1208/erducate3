// src/components/class/stud-exercise-list.jsx
import React from 'react';
import StudExerciseCard from './stud-exercise-card';

const StudExerciseList = ({ 
  exercises, 
  loading, 
  showClassName = false,
  onStartExercise,
  onEditSubmission,
  onViewResults 
}) => {
  if (loading) {
    return (
      <div className="stud-mc-exercises-grid">
        <div className="stud-mc-loading" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          fontSize: '16px',
          color: '#666'
        }}>
          Loading exercises...
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="stud-mc-empty-state">
        <div className="stud-mc-empty-content">
          <div className="stud-mc-empty-icon">📝</div>
          <h3>No exercises available</h3>
          <p>No exercises available{showClassName ? '' : ' for this class'}. Make sure you're enrolled in a class.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stud-mc-exercises-grid">
      {exercises.map((exercise) => (
        <StudExerciseCard
          key={`${exercise.classId}-${exercise.id}`}
          exercise={exercise}
          showClassName={showClassName}
          onStartExercise={onStartExercise}
          onEditSubmission={onEditSubmission}
          onViewResults={onViewResults}
        />
      ))}
    </div>
  );
};

export default StudExerciseList;