// src/components/class/stud-exercise-filters.jsx
import React from 'react';

const StudExerciseFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter,
  exerciseCount,
  sectionTitle // Add this prop
}) => {
  return (
    <div className="stud-mc-section-header">
      <h2 className="stud-mc-section-title">{sectionTitle}</h2>
      <p className="stud-mc-class-meta-inline">
        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} available
      </p>
      <div className="stud-mc-controls">
        <div className="stud-mc-search-filter">
          <input 
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="stud-mc-search-input"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="stud-mc-status-filter"
          >
            <option value="all">All Status</option>
            <option value="not-started">Not Started</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default StudExerciseFilters;