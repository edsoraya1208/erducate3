import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { useUser } from '../../contexts/UserContext';

// 🔥 FIREBASE IMPORTS - Only for Firestore (exercise data)
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🌤️ CLOUDINARY IMPORT - For file uploads
import { uploadToCloudinary } from '../../config/cloudinary';

// 🎯 MAIN COMPONENT: This handles the create exercise form logic and UI
const LecturerCreateExercise = ({ onCancel, classId: propClassId, onLogout, onDashboardClick }) => { 
  const { user, getUserDisplayName } = useUser();
  const [searchParams] = useSearchParams(); 
  const classId = propClassId || searchParams.get('classId');
  const draftId = searchParams.get('draftId'); 

  // 📝 STATE MANAGEMENT: These store all form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalMarks: '100',
    answerSchemeFile: null,
    rubricFile: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(Boolean(draftId));
  
  // 🚨 VALIDATION ERRORS STATE
  const [validationErrors, setValidationErrors] = useState({});

  const [isPublishedExercise, setIsPublishedExercise] = useState(false);
  const [originalFileNames, setOriginalFileNames] = useState({
    answerScheme: null,
    rubric: null
  });
  
  // 🆕 NEW: Modal state management
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'save-draft' or 'discard-changes'
  
  // 🔙 NEW: Browser back button detection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, fileType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFileUpload(fakeEvent, fileType);
    }
  };

  // 🆕 NEW: Load draft data when draftId exists
  useEffect(() => {
    const loadDraftData = async () => {
      if (!draftId || !classId) return;

      try {
        setIsLoading(true);
        console.log('Loading draft exercise:', draftId);
        
        const draftRef = doc(db, 'classes', classId, 'exercises', draftId);
        const draftSnap = await getDoc(draftRef);
        
        if (draftSnap.exists()) {
          const draftData = draftSnap.data();
          console.log('Draft data loaded:', draftData);
          
          setFormData({
            title: draftData.title || '',
            description: draftData.description || '',
            dueDate: draftData.dueDate || '',
            totalMarks: draftData.totalMarks?.toString() || '100',
            answerSchemeFile: null,
            rubricFile: null,
          });
          
          setOriginalFileNames({
            answerScheme: draftData.answerScheme?.originalName || null,
            rubric: draftData.rubric?.originalName || null
          });
          
          setIsEditingDraft(true);
          console.log('✅ Draft loaded successfully');

          setIsPublishedExercise(draftData.status === 'active');
          
        } else {
          console.warn('Draft not found');
          alert('Draft exercise not found. Starting with empty form.');
        }
      } catch (error) {
        console.error('Error loading draft:', error);
        alert('Failed to load draft. Starting with empty form.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDraftData();
  }, [draftId, classId]);

  // 🔙 NEW: Browser back button and page refresh detection
  useEffect(() => {
    const checkUnsavedChanges = () => {
      const hasContent = formData.title.trim() || 
                        formData.description.trim() || 
                        formData.answerSchemeFile || 
                        formData.rubricFile ||
                        formData.dueDate;
      setHasUnsavedChanges(hasContent);
    };

    checkUnsavedChanges();
  }, [formData]);

  // 🔙 NEW: Handle browser back/refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handlePopState = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Push current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        // Show our custom modal
        setModalType(isEditingDraft ? 'discard-changes' : 'save-draft');
        setShowCancelModal(true);
      }
    };

    // Add current state to history stack for back button detection
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, isEditingDraft]);

  useEffect(() => {
  if (Object.keys(validationErrors).length > 0) {
    const timer = setTimeout(() => {
      scrollToFirstError();
    }, 100); // Small delay to ensure DOM is updated
    
    return () => clearTimeout(timer);
  }
}, [validationErrors]);

  // 🎯 HANDLE INPUT CHANGES: Updates state when user types
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
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
      
      // Clear validation error when file is selected
      if (validationErrors[fileType]) {
        setValidationErrors(prev => ({
          ...prev,
          [fileType]: null
        }));
      }

    } catch (error) {
      console.error('File validation error:', error);
      alert('Error validating file. Please try again.');
      e.target.value = '';
    }
  };

  // 🆕 NEW: Custom validation function
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Please fill out this field.';
    }
    if (!formData.description.trim()) {
      errors.description = 'Please fill out this field.';
    }
    if (!formData.totalMarks || formData.totalMarks <= 0) {
      errors.totalMarks = 'Please fill out this field.';
    }
    if (!formData.answerSchemeFile && !isPublishedExercise) {
      errors.answerSchemeFile = 'Please fill out this field.';
    }
    if (!formData.rubricFile && !isPublishedExercise) {
      errors.rubricFile = 'Please fill out this field.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 🆕 NEW: Save as draft function
  const saveDraft = async () => {
    // Only save if there's meaningful content
    if (!formData.title.trim() && !formData.description.trim()) {
      console.log('No content to save as draft');
      return false;
    }

    if (!classId || !user?.uid) {
      console.warn('Cannot save draft: missing classId or user');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('Saving draft exercise...');

      // 🌤️ Upload files if they exist (same as regular submit but mark as draft)
      let answerSchemeData = null;
      let rubricData = null;

      if (formData.answerSchemeFile) {
        console.log('Uploading answer scheme for draft...');
        answerSchemeData = await uploadToCloudinary(
          formData.answerSchemeFile, 
          'answer-schemes'
        );
      }

      if (formData.rubricFile) {
        console.log('Uploading rubric for draft...');
        rubricData = await uploadToCloudinary(
          formData.rubricFile, 
          'rubrics'
        );
      }

      // 📝 Create draft exercise data
      const draftData = {
        title: formData.title.trim() || 'Untitled Exercise',
        description: formData.description.trim() || '',
        dueDate: formData.dueDate || null,
        totalMarks: parseInt(formData.totalMarks) || 100,
        
        answerScheme: answerSchemeData ? {
          url: answerSchemeData.url,
          publicId: answerSchemeData.publicId,
          originalName: answerSchemeData.originalName,
          fileType: answerSchemeData.fileType,
          fileSize: answerSchemeData.fileSize,
          width: answerSchemeData.width,
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
        
        createdBy: getUserDisplayName(),
        createdById: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'draft' // 🆕 KEY DIFFERENCE: Mark as draft
      };

      // Save to Firestore
      let docRef;
      if (draftId) {
        // Update existing draft
        const existingDraftRef = doc(db, 'classes', classId, 'exercises', draftId);
        await updateDoc(existingDraftRef, draftData);
        docRef = { id: draftId };
      } else {
        // Create new draft
        docRef = await addDoc(collection(db, 'classes', classId, 'exercises'), draftData);
      }
      console.log('✅ Draft saved with ID:', docRef.id);
      
      return true; // Success
      
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      alert('Failed to save draft. Changes will be lost.');
      return false; // Failed
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 NEW: Modal handlers
  const handleCancelClick = () => {
    const hasContent = formData.title.trim() || 
                      formData.description.trim() || 
                      formData.answerSchemeFile || 
                      formData.rubricFile ||
                      formData.dueDate;

    if (hasContent && !isEditingDraft) {
      setModalType('save-draft');
      setShowCancelModal(true);
    } else if (hasContent && isEditingDraft) {
      setModalType('discard-changes');
      setShowCancelModal(true);
    } else {
      // No content to save, just cancel
      onCancel();
    }
  };

  const handleModalSaveDraft = async () => {
    setShowCancelModal(false);
    const saved = await saveDraft();
    if (saved) {
      alert('Exercise saved as draft! You can continue editing it later.');
    }
    setHasUnsavedChanges(false); // Clear the unsaved changes flag
    onCancel();
  };

  const handleModalDiscardChanges = () => {
    setShowCancelModal(false);
    setHasUnsavedChanges(false); // Clear the unsaved changes flag
    onCancel();
  };

  const handleModalCancel = () => {
    setShowCancelModal(false);
  };

  const scrollToFirstError = () => {
    const firstError = document.querySelector('.validation-error');
    if (firstError) {
      firstError.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };
  
  // 🚀 SUBMIT FORM: This uploads to Cloudinary and saves to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

  if (!classId) {
  alert('No class selected. Please access this page from a specific class.');
  return;
}

// ⚠️ VALIDATION: Use custom validation instead of HTML5 validation
if (!validateForm()) {
  return; // The useEffect will handle scrolling when validationErrors is set
}

    // ✅ VALIDATION: Ensure user is authenticated
    if (!user || !user.uid) {
      alert('You must be logged in to create exercises');
      return;
    }

    setIsLoading(true);

    try {
      // 🌤️ STEP 1: Upload files to Cloudinary
      let answerSchemeData = null;
      let rubricData = null;

      if (formData.answerSchemeFile) {
        console.log('Uploading answer scheme to Cloudinary...');
        try {
          answerSchemeData = await uploadToCloudinary(
            formData.answerSchemeFile, 
            'answer-schemes'
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
            'rubrics'
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
          url: answerSchemeData.url,           
          publicId: answerSchemeData.publicId, 
          originalName: answerSchemeData.originalName,
          fileType: answerSchemeData.fileType,
          fileSize: answerSchemeData.fileSize,
          width: answerSchemeData.width,       
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
        updatedAt: serverTimestamp(),
        status: 'active' // Keep as active for regular submit
      };

      console.log('Saving exercise to Firestore...');
      console.log('About to save to path:', `classes/${classId}/exercises`);
      console.log('ClassID value:', classId);
      
      let docRef;
      if (draftId) {
        // Update existing draft
        const existingDraftRef = doc(db, 'classes', classId, 'exercises', draftId);
        await updateDoc(existingDraftRef, exerciseData);
        docRef = { id: draftId };
      } else {
        // Create new exercise
        exerciseData.createdAt = serverTimestamp();
        docRef = await addDoc(collection(db, 'classes', classId, 'exercises'), exerciseData);
      }
      
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
      
      setHasUnsavedChanges(false); // Clear the unsaved changes flag
      
      // Clear file inputs
      const answerSchemeInput = document.getElementById('answerScheme');
      const rubricInput = document.getElementById('rubric');
      if (answerSchemeInput) answerSchemeInput.value = '';
      if (rubricInput) rubricInput.value = '';

      // Navigate back after successful creation
      onCancel();
      
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

  if (isLoading && draftId) {
    return (
      <div className="page-container">
        <main className="ce-main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading draft exercise...</p>
          </div>
        </main>
      </div>
    );
  }

  // 🎨 RENDER: The form UI components
  return (
    <div className="lecturer-dashboard">
      <div className="page-container">
        <main className="ce-main-content">
          <h1 className="page-title">
            {isPublishedExercise ? 'Edit Exercise' : 
            draftId ? 'Edit Draft Exercise' : 'Create Exercise'}
          </h1>
          
          {isPublishedExercise && (
            <div className="published-exercise-notice">
              <span className="info-icon">ℹ️</span>
              <span>Editing published exercise. Answer scheme and rubric cannot be modified.</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="exercise-form" noValidate>
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
                <label htmlFor="totalMarks" className="ce-form-label">Total Marks *</label>
                <input
                  type="number"
                  id="totalMarks"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  className={`form-input ${validationErrors.totalMarks ? 'error' : ''}`}
                  min="1"
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

            {/* 📁 UPLOAD SECTIONS - 2 COLUMN LAYOUT (CLEANED UP) */}
            <div className="upload-sections-container">
              {/* ANSWER SCHEME SECTION */}
              <div className="upload-section">
                <div className="section-header">
                  <span className="folder-icon">📁</span>
                  <h3 className="section-title">Answer Scheme *</h3>
                </div>
                
                <div 
                  className="upload-area"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'answerSchemeFile')}
                >
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
                      disabled={isLoading || isPublishedExercise}
                    />
                    <button 
                      type="button" 
                      className="browse-btn"
                      onClick={() => document.getElementById('answerScheme').click()}
                      disabled={isLoading || isPublishedExercise}
                    >
                      Browse Files
                    </button>
                    <small className="file-info">
                      Supported formats: PNG, JPG, GIF, WebP (Max 10MB)
                    </small>
                    
                    {(formData.answerSchemeFile || (isPublishedExercise && originalFileNames.answerScheme)) && (
                      <p className="file-selected">
                        {formData.answerSchemeFile ? 
                          `✅ Selected: ${formData.answerSchemeFile.name} (${(formData.answerSchemeFile.size / 1024 / 1024).toFixed(2)} MB)` :
                          `📁 Current file: ${originalFileNames.answerScheme}`
                        }
                      </p>
                    )}

                    {validationErrors.answerSchemeFile && (
                      <div className="validation-error">
                        <span className="error-icon">⚠️</span>
                        <span className="error-message">{validationErrors.answerSchemeFile}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RUBRIC SECTION */}
              <div className="upload-section">
                <div className="section-header">
                  <span className="folder-icon">📋</span>
                  <h3 className="section-title">Rubric *</h3>
                </div>
                
                <div 
                  className="upload-area"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'rubricFile')}
                >
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
                      disabled={isLoading || isPublishedExercise}
                    />
                    <button 
                      type="button" 
                      className="browse-btn"
                      onClick={() => document.getElementById('rubric').click()}
                      disabled={isLoading || isPublishedExercise}
                    >
                      Browse Files
                    </button>
                    <small className="file-info">
                      Supported format: PDF (Max 10MB)
                    </small>
                    
                    {(formData.rubricFile || (isPublishedExercise && originalFileNames.rubric)) && (
                      <p className="file-selected">
                        {formData.rubricFile ? 
                          `✅ Selected: ${formData.rubricFile.name} (${(formData.rubricFile.size / 1024 / 1024).toFixed(2)} MB)` :
                          `📁 Current file: ${originalFileNames.rubric}`
                        }
                      </p>
                    )}
                    
                    {validationErrors.rubricFile && (
                      <div className="validation-error">
                        <span className="error-icon">⚠️</span>
                        <span className="error-message">{validationErrors.rubricFile}</span>
                      </div>
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
              <button 
                type="button" 
                className="ce-cancel-btn" 
                disabled={isLoading}
                onClick={handleCancelClick}
              >
                Cancel
              </button>
              <button type="submit" className="ce-create-btn" disabled={isLoading}>
                {isLoading ? 
                  (draftId ? 'Updating Exercise...' : 'Creating Exercise...') : 
                  (draftId ? 'Update & Publish' : 'Create Exercise')
                }
              </button>
            </div>
          </form>

          {/* 🆕 NEW: Custom Modal Overlay */}
          {showCancelModal && (
            <div className="ce-modal-overlay">
              <div className="ce-modal">
                <div className="ce-modal-header">
                  <h3 className="ce-modal-title">
                    {modalType === 'save-draft' ? 'Save Draft?' : 'Discard Changes?'}
                  </h3>
                </div>
                
                <div className="ce-modal-body">
                  {modalType === 'save-draft' ? (
                    <p>You have unsaved changes. Would you like to save this as a draft?</p>
                  ) : (
                    <p>You have unsaved changes to this draft. Are you sure you want to discard them?</p>
                  )}
                </div>
                
                <div className="ce-modal-actions">
                  {modalType === 'save-draft' ? (
                    <>
                      <button 
                        className="ce-modal-btn ce-modal-btn-secondary" 
                        onClick={handleModalDiscardChanges}
                      >
                        Discard Changes
                      </button>
                      <button 
                        className="ce-modal-btn ce-modal-btn-primary" 
                        onClick={handleModalSaveDraft}
                      >
                        Save as Draft
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="ce-modal-btn ce-modal-btn-secondary" 
                        onClick={handleModalCancel}
                      >
                        Keep Editing
                      </button>
                      <button 
                        className="ce-modal-btn ce-modal-btn-danger" 
                        onClick={handleModalDiscardChanges}
                      >
                        Discard Changes
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LecturerCreateExercise;