import React, { useState } from 'react';
import '../../styles/student-join-class.css';

const StudentJoinClass = () => {
  const [classCode, setClassCode] = useState('');

  const handleJoinClass = () => {
    if (!classCode.trim()) {
      alert('Please enter a class code');
      return;
    }
    // Handle join class logic here
    console.log('Joining class with code:', classCode);
  };

  const handleInputChange = (e) => {
    setClassCode(e.target.value);
  };

  return (
    <div className="join-class-container">
      <div className="join-class-card">
        <div className="graduation-icon">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L1 9L12 15L21 12V17H23V9L12 3Z" fill="#6B73FF"/>
            <path d="M5 13.18V17.18C5 17.96 5.54 18.64 6.3 18.9L12 21L17.7 18.9C18.46 18.64 19 17.96 19 17.18V13.18L12 16L5 13.18Z" fill="#6B73FF"/>
          </svg>
        </div>

        <h2 className="join-class-title">Join Your Class</h2>
        <p className="join-class-description">
          Enter the unique class code from your lecturer to get started.
        </p>

        <div className="form-group">
          <label className="form-label">Class Code</label>
          <input
            type="text"
            className="class-code-input"
            placeholder="ENTER CLASS CODE (E.G., DB301-2025)"
            value={classCode}
            onChange={handleInputChange}
          />
        </div>

        <button className="join-class-btn" onClick={handleJoinClass}>
          Join Class
        </button>

        <div className="help-section">
          <div className="help-icon">ℹ️</div>
          <div className="help-content">
            <strong>Need Help?</strong>
            <p>Class codes are typically provided by your lecturer via email or announced in class. If you don't have a class code, please contact your lecturer.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentJoinClass;