// src/components/modals/UnsavedChangesModal.jsx
import React from 'react';

const UnsavedChangesModal = ({ 
  isVisible, 
  modalType, 
  onSaveDraft, 
  onDiscardChanges, 
  onCancel,
  isLoading = false
}) => {
  if (!isVisible) return null;

  return (
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
                onClick={onDiscardChanges}
                disabled={isLoading}
              >
                Discard Changes
              </button>
              <button 
                className="ce-modal-btn ce-modal-btn-primary" 
                onClick={onSaveDraft}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </button>
            </>
          ) : (
            <>
              <button 
                className="ce-modal-btn ce-modal-btn-secondary" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Keep Editing
              </button>
              <button 
                className="ce-modal-btn ce-modal-btn-danger" 
                onClick={onDiscardChanges}
                disabled={isLoading}
              >
                Discard Changes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesModal;