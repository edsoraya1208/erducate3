// src/pages/lecturer/lecturer-create-exercise.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

// ❌ REMOVED: Firebase imports (Page shouldn't touch DB directly)
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../../config/firebase';

import UnsavedChangesModal from '../../components/modals/UnsavedChangesModal';
import LectExerciseFormFields from './lect-exercise-form-fields';
import LectFileUploadSection from './lect-file-upload-section';
import LectExerciseTips from './lect-exercise-tips';

import { useUploadHandler } from './lect-upload-handler';
import { useFormSubmission } from './lect-form-submission';

const LecturerCreateExercise = ({ onCancel, classId: propClassId, onLogout, onDashboardClick }) => { 
  const navigate = useNavigate();
  const { user, getUserDisplayName } = useUser();
  const [searchParams] = useSearchParams(); 
  const classId = propClassId || searchParams.get('classId');
  const urlDraftId = searchParams.get('draftId');
  const [draftId, setDraftId] = useState(urlDraftId);

  const isNavigatingToReview = useRef(false);
  const justRejectedERD = useRef(false);

  const { validateFile, uploadFiles, formatFirebaseStorageData } = useUploadHandler();
  
  // ✅ ADDED: getDraftData from the hook
  const { validateForm, saveDraft, submitExercise, getDraftData } = useFormSubmission();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '23:59',
    totalMarks: '',
    answerSchemeFile: null,
    rubricText: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(Boolean(draftId));
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isPublishedExercise, setIsPublishedExercise] = useState(false);
  const [originalFileNames, setOriginalFileNames] = useState({
    answerScheme: null,
    rubric: null
  });
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [aiLoadingMessage, setAiLoadingMessage] = useState(null);

  const checkHasContent = (data = formData) => {
    return data.title?.trim() || 
          data.description?.trim() || 
          data.answerSchemeFile || 
          (data.rubricText && data.rubricText.trim()) || 
          data.dueDate ||
          data.totalMarks;
  };

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

  // ✅ UPDATED: Load draft data using Service instead of Direct DB call
  useEffect(() => {
    const loadDraftData = async () => {
      if (justRejectedERD.current) {
        console.log('🛡️ Skipping draft load - just rejected ERD, keeping form data');
        justRejectedERD.current = false;
        return;
      }

      if (isNavigatingToReview.current) {
        console.log('🛡️ Skipping draft load - navigating to review');
        return;
      }

      if (isDraftLoaded) {
        console.log('🛡️ Skipping draft load - already loaded');
        return;
      }

      if (!draftId || !classId) return;

      try {
        setIsLoading(true);
        console.log('Loading draft exercise:', draftId);
        
        // 🔄 REPLACED: Direct DB call with Service call
        const draftData = await getDraftData(classId, draftId);
        
        if (draftData) {
          console.log('Draft data loaded:', draftData);
          
          // Date parsing logic (Kept exactly as is to be safe)
          let dateValue = '';
          let timeValue = '23:59';
          
          if (draftData.dueDate) {
            // Note: .toDate() works because the object returned from service is still a Firestore object
            const dueDateObj = draftData.dueDate.toDate ? draftData.dueDate.toDate() : new Date(draftData.dueDate);
            dateValue = dueDateObj.toISOString().split('T')[0];
            const hours = dueDateObj.getHours().toString().padStart(2, '0');
            const minutes = dueDateObj.getMinutes().toString().padStart(2, '0');
            timeValue = `${hours}:${minutes}`;
          }
          
          setFormData({
            title: draftData.title || '',
            description: draftData.description || '',
            dueDate: dateValue,
            dueTime: timeValue,
            totalMarks: draftData.totalMarks?.toString() || '',
            answerSchemeFile: null,
            rubricText: draftData.rubricText || ''
          });

          setOriginalFileNames({
            answerScheme: draftData.answerScheme?.originalName || null,
            rubric: draftData.rubricText ? 'Text rubric' : null
          });
          
          setIsEditingDraft(true);
          setIsDraftLoaded(true);
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
  }, [draftId, classId]); // Removed isDraftLoaded from deps as per original code

  // ... (Keep the rest of the file EXACTLY as it was) ...
  // ... (handleBeforeUnload, handleInputChange, handleFileUpload, scrollToFirstError, modal handlers, handleSubmit, render) ...
  
  // Just for context, I am not pasting the rest of the file to save space, 
  // but YOU MUST KEEP THE REST OF THE CODE BELOW THIS LINE EXACTLY THE SAME.

  // 🔙 NEW: Browser back button and page refresh detection
  useEffect(() => {
    const hasContent = checkHasContent();
    setHasUnsavedChanges(hasContent);
  }, [formData]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateFile(file, fileType);
      setFormData(prev => ({
        ...prev,
        [fileType]: file
      }));
      
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

  const handleCancelClick = () => {
    const hasContent = checkHasContent();

    if (hasContent && !isEditingDraft) {
      setModalType('save-draft');
      setShowCancelModal(true);
    } else if (hasContent && isEditingDraft) {
      setModalType('discard-changes');
      setShowCancelModal(true);
    } else {
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
        setAiLoadingMessage
      );

      // Handle rejection (ERD not valid, etc.)
      if (!result.success && !result.savedAsDraft) {
        console.log('❌ ERD rejected:', result.message);
        
        // Show alert to user
        alert(result.message);
        
        setIsLoading(false);
        onCancel(); 
        return;
      }

      // Handle draft save after failed submission
      if (!result.success && result.savedAsDraft) {
        console.log('⚠️ Submission failed but saved as draft:', result.exerciseId);
        alert(result.message); 
        setIsLoading(false);
        onCancel(); 
        return;
      }
            
      if (result.success) {
        if (result.navigateToReview) {
          const { detectedData, exerciseData, classId, exerciseId } = result.reviewData;
          
          console.log('🚀 Navigating to review page with data');
          
          isNavigatingToReview.current = true;
          
          navigate(`/lecturer/review-erd`, {
            state: result.reviewData,
            replace: true
          });
          return;
        }
        
        if (result.isUpdate) {
          alert('Exercise updated successfully!');
        } else {
          alert('Exercise published successfully!');
        }
        
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          dueTime: '23:59',
          totalMarks: '',
          answerSchemeFile: null,
          rubricText: ''
        });
        
        setHasUnsavedChanges(false);
        
        const answerSchemeInput = document.getElementById('answerScheme');
        if (answerSchemeInput) answerSchemeInput.value = '';

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
              handleInputChange={handleInputChange}
            />

            <LectExerciseTips />

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

          <UnsavedChangesModal
            isVisible={showCancelModal}
            modalType={modalType}
            onSaveDraft={handleModalSaveDraft}
            onDiscardChanges={handleModalDiscardChanges}
            onCancel={handleModalCancel}
            isLoading={isLoading}
          />

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