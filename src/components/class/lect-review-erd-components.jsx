// src/components/class/LecturerReviewERDComponent.jsx
import React, { useState } from 'react';
import '../../styles/review-erd.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const LecturerReviewERDComponent = ({ 
  detectedData, 
  answerSchemeUrl, 
  rubricUrl,
  onPublish, 
  onCancel,
  isLoading 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🆕 NEW: Get passed data from navigation
  const passedData = location.state || {};
  const { classId, exerciseId } = passedData;
  
  // Use passed data or props (fallback for existing usage)
  const initialDetectedData = passedData.detectedData || detectedData;
  const initialAnswerScheme = passedData.exerciseData?.answerScheme?.url || answerSchemeUrl;
  const initialRubric = passedData.exerciseData?.rubric?.url || rubricUrl;
  
  const [entities, setEntities] = useState(initialDetectedData.entities || []);
  const [relationships, setRelationships] = useState(initialDetectedData.relationships || []);
  const [attributes, setAttributes] = useState(initialDetectedData.attributes || []);
  const [isPublishing, setIsPublishing] = useState(false); // 🆕 NEW: Local loading state

  const handleEntityTypeChange = (index, newType) => {
    const updated = [...entities];
    updated[index].type = newType;
    setEntities(updated);
  };

  const handleRelationshipCardinalityChange = (index, newCardinality) => {
    const updated = [...relationships];
    updated[index].cardinality = newCardinality;
    setRelationships(updated);
  };

  const handleAttributeTypeChange = (index, newType) => {
    const updated = [...attributes];
    updated[index].type = newType;
    setAttributes(updated);
  };

  // 🆕 NEW: Approve and publish exercise
  const handlePublish = async () => {
    // If old way (using props), use the old callback
    if (onPublish && !classId) {
      onPublish({ entities, relationships, attributes });
      return;
    }

    // 🆕 NEW WAY: Update Firestore directly
    if (!classId || !exerciseId) {
      alert('Missing exercise information. Cannot publish.');
      return;
    }

    try {
      setIsPublishing(true);
      
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      
      // Update exercise with reviewed AI data and set to active
      await updateDoc(exerciseRef, {
        status: 'active',
        aiDetectedData: {
          entities,
          relationships,
          attributes
        },
        approvedAt: serverTimestamp()
      });
      
      alert('Exercise published successfully! Students can now see it.');
      navigate(-1); // Go back to previous page (create exercise page will handle cleanup)
      
    } catch (error) {
      console.error('Error publishing exercise:', error);
      alert('Failed to publish exercise. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // 🆕 NEW: Handle cancel - just go back
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="review-erd-container">
      <h1 className="page-title">Review AI Detection</h1>
      
      <div className="erd-content">
        {/* Left: Answer Scheme Image */}
        <div className="erd-image-section">
          <h2>ERD Answer Scheme</h2>
          <div className="image-display">
            <img src={initialAnswerScheme} alt="ERD Answer Scheme" />
          </div>
          {initialRubric && (
            <>
              <h2>Rubric</h2>
              <div className="pdf-display">
                <embed src={initialRubric} type="application/pdf" width="100%" height="400px" />
              </div>
            </>
          )}
        </div>

        {/* Right: Detected Elements */}
        <div className="detected-elements-section">
          <h2>Detected Elements</h2>
          
          {/* Entities */}
          <div className="element-group">
            <h3>Entities ({entities.length})</h3>
            {entities.map((entity, index) => (
              <div key={index} className="element-item">
                <span className="element-name">{entity.name}</span>
                <select 
                  value={entity.type}
                  onChange={(e) => handleEntityTypeChange(index, e.target.value)}
                  className="type-dropdown"
                >
                  <option value="strong">Strong</option>
                  <option value="weak">Weak</option>
                </select>
              </div>
            ))}
          </div>

          {/* Relationships */}
          <div className="element-group">
            <h3>Relationships ({relationships.length})</h3>
            {relationships.map((rel, index) => (
              <div key={index} className="element-item">
                <span className="element-name">{rel.name}</span>
                <span className="element-detail">{rel.from} → {rel.to}</span>
                <select 
                  value={rel.cardinality}
                  onChange={(e) => handleRelationshipCardinalityChange(index, e.target.value)}
                  className="type-dropdown"
                >
                  <option value="one-to-one">1:1</option>
                  <option value="one-to-many">1:N</option>
                  <option value="many-to-many">M:N</option>
                </select>
              </div>
            ))}
          </div>

          {/* Attributes */}
          <div className="element-group">
            <h3>Attributes ({attributes.length})</h3>
            {attributes.map((attr, index) => (
              <div key={index} className="element-item">
                <span className="element-name">{attr.name}</span>
                <span className="element-detail">({attr.entity})</span>
                <select 
                  value={attr.type}
                  onChange={(e) => handleAttributeTypeChange(index, e.target.value)}
                  className="type-dropdown"
                >
                  <option value="primary_key">Primary Key</option>
                  <option value="foreign_key">Foreign Key</option>
                  <option value="regular">Regular</option>
                  <option value="derived">Derived</option>
                  <option value="multivalued">Multivalued</option>
                </select>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="ce-cancel-btn" 
              onClick={handleCancel}
              disabled={isPublishing || isLoading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="ce-create-btn" 
              onClick={handlePublish}
              disabled={isPublishing || isLoading}
            >
              {(isPublishing || isLoading) ? 'Publishing...' : 'Confirm & Publish Exercise'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerReviewERDComponent;