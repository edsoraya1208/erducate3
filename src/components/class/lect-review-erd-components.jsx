// src/components/class/LecturerReviewERDComponent.jsx
import React, { useState } from 'react';
import '../../styles/review-erd.css';

const LecturerReviewERDComponent = ({ 
  detectedData, 
  answerSchemeUrl, 
  rubricUrl,
  onPublish, 
  onCancel,
  isLoading 
}) => {
  const [entities, setEntities] = useState(detectedData.entities || []);
  const [relationships, setRelationships] = useState(detectedData.relationships || []);
  const [attributes, setAttributes] = useState(detectedData.attributes || []);

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

  const handlePublish = () => {
    onPublish({ entities, relationships, attributes });
  };

  return (
    <div className="review-erd-container">
      <h1 className="page-title">Review AI Detection</h1>
      
      <div className="erd-content">
        {/* Left: Answer Scheme Image */}
        <div className="erd-image-section">
          <h2>ERD Answer Scheme</h2>
          <div className="image-display">
            <img src={answerSchemeUrl} alt="ERD Answer Scheme" />
          </div>
          {rubricUrl && (
            <>
              <h2>Rubric</h2>
              <div className="pdf-display">
                <embed src={rubricUrl} type="application/pdf" width="100%" height="400px" />
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
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="ce-create-btn" 
              onClick={handlePublish}
              disabled={isLoading}
            >
              {isLoading ? 'Publishing...' : 'Confirm & Publish Exercise'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerReviewERDComponent;