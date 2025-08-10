import React, { useState } from 'react';
import '../../styles/create-exercise.css';

// 🎯 MAIN COMPONENT: This handles the entire create exercise form
const LecturerCreateExercise = () => {
  // 📝 STATE MANAGEMENT: These store all form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalMarks: '100',
    answerSchemeFile: null,
    rubricFile: null
  });

  // 🎯 HANDLE INPUT CHANGES: Updates state when user types
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 📁 HANDLE FILE UPLOADS: For answer scheme and rubric files
  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fileType]: file
      }));
    }
  };

  // 🚀 SUBMIT FORM: This is where you'll connect to Firebase/API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ⚠️ VALIDATION: Check if required fields are filled
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // 🔥 FIREBASE CONNECTION POINT - Replace this section with your Firebase code
      // Example Firebase structure:
      /*
      import { collection, addDoc } from 'firebase/firestore';
      import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
      
      // Upload files to Firebase Storage first
      let answerSchemeURL = null;
      let rubricURL = null;
      
      if (formData.answerSchemeFile) {
        const answerSchemeRef = ref(storage, `answer-schemes/${Date.now()}_${formData.answerSchemeFile.name}`);
        await uploadBytes(answerSchemeRef, formData.answerSchemeFile);
        answerSchemeURL = await getDownloadURL(answerSchemeRef);
      }
      
      if (formData.rubricFile) {
        const rubricRef = ref(storage, `rubrics/${Date.now()}_${formData.rubricFile.name}`);
        await uploadBytes(rubricRef, formData.rubricFile);
        rubricURL = await getDownloadURL(rubricRef);
      }
      
      // Save exercise data to Firestore
      const docRef = await addDoc(collection(db, 'exercises'), {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        totalMarks: parseInt(formData.totalMarks),
        answerSchemeURL: answerSchemeURL,
        rubricURL: rubricURL,
        createdBy: 'Prof. Johnson', // Replace with actual user data
        createdAt: new Date(),
        status: 'active'
      });
      
      console.log('Exercise created with ID: ', docRef.id);
      */
      
      // 🌐 API CONNECTION POINT - Or replace with your API call
      /*
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${yourAuthToken}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          totalMarks: formData.totalMarks,
          // Handle file uploads separately for API
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Exercise created:', result);
      }
      */

      // 💻 FOR NOW: Just log the data (remove this when you add real backend)
      console.log('Form submitted:', formData);
      alert('Exercise created successfully!');
      
      // 🔄 RESET FORM: Clear form after successful submission
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        totalMarks: '100',
        answerSchemeFile: null,
        rubricFile: null
      });
      
    } catch (error) {
      console.error('Error creating exercise:', error);
      alert('Error creating exercise. Please try again.');
    }
  };

  // 🎨 RENDER: The actual UI components
  return (
    <div className="create-exercise-container">
      {/* 🏠 HEADER SECTION */}
      <header className="header">
        <div className="header-left">
          {/* 🎯 LOGO REPLACEMENT POINT: Replace this with your SVG */}
          <div className="logo">
            {/* 
            Replace this div with your SVG logo like this:
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path d="YOUR_SVG_PATH_HERE" fill="#your-color"/>
            </svg>
            */}
            <div className="logo-cube">
              <div className="cube-face cube-front"></div>
              <div className="cube-face cube-back"></div>
              <div className="cube-face cube-right"></div>
              <div className="cube-face cube-left"></div>
              <div className="cube-face cube-top"></div>
              <div className="cube-face cube-bottom"></div>
            </div>
            <span className="logo-text">ERDucate</span>
          </div>
        </div>
        <div className="header-center">
          <nav className="nav-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <span className="nav-link active">Prof. Johnson</span>
          </nav>
        </div>
        <div className="header-right">
          <button className="logout-btn">Logout</button>
        </div>
      </header>

      {/* 📋 MAIN FORM SECTION */}
      <main className="main-content">
        <h1 className="page-title">Create Exercise</h1>
        
        <form onSubmit={handleSubmit} className="exercise-form">
          {/* 📝 EXERCISE TITLE */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">Exercise Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Exercise 3A - University Database"
              className="form-input"
              required
            />
          </div>

          {/* 📄 DESCRIPTION */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide exercise instructions and requirements..."
              className="form-textarea"
              rows="6"
              required
            />
          </div>

          {/* 📅 DUE DATE & MARKS ROW */}
          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="dueDate" className="form-label">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="form-input"
              />
              <small className="form-hint">Allow for late submission</small>
            </div>
            <div className="form-group half-width">
              <label htmlFor="totalMarks" className="form-label">Total Marks</label>
              <input
                type="number"
                id="totalMarks"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleInputChange}
                className="form-input"
                min="1"
              />
            </div>
          </div>

          {/* 📁 ANSWER SCHEME SECTION */}
          <div className="form-section">
            <div className="section-header">
              <span className="folder-icon">📁</span>
              <h3 className="section-title">Answer Scheme</h3>
            </div>
            
            <div className="upload-area">
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
                />
                <button 
                  type="button" 
                  className="browse-btn"
                  onClick={() => document.getElementById('answerScheme').click()}
                >
                  Browse Files
                </button>
                <small className="file-info">
                  Supported formats: PNG, JPG (Max 10MB)
                </small>
                {formData.answerSchemeFile && (
                  <p className="file-selected">Selected: {formData.answerSchemeFile.name}</p>
                )}
              </div>
            </div>

            {/* 💡 ANSWER SCHEME TIPS */}
            <div className="tips-section">
              <div className="tips-header">
                <span className="bulb-icon">💡</span>
                <span className="tips-title">Answer Scheme Tips</span>
              </div>
              <ul className="tips-list">
                <li>Ensure all ERD components are clearly visible</li>
                <li>Use standard ERD notation</li>
                <li>Include all required entities, relationships, and attributes</li>
                <li>High resolution images work best for AI detection</li>
              </ul>
            </div>
          </div>

          {/* 📋 RUBRIC SECTION */}
          <div className="form-section">
            <div className="section-header">
              <span className="folder-icon">📋</span>
              <h3 className="section-title">Rubric</h3>
            </div>
            
            <div className="upload-area">
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
                />
                <button 
                  type="button" 
                  className="browse-btn"
                  onClick={() => document.getElementById('rubric').click()}
                >
                  Browse Files
                </button>
                <small className="file-info">
                  Supported format: PDF (Max 10MB)
                </small>
                {formData.rubricFile && (
                  <p className="file-selected">Selected: {formData.rubricFile.name}</p>
                )}
              </div>
            </div>

            {/* 📋 RUBRIC TIPS */}
            <div className="tips-section rubric-tips">
              <div className="tips-header">
                <span className="tips-icon">📋</span>
                <span className="tips-title">Rubric Tips</span>
              </div>
              <ul className="tips-list">
                <li>Include clear marking criteria and point allocations</li>
                <li>Specify requirements for each component</li>
                <li>Ensure PDF is readable and well-formatted</li>
                <li>Include any specific grading guidelines</li>
              </ul>
            </div>
          </div>

          {/* 🎯 FORM BUTTONS */}
          <div className="form-actions">
            <button type="button" className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="create-btn">
              Create Exercise
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default LecturerCreateExercise;