import React from 'react';

// 💡 TIPS SECTION COMPONENT: Helpful tips for answer scheme and rubric
const LectExerciseTips = () => {
  return (
    <div className="tips-row">
      {/* ANSWER SCHEME TIPS */}
      <div className="tips-section">
        <div className="tips-header">
          <span className="bulb-icon">💡</span>
          <span className="tips-title">Answer Scheme Tips</span>
        </div>
        <ul className="tips-list">
          <li>Ensure all ERD components are clearly visible</li>
          <li>Use Crow's Foot notation for consistency</li>
          <li>Include all required entities, relationships, and attributes</li>
          <li>High resolution images (1080p+) work best for AI analysis</li>
          <li>Avoid shadows, glare, or tilted angles</li>
        </ul>
      </div>

      {/* RUBRIC TIPS */}
      <div className="tips-section rubric-tips">
        <div className="tips-header">
          <span className="tips-icon">📋</span>
          <span className="tips-title">Rubric Tips</span>
        </div>
        <ul className="tips-list">
          <li>Include clear marking criteria and point allocations</li>
          <li>Specify requirements for each ERD component</li>
          <li>Ensure PDF is readable and well-formatted</li>
          <li>Include specific grading guidelines for AI processing</li>
          <li>Use consistent terminology throughout</li>
        </ul>
      </div>
    </div>
  );
};

export default LectExerciseTips;