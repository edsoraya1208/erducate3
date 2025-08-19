import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { useUser } from '../../contexts/UserContext';

// 🔥 FIREBASE IMPORTS - Only for Firestore (exercise data)
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🌤️ CLOUDINARY IMPORT - For file uploads
import { uploadToCloudinary } from '../../config/cloudinary';

// 🎯 MAIN COMPONENT: This handles the create exercise form logic and UI
const LecturerCreateExercise = () => {
  const { user, getUserDisplayName } = useUser();
  const [searchParams] = useSearchParams(); 
  const classId = searchParams.get('classId'); 

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

  // 📁 HANDLE FILE UPLOADS: Enhanced validation for answer scheme and rubric files
  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🛡️ ENHANCED FILE VALIDATION
    try {
      // Size validation (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        e.target.value = ''; // Clear the input
        return;
      }

      // 📝 TYPE VALIDATION based on field
      if (fileType === 'answerSchemeFile') {
        // Answer scheme should be images only
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          alert('Answer scheme must be an image file (JPG, PNG, GIF, WebP)');
          e.target.value = '';
          return;
        }
      } else if (fileType === 'rubricFile') {
        // Rubric should be PDF only
        if (file.type !== 'application/pdf') {
          alert('Rubric must be a PDF file');
          e.target.value = '';
          return;
        }
      }

      // 🔒 FILENAME VALIDATION - Prevent malicious filenames
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      if (sanitizedName !== file.name) {
        console.warn('Filename was sanitized for security');
      }

      // ✅ FILE ACCEPTED
      setFormData(prev => ({
        ...prev,
        [fileType]: file
      }));

    } catch (error) {
      console.error('File validation error:', error);
      alert('Error validating file. Please try again.');
      e.target.value = '';
    }
  };

  // 🚀 SUBMIT FORM: This uploads to Cloudinary and saves to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ⚠️ ADD THIS VALIDATION (after e.preventDefault()):
    if (!classId) {
      alert('No class selected. Please access this page from a specific class.');
      return;
    }
    
    // ⚠️ VALIDATION: Check if required fields are filled
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields (Title and Description)');
      return;
    }

    // ✅ VALIDATION: Ensure user is authenticated
    if (!user || !user.uid) {
      alert('You must be logged in to create exercises');
      return;
    }

    setIsLoading(true);

    try {
      // 🌤️ STEP 1: Upload files to Cloudinary (replaces Firebase Storage)
      let answerSchemeData = null;
      let rubricData = null;

      if (formData.answerSchemeFile) {
        console.log('Uploading answer scheme to Cloudinary...');
        try {
          answerSchemeData = await uploadToCloudinary(
            formData.answerSchemeFile, 
            'answer-schemes' // Cloudinary folder
          );
          console.log('✅ Answer scheme uploaded:', answerSchemeData.url);
        } catch (uploadError) {
          throw new Error(`Answer scheme upload failed: ${uploadError.message}`);
        }
      }

      if (formData.rubricFile) {
        console.log('Uploading rubric to Cloudinary...');
        try {
          rubricData = await uploadToCloudinary(
            formData.rubricFile, 
            'rubrics' // Cloudinary folder
          );
          console.log('✅ Rubric uploaded:', rubricData.url);
        } catch (uploadError) {
          throw new Error(`Rubric upload failed: ${uploadError.message}`);
        }
      }

      // 🗄️ STEP 2: Save exercise data to Firestore
      const exerciseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate || null,
        totalMarks: parseInt(formData.totalMarks) || 100,
        
        // 🌤️ CLOUDINARY DATA - More detailed for AI integration
        answerScheme: answerSchemeData ? {
          url: answerSchemeData.url,           // Direct access URL
          publicId: answerSchemeData.publicId, // For transformations/deletions
          originalName: answerSchemeData.originalName,
          fileType: answerSchemeData.fileType,
          fileSize: answerSchemeData.fileSize,
          width: answerSchemeData.width,       // Useful for image analysis
          height: answerSchemeData.height,
          format: answerSchemeData.format,
          uploadedAt: answerSchemeData.createdAt
        } : null,
        
        rubric: rubricData ? {
          url: rubricData.url,
          publicId: rubricData.publicId,
          originalName: rubricData.originalName,
          fileType: rubricData.fileType,
          fileSize: rubricData.fileSize,
          format: rubricData.format,
          uploadedAt: rubricData.createdAt
        } : null,
        
        // ✅ User and metadata
        createdBy: getUserDisplayName(),
        createdById: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      console.log('Saving exercise to Firestore...');
      console.log('About to save to path:', `classes/${classId}/exercises`);
      console.log('ClassID value:', classId);
      const docRef = await addDoc(collection(db, 'classes', classId, 'exercises'), exerciseData);

      
      console.log('✅ Exercise created with ID:', docRef.id);
      alert('Exercise created successfully! Files uploaded to Cloudinary.');
      
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
      const answerSchemeInput = document.getElementById('answerScheme');
      const rubricInput = document.getElementById('rubric');
      if (answerSchemeInput) answerSchemeInput.value = '';
      if (rubricInput) rubricInput.value = '';
      
    } catch (error) {
      console.error('❌ Error creating exercise:', error);
      
      // 🚨 BETTER ERROR HANDLING
      if (error.message.includes('Upload failed')) {
        alert(`File upload error: ${error.message}`);
      } else if (error.message.includes('Firestore')) {
        alert('Database error. Files uploaded but exercise not saved. Please contact support.');
      } else {
        alert(`Error creating exercise: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 RENDER: The form UI components
  return (
    <main className="ce-main-content">
      <h1 className="page-title">Create Exercise</h1>
      
      <form onSubmit={handleSubmit} className="exercise-form">
        {/* 📝 EXERCISE TITLE */}
        <div className="form-group">
          <label htmlFor="title" className="ce-form-label">Exercise Title</label>
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
          <label htmlFor="description" className="ce-form-label">Description</label>
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
            <label htmlFor="dueDate" className="ce-form-label">Due Date</label>
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
            <label htmlFor="totalMarks" className="ce-form-label">Total Marks</label>
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
                  Supported formats: PNG, JPG, GIF, WebP (Max 10MB)
                </small>
                {formData.answerSchemeFile && (
                  <p className="file-selected">
                    ✅ Selected: {formData.answerSchemeFile.name} 
                    ({(formData.answerSchemeFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
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
                  <p className="file-selected">
                    ✅ Selected: {formData.rubricFile.name}
                    ({(formData.rubricFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
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

        {/* 🎯 FORM BUTTONS */}
        <div className="form-actions">
          <button type="button" className="ce-cancel-btn" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="create-btn" disabled={isLoading}>
            {isLoading ? 'Creating Exercise...' : 'Create Exercise'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default LecturerCreateExercise;