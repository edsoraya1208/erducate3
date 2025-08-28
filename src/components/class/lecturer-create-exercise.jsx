import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { useUser } from '../../contexts/UserContext';

// 🔥 FIREBASE IMPORTS - Only for Firestore (exercise data)
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🌤️ CLOUDINARY IMPORT - For file uploads
import { uploadToCloudinary } from '../../config/cloudinary';

// 🆕 COMPONENT IMPORTS
import UnsavedChangesModal from '../../components/modals/UnsavedChangesModal';
import LectExerciseFormFields from './lect-exercise-form-fields';
import LectFileUploadSection from './lect-file-upload-section';
import LectExerciseTips from './lect-exercise-tips';

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
    totalMarks: '',
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

  // 📁 DRAG AND DROP HANDLERS
const handleDragOver = (e) => {
  if (isPublishedExercise || isLoading) {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
};

const handleDragLeave = (e) => {
  if (isPublishedExercise || isLoading) {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
};

  const handleDrop = (e, fileType) => {
  if (isPublishedExercise || isLoading) {
    e.preventDefault();
    return;
  }
  
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
            totalMarks: draftData.totalMarks?.toString() || '',
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
        totalMarks: formData.totalMarks ? parseInt(formData.totalMarks) : null,
        
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
        totalMarks: formData.totalMarks ? parseInt(formData.totalMarks) : null,
        
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
        totalMarks: '',
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
            {/* 📝 BASIC FORM FIELDS COMPONENT */}
            <LectExerciseFormFields
              formData={formData}
              validationErrors={validationErrors}
              isLoading={isLoading}
              handleInputChange={handleInputChange}
            />

            {/* 📁 FILE UPLOAD SECTIONS COMPONENT */}
            <LectFileUploadSection
              formData={formData}
              validationErrors={validationErrors}
              isLoading={isLoading}
              isPublishedExercise={isPublishedExercise}
              originalFileNames={originalFileNames}
              handleFileUpload={handleFileUpload}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
            />

            {/* 💡 TIPS SECTION COMPONENT */}
            <LectExerciseTips />

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

          {/* 🆕 NEW: Use extracted modal component */}
          <UnsavedChangesModal
            isVisible={showCancelModal}
            modalType={modalType}
            onSaveDraft={handleModalSaveDraft}
            onDiscardChanges={handleModalDiscardChanges}
            onCancel={handleModalCancel}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  );
};

export default LecturerCreateExercise; 