import React, { useState } from 'react';
import '../../styles/lecturer-shared-header.css';
import '../../styles/create-exercise.css';


// 🔥 FIREBASE IMPORTS - Add these imports
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
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

  // ⏳ LOADING STATE: Show loading during submission
  const [isLoading, setIsLoading] = useState(false);

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
      // Validate file size (10MB limit)
      if (file.size >  2* 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [fileType]: file
      }));
    }
  };

  // 🔥 FIREBASE HELPER FUNCTION: Upload file to Firebase Storage
  const uploadFileToStorage = async (file, folder) => {
    if (!file) return null;
    
    try {
      // Create unique filename with timestamp
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = ref(storage, `${folder}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(fileRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error(`Error uploading ${folder} file:`, error);
      throw error;
    }
  };

  // 🚀 SUBMIT FORM: This connects to Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ⚠️ VALIDATION: Check if required fields are filled
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields (Title and Description)');
      return;
    }

    setIsLoading(true);

    try {
      // 📤 STEP 1: Upload files to Firebase Storage
      let answerSchemeURL = null;
      let rubricURL = null;

      if (formData.answerSchemeFile) {
        console.log('Uploading answer scheme...');
        answerSchemeURL = await uploadFileToStorage(formData.answerSchemeFile, 'answer-schemes');
      }

      if (formData.rubricFile) {
        console.log('Uploading rubric...');
        rubricURL = await uploadFileToStorage(formData.rubricFile, 'rubrics');
      }

      // 🗄️ STEP 2: Save exercise data to Firestore
      const exerciseData = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate || null,
        totalMarks: parseInt(formData.totalMarks),
        answerSchemeURL: answerSchemeURL,
        answerSchemeFileName: formData.answerSchemeFile?.name || null,
        rubricURL: rubricURL,
        rubricFileName: formData.rubricFile?.name || null,
        createdBy: 'Prof. Johnson', // 🔄 TODO: Replace with actual logged-in user
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      console.log('Saving exercise to Firestore...');
      const docRef = await addDoc(collection(db, 'exercises'), exerciseData);
      
      console.log('✅ Exercise created with ID:', docRef.id);
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
      
      // Clear file inputs
      document.getElementById('answerScheme').value = '';
      document.getElementById('rubric').value = '';
      
    } catch (error) {
      console.error('❌ Error creating exercise:', error);
      alert('Error creating exercise. Please check the console and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 RENDER: The actual UI components
  return (
    <div className="create-exercise-container">
      {/* 🏠 HEADER SECTION */}
      <header className="dashboard-header">
        <div className="header-left">
          {/* 🎨 LOGO AND BRAND SECTION */}
          <div className="logo-container">
            <div className="logo-icon">
              <img 
                src="/logo.svg" 
                alt="ERDucate Logo" 
                className="custom-logo"
              />
            </div>
            {/* Brand name with consistent styling */}
            <span className="brand-name">ERDucate</span>
          </div>
        </div>
        
        <div className="header-right">
          <nav className="nav-items">
            <span className="nav-item">Dashboard</span>  {/* Changed from <a> to <span> */}
            <span className="nav-item active">Prof. Johnson</span>
            <button className="logout-btn">Logout</button>
          </nav>
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                disabled={isLoading}
              />
             
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
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 📁 UPLOAD SECTIONS - 2 COLUMN LAYOUT */}
          <div className="upload-sections-container">
            {/* ANSWER SCHEME SECTION */}
            <div className="upload-section">
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
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="browse-btn"
                    onClick={() => document.getElementById('answerScheme').click()}
                    disabled={isLoading}
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
            </div>

            {/* RUBRIC SECTION */}
            <div className="upload-section">
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
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="browse-btn"
                    onClick={() => document.getElementById('rubric').click()}
                    disabled={isLoading}
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
            </div>
          </div>

          {/* 💡 TIPS ROW - 2 COLUMN LAYOUT */}
          <div className="tips-row">
            {/* ANSWER SCHEME TIPS */}
            <div className="tips-section">
              <div className="tips-header">
                <span className="bulb-icon">💡</span>
                <span className="tips-title">Answer Scheme Tips</span>
              </div>
              <ul className="tips-list">
                <li>Ensure all ERD components are clearly visible</li>
                <li>Use Crow's Foot notation</li>
                <li>Include all required entities, relationships, and attributes</li>
                <li>High resolution images work best for AI detection</li>
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
                <li>Specify requirements for each component</li>
                <li>Ensure PDF is readable and well-formatted</li>
                <li>Include any specific grading guidelines</li>
              </ul>
            </div>
          </div>

          {/* 🎯 FORM BUTTONS */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="create-btn" disabled={isLoading}>
              {isLoading ? 'Creating Exercise...' : 'Create Exercise'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default LecturerCreateExercise;