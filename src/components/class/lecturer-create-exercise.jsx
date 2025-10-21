import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useSearchParams, useNavigate } from 'react-router-dom';


// 🔥 FIREBASE IMPORTS - Only for loading draft data
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🆕 COMPONENT IMPORTS
import UnsavedChangesModal from '../../components/modals/UnsavedChangesModal';
import LectExerciseFormFields from './lect-exercise-form-fields';
import LectFileUploadSection from './lect-file-upload-section';
import LectExerciseTips from './lect-exercise-tips';

// 🆕 CUSTOM HOOKS IMPORTS
import { useUploadHandler } from './lect-upload-handler';
import { useFormSubmission } from './lect-form-submission';

// 🎯 MAIN COMPONENT: This handles the create exercise form logic and UI
const LecturerCreateExercise = ({ onCancel, classId: propClassId, onLogout, onDashboardClick }) => { 
  // Inside component:
  const navigate = useNavigate();
  const { user, getUserDisplayName } = useUser();
  const [searchParams] = useSearchParams(); 
  const classId = propClassId || searchParams.get('classId');
  const urlDraftId = searchParams.get('draftId');
  const [draftId, setDraftId] = useState(urlDraftId);

  // 🛡️ NEW: Ref to prevent double loading
  const isNavigatingToReview = useRef(false);

  const justRejectedERD = useRef(false);

  // 🆕 CUSTOM HOOKS
  const { validateFile, uploadFiles, formatFirebaseStorageData } = useUploadHandler();
  const { validateForm, saveDraft, submitExercise } = useFormSubmission();

  // 📝 STATE MANAGEMENT: These store all form data
  // 🆕 CHANGE #1: Added dueTime field to formData
  // 🔧 CHANGE 1: Update formData state (Line ~45)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '23:59',
    totalMarks: '',
    answerSchemeFile: null,
    rubricText: '' // 🆕 CHANGED: From rubricFile to rubricText
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(Boolean(draftId));
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  
  // 🚨 VALIDATION ERRORS STATE
  const [validationErrors, setValidationErrors] = useState({});

  const [isPublishedExercise, setIsPublishedExercise] = useState(false);
  // 🔧 CHANGE 2: Update originalFileNames state (Line ~54)
  const [originalFileNames, setOriginalFileNames] = useState({
  answerScheme: null,
  rubric: null // Keep this for backward compatibility with existing exercises
  });
  
  // 🆕 NEW: Modal state management
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'save-draft' or 'discard-changes'
  
  // 🔙 NEW: Browser back button detection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);


  const [aiLoadingMessage, setAiLoadingMessage] = useState(null);

  // 🔧 HELPER FUNCTION: Check if form has content (eliminates duplication)
  // 🔧 CHANGE 3: Update checkHasContent function (Line ~75)
 // 🔧 HELPER FUNCTION: Check if form has content (eliminates duplication)
  const checkHasContent = (data = formData) => {
    return data.title?.trim() || 
          data.description?.trim() || 
          data.answerSchemeFile || 
          (data.rubricText && data.rubricText.trim()) || // ✅ FIXED
          data.dueDate ||
          data.totalMarks;
  };

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
      // 🛡️ FIX: Don't load if we just rejected an ERD
      if (justRejectedERD.current) {
        console.log('🛡️ Skipping draft load - just rejected ERD, keeping form data');
        justRejectedERD.current = false; // Reset flag
        return;
      }

      // 🛡️ FIX: Don't load if we're navigating to review page
      if (isNavigatingToReview.current) {
        console.log('🛡️ Skipping draft load - navigating to review');
        return;
      }

      // 🛡️ NEW: Don't reload if already loaded
      if (isDraftLoaded) {
        console.log('🛡️ Skipping draft load - already loaded');
        return;
      }


      if (!draftId || !classId) return;

      try {
        setIsLoading(true);
        console.log('Loading draft exercise:', draftId);
        
        const draftRef = doc(db, 'classes', classId, 'exercises', draftId);
        const draftSnap = await getDoc(draftRef);
        
        if (draftSnap.exists()) {
          const draftData = draftSnap.data();
          console.log('Draft data loaded:', draftData);
          
          // 🆕 CHANGE #2: Parse dueDate to extract date and time
          let dateValue = '';
          let timeValue = '23:59'; // default
          
          if (draftData.dueDate) {
            // If it's a Firestore Timestamp, convert to Date
            const dueDateObj = draftData.dueDate.toDate ? draftData.dueDate.toDate() : new Date(draftData.dueDate);
            
            // Extract date in YYYY-MM-DD format
            dateValue = dueDateObj.toISOString().split('T')[0];
            
            // Extract time in HH:MM format
            const hours = dueDateObj.getHours().toString().padStart(2, '0');
            const minutes = dueDateObj.getMinutes().toString().padStart(2, '0');
            timeValue = `${hours}:${minutes}`;
          }
          
          // 🔧 CHANGE 4: Update loadDraftData useEffect (Line ~145)
          // Inside the setFormData call:
          setFormData({
            title: draftData.title || '',
            description: draftData.description || '',
            dueDate: dateValue,
            dueTime: timeValue,
            totalMarks: draftData.totalMarks?.toString() || '',
            answerSchemeFile: null,
            rubricText: draftData.rubricText || '' // 🆕 CHANGED: Load text instead of file
          });

          setOriginalFileNames({
            answerScheme: draftData.answerScheme?.originalName || null,
            rubric: draftData.rubricText ? 'Text rubric' : null // 🆕 CHANGED: Indicator for existing text
          });
          
          setOriginalFileNames({
            answerScheme: draftData.answerScheme?.originalName || null,
            rubric: draftData.rubric?.originalName || null
          });
          
          setIsEditingDraft(true);
          setIsDraftLoaded(true); // 🛡️ NEW: Mark as loaded
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
  }, [draftId, classId]); // Don't include isDraftLoaded in dependencies

  // 🔙 NEW: Browser back button and page refresh detection
  useEffect(() => {
    const hasContent = checkHasContent();
    setHasUnsavedChanges(hasContent);
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
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [validationErrors]);

  // 🎯 HANDLE INPUT CHANGES: Updates state when user types
  // 🗑️ DELETED: All the console.log debugging code for totalMarks (lines 191-231)
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

    try {
      // 🛡️ VALIDATE FILE USING CUSTOM HOOK
      validateFile(file, fileType);

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
      alert(error.message);
      e.target.value = '';
    }
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

  // 🆕 NEW: Modal handlers
  const handleCancelClick = () => {
    const hasContent = checkHasContent();

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
    setIsLoading(true);
    
    try {
      const result = await saveDraft(
        formData, 
        classId, 
        user, 
        getUserDisplayName, 
        uploadFiles, 
        formatFirebaseStorageData, 
        draftId
      );
      
      if (result.success) {
        alert('Exercise saved as draft! You can continue editing it later.');
        setHasUnsavedChanges(false);
        onCancel();
      } else {
        alert(`Failed to save draft: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to save draft. Changes will be lost.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalDiscardChanges = () => {
    setShowCancelModal(false);
    setHasUnsavedChanges(false);
    onCancel();
  };

  const handleModalCancel = () => {
    setShowCancelModal(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classId) {
      alert('No class selected. Please access this page from a specific class.');
      return;
    }

    const isDraft = Boolean(draftId);
    const errors = validateForm(formData, isPublishedExercise, isDraft);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!user || !user.uid) {
      alert('You must be logged in to create exercises');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 BEFORE SUBMIT - draftId:', draftId);
      const result = await submitExercise(
        formData, 
        classId, 
        user, 
        getUserDisplayName, 
        uploadFiles, 
        formatFirebaseStorageData, 
        draftId,
        setAiLoadingMessage // 🆕 Pass the loading state setter
      );

      // 🆕 HANDLE AI REJECTION: Draft saved but ERD rejected
      if (!result.success && result.savedAsDraft) {
        console.log('⚠️ ERD rejected but saved as draft:', result.exerciseId);
        
        // 🛡️ NEW: Set flag to prevent draft reload
        justRejectedERD.current = true;

        // Update URL to include draftId so next submit will update this draft
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('draftId', result.exerciseId);
        newUrl.searchParams.set('classId', classId);
        window.history.replaceState({}, '', newUrl);
        
        // Update component state
        setIsEditingDraft(true);
        setIsDraftLoaded(true);
        setDraftId(result.exerciseId);
        
        // Show the error message
        alert(result.message);
        setIsLoading(false);
        return;
      }
      
      if (result.success) {
  
        // 🆕 AI REVIEW FLOW: Navigate to review page
        if (result.navigateToReview) {
          const { detectedData, exerciseData, classId, exerciseId } = result.reviewData;
          
          console.log('🚀 Navigating to review page with data');
          
          isNavigatingToReview.current = true;
          
          navigate(`/lecturer/review-erd`, {
            state: result.reviewData, // ✅ Pass everything at once
            replace: true
          });
          return;
        }
        
        // ✅ REGULAR UPDATE (editing active exercise): Just show success & close
        if (result.isUpdate) { // 🆕 Check if it's an update
          alert('Exercise updated successfully!');
        } else {
          alert('Exercise published successfully!');
        }
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          dueTime: '23:59',
          totalMarks: '',
          answerSchemeFile: null,
          rubricFile: null
        });
        
        setHasUnsavedChanges(false);
        
        const answerSchemeInput = document.getElementById('answerScheme');
        const rubricInput = document.getElementById('rubric');
        if (answerSchemeInput) answerSchemeInput.value = '';
        if (rubricInput) rubricInput.value = '';

        onCancel();
      } else {
        if (result.errors) {
          setValidationErrors(result.errors);
          alert('Please check the form for errors.');
        } else {
          alert(`Error: ${result.message || 'Unknown error occurred'}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error creating exercise:', error);
      alert(`Error creating exercise: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
            handleInputChange={handleInputChange} // 🆕 NEW: Pass this prop
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

          {/* 🤖 AI LOADING OVERLAY - Shows when calling AI API */}
          {aiLoadingMessage && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              color: 'white',
              fontSize: '1.2rem',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                marginBottom: '1.5rem',
                fontSize: '3rem',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                🤖
              </div>
              <div style={{ 
                marginBottom: '1rem',
                fontWeight: '500',
                maxWidth: '500px'
              }}>
                {aiLoadingMessage}
              </div>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginTop: '1rem'
              }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.1); opacity: 0.8; }
                }
              `}</style>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LecturerCreateExercise;