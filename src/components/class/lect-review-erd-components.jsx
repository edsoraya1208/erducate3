import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import '../../styles/review-erd.css';
import '../../styles/grade-erd.css'; // ✅ ADD THIS LINE
import ValidationErrorModal from '../modals/ValidationErrorModal';

const LecturerReviewERDComponent = ({ 
  detectedData, 
  answerSchemeUrl, 
  rubricText, // 🆕 CHANGED: From rubricUrl to rubricText
  rubricAnalysis, // 🆕 NEW: Structured rubric from AI
  onPublish, 
  onCancel,
  isLoading 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const passedData = location.state || {};
  const { classId, exerciseId } = passedData;
  
  const initialDetectedData = passedData.detectedData || detectedData;
  const initialAnswerScheme = passedData.exerciseData?.answerScheme?.url || answerSchemeUrl;
  const initialRubricText = passedData.exerciseData?.rubricText || rubricText; // 🆕 CHANGED
  const initialRubricAnalysis = passedData.rubricAnalysis || rubricAnalysis;

  console.log('🔍 Review Page Data Check:');
  console.log('  - detectedData:', initialDetectedData ? '✅ Present' : '❌ Missing');
  console.log('  - rubricText:', initialRubricText ? '✅ Present' : '❌ Missing');
  console.log('  - rubricAnalysis:', initialRubricAnalysis ? '✅ Present' : '❌ MISSING');
  if (initialRubricAnalysis) {
    console.log('    - isERDRubric:', initialRubricAnalysis.isERDRubric);
    console.log('    - totalPoints:', initialRubricAnalysis.totalPoints);
    console.log('    - criteria count:', initialRubricAnalysis.criteria?.length);
  }
  console.log('  - Full passedData keys:', Object.keys(passedData));
  console.log('  - passedData.rubricAnalysis:', passedData.rubricAnalysis);


  // ✅ Store ALL elements with unique IDs
  const [allElements, setAllElements] = useState(
    (initialDetectedData.elements || []).map((el, idx) => ({
      ...el,
      id: el.id || `el_${Date.now()}_${idx}`
    }))
  );
  
  // ✅ Tab state
  const [activeTab, setActiveTab] = useState('review');
  
  // ✅ Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [elementToDelete, setElementToDelete] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const [validationModalErrors, setValidationModalErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newElement, setNewElement] = useState({
    name: '',
    type: 'entity',
    subType: 'strong',
    confidence: 100
  });

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ✅ Filter for display based on active tab
  const displayElements = activeTab === 'review' 
    ? allElements.filter(el => el.confidence < 87)
    : allElements;

  // ✅ Update element by ID
  const updateElement = (id, field, value) => {
    setAllElements(prev => prev.map(el => 
      el.id === id ? { ...el, [field]: value } : el
    ));
  };

  // ✅ Delete element with confirmation
  const handleDeleteClick = (element) => {
    setElementToDelete(element);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setAllElements(prev => prev.filter(el => el.id !== elementToDelete.id));
    setShowDeleteModal(false);
    setElementToDelete(null);
    showNotification('Element deleted successfully');
  };

  // ✅ Add new element
  const handleAddElement = () => {
    if (!newElement.name.trim()) {
      showNotification('Please enter element name', 'error');
      return;
    }

    // Validate based on type
    if (newElement.type === 'relationship' && (!newElement.from || !newElement.to)) {
      showNotification('Relationships need "from" and "to" entities', 'error');
      return;
    }
    if (newElement.type === 'attribute' && (!newElement.belongsTo || !newElement.belongsToType)) {
      showNotification('Attributes need to belong to something', 'error');
      return;
    }

    const elementWithId = {
      ...newElement,
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setAllElements(prev => [...prev, elementWithId]);
    
    // Reset form
    setNewElement({
      name: '',
      type: 'entity',
      subType: 'strong',
      confidence: 100
    });
    setShowAddForm(false);
    
    // Switch to "All Elements" tab to show the newly added item
    setActiveTab('all');
    showNotification('Element added successfully');
  };

  // ✅ Publish with modal confirmation
  const handlePublishClick = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
  setShowPublishModal(false);

  // 🛡️ NEW: Check AI results exist
  if (!initialDetectedData?.elements || initialDetectedData.elements.length === 0) {
    showNotification('Cannot publish: No ERD elements detected', 'error');
    return;
  }

  if (initialRubricText && !initialRubricAnalysis?.isERDRubric) {
    showNotification('Cannot publish: Rubric analysis incomplete', 'error');
    return;
  }

  // 🛡️ VALIDATION: Check for undefined/empty values
  const validationErrors = [];
    
  allElements.forEach((element, index) => {
    // Check element name
    if (!element.name || !element.name.trim()) {
      validationErrors.push(`Element ${index + 1}: Name is required`);
    }

    // Check relationship connections
    if (element.type === 'relationship') {
      if (!element.from || element.from === '') {
        validationErrors.push(`"${element.name}": Must select a "From" entity`);
      }
      if (!element.to || element.to === '') {
        validationErrors.push(`"${element.name}": Must select a "To" entity`);
      }
    }

    // Check attribute belongsTo
    if (element.type === 'attribute') {
      if (!element.belongsToType || element.belongsToType === '') {
        validationErrors.push(`"${element.name}": Must select "Belongs To Type"`);
      }
      if (!element.belongsTo || element.belongsTo === '') {
        validationErrors.push(`"${element.name}": Must select what it belongs to`);
      }
    }
  });

  // 🚨 Show custom modal if errors exist
  if (validationErrors.length > 0) {
    setValidationModalErrors(validationErrors);
    setShowValidationModal(true);
    showNotification('Please complete all required fields', 'error');
    return;
  }

  // Old way (using props)
  if (onPublish && !classId) {
    onPublish({ elements: allElements });
    return;
  }

  // New way (Firestore)
  if (!classId || !exerciseId) {
    showNotification('Missing exercise information. Cannot publish.', 'error');
    return;
  }

  try {
    setIsPublishing(true);
    
    // 🔥 CLEAN DATA: Remove undefined fields before saving to Firestore
    const cleanedElements = allElements.map(element => {
      const cleaned = {
        id: element.id,
        name: element.name,
        type: element.type,
        subType: element.subType,
        confidence: element.confidence
      };

      // Only add relationship fields if it's a relationship
      if (element.type === 'relationship') {
        cleaned.from = element.from;
        cleaned.to = element.to;
      }

      // Only add attribute fields if it's an attribute
      if (element.type === 'attribute') {
        cleaned.belongsTo = element.belongsTo;
        cleaned.belongsToType = element.belongsToType;
      }

      return cleaned;
    });
    
    const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
    
    // 🔥 PREPARE DATA TO SAVE
    const updateData = {
      status: 'active',
      correctAnswer: {
        elements: cleanedElements
      },
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // 🆕 ADD: Save AI-parsed rubric if available
    console.log('🔍 Checking rubric analysis before save:', initialRubricAnalysis);

    if (initialRubricAnalysis) {
      // ✅ Check if it's a valid ERD rubric response
      if (initialRubricAnalysis.isERDRubric === true) {
        console.log('✅ Saving rubricStructured:', initialRubricAnalysis);
        updateData.rubricStructured = {
          isERDRubric: initialRubricAnalysis.isERDRubric,
          totalPoints: initialRubricAnalysis.totalPoints || 0,
          criteria: initialRubricAnalysis.criteria || [],
          detectedAt: serverTimestamp()
        };
      } else {
        console.warn('⚠️ Rubric analysis indicates NOT an ERD rubric:', initialRubricAnalysis);
      }
    } else {
      console.warn('⚠️ No rubric analysis data available');
    }

    console.log('🔥 Final update data:', updateData);

    await updateDoc(exerciseRef, updateData);
    
    showNotification('Exercise published successfully!');
    setTimeout(() => {
      navigate(`/lecturer/class/${classId}`, { replace: true });
    }, 1500);
    
  } catch (error) {
    console.error('Error publishing exercise:', error);
    showNotification('Failed to publish exercise. Please try again.', 'error');
  } finally {
    setIsPublishing(false);
  }
};

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  // ✅ Get options for "belongsTo" dropdown (entities + relationships + attributes)
  const getBelongsToOptions = () => {
    const entities = allElements.filter(el => el.type === 'entity');
    const relationships = allElements.filter(el => el.type === 'relationship');
    const attributes = allElements.filter(el => el.type === 'attribute');
    
    return { entities, relationships, attributes };
  };

  const belongsToOptions = getBelongsToOptions();

  return (
    <div className="rev-container review-erd-page">
      <h1 className="rev-title">Review AI Detection</h1>
      
      <div className="rev-content">
        {/* Left: Answer Scheme & Rubric */}
        <div className="rev-image-section">
          <div className="grade-left-column">
            <h2>ERD Answer Scheme</h2>
            
            <div className="grade-image-container">
              <div className="rev-image-display">
                <img src={initialAnswerScheme} alt="ERD Answer Scheme" />
              </div>
            </div>

            {/* Rubric Section */}
            {initialRubricText && (
              <div className="grade-image-container" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Rubric</h3>
                <div className="rev-rubric-display">
                  <pre className="rubric-text">{initialRubricText}</pre>
                  
                  {/* Show AI-analyzed rubric if available */}
                  {initialRubricAnalysis && initialRubricAnalysis.isERDRubric && (
                    <div className="rubric-analysis">
                      <h3>📊 AI Analysis</h3>
                      <p><strong>Total Points:</strong> {initialRubricAnalysis.totalPoints}</p>
                      {initialRubricAnalysis.criteria && (
                        <ul>
                          {initialRubricAnalysis.criteria.map((criterion, idx) => (
                            <li key={idx}>
                              <strong>{criterion.category}</strong> ({criterion.maxPoints} pts): {criterion.description}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detected Elements */}
        <div className="rev-elements-section">
          <div className="rev-header">
            <h2>Detected Elements</h2>
            <p className="rev-subtitle">
              Total: {allElements.length} elements
              <span className="rev-element-badge">
                {allElements.filter(e => e.type === 'entity').length} Entities
              </span>
              <span className="rev-element-badge">
                {allElements.filter(e => e.type === 'relationship').length} Relationships
              </span>
              <span className="rev-element-badge">
                {allElements.filter(e => e.type === 'attribute').length} Attributes
              </span>
            </p>
          </div>

          {/* Tabs */}
          <div className="rev-tabs">
            <button 
              className={`rev-tab ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              Review ({allElements.filter(el => el.confidence < 87).length})
            </button>
            <button 
              className={`rev-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Elements ({allElements.length})
            </button>
          </div>
          
          {/* Elements List */}
          <div className="rev-elements-list">
            {displayElements.length === 0 ? (
              <div className="rev-no-elements">
                {activeTab === 'review' ? (
                  <>
                    <p>🎉 All detected elements have high confidence (≥85%)!</p>
                    <p>You can still add elements manually if needed.</p>
                  </>
                ) : (
                  <p>No elements detected yet. Add elements manually.</p>
                )}
              </div>
            ) : (
              displayElements.map((element) => (
                <div key={element.id} className="rev-element-card">
                  <div className="rev-element-header">
                    <input
                      type="text"
                      value={element.name}
                      onChange={(e) => updateElement(element.id, 'name', e.target.value)}
                      className="rev-element-name-input"
                      placeholder="Element name"
                    />
                    <span className="rev-confidence">
                      {element.confidence}% confidence
                    </span>
                    <button 
                      className="rev-delete-btn"
                      onClick={() => handleDeleteClick(element)}
                      title="Delete element"
                    >
                      ×
                    </button>
                  </div>

                  {/* Type Selection */}
                  <div className="rev-element-row">
                    <label>Type:</label>
                    <select 
                      value={element.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        updateElement(element.id, 'type', newType);
                        // Set default subType
                        if (newType === 'entity') updateElement(element.id, 'subType', 'strong');
                        if (newType === 'relationship') updateElement(element.id, 'subType', 'one-to-many');
                        if (newType === 'attribute') updateElement(element.id, 'subType', 'regular');
                      }}
                      className="rev-dropdown"
                    >
                      <option value="entity">Entity</option>
                      <option value="relationship">Relationship</option>
                      <option value="attribute">Attribute</option>
                    </select>
                  </div>

                  {/* SubType Selection */}
                  <div className="rev-element-row">
                    <label>SubType:</label>
                    {element.type === 'entity' && (
                      <select 
                        value={element.subType}
                        onChange={(e) => updateElement(element.id, 'subType', e.target.value)}
                        className="rev-dropdown"
                      >
                        <option value="strong">Strong</option>
                        <option value="weak">Weak</option>
                      </select>
                    )}
                    {element.type === 'relationship' && (
                      <select 
                        value={element.subType}
                        onChange={(e) => updateElement(element.id, 'subType', e.target.value)}
                        className="rev-dropdown"
                      >
                        <option value="one-to-one">1:1 (One-to-One)</option>
                        <option value="one-to-many">1:N (One-to-Many)</option>
                        <option value="many-to-many">M:N (Many-to-Many)</option>
                      </select>
                    )}
                    {element.type === 'attribute' && (
                      <select 
                        value={element.subType}
                        onChange={(e) => updateElement(element.id, 'subType', e.target.value)}
                        className="rev-dropdown"
                      >
                        <option value="primary_key">Primary Key</option>
                        <option value="foreign_key">Foreign Key</option>
                        <option value="regular">Regular</option>
                        <option value="derived">Derived</option>
                        <option value="multivalued">Multivalued</option>
                        <option value="composite">Composite</option>
                      </select>
                    )}
                  </div>

                  {/* Relationship: From/To */}
                  {element.type === 'relationship' && (
                    <>
                      <div className="rev-element-row">
                        <label>From:</label>
                        <select 
                          value={element.from || ''}
                          onChange={(e) => updateElement(element.id, 'from', e.target.value)}
                          className="rev-dropdown"
                        >
                          <option value="">Select entity</option>
                          {belongsToOptions.entities.map(ent => (
                            <option key={ent.id} value={ent.name}>{ent.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="rev-element-row">
                        <label>To:</label>
                        <select 
                          value={element.to || ''}
                          onChange={(e) => updateElement(element.id, 'to', e.target.value)}
                          className="rev-dropdown"
                        >
                          <option value="">Select entity</option>
                          {belongsToOptions.entities.map(ent => (
                            <option key={ent.id} value={ent.name}>{ent.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Attribute: Belongs To */}
                  {element.type === 'attribute' && (
                    <>
                      <div className="rev-element-row">
                        <label>Belongs To Type:</label>
                        <select 
                          value={element.belongsToType || 'entity'}
                          onChange={(e) => {
                            updateElement(element.id, 'belongsToType', e.target.value);
                            updateElement(element.id, 'belongsTo', ''); // Reset selection
                          }}
                          className="rev-dropdown"
                        >
                          <option value="entity">Entity</option>
                          <option value="relationship">Relationship</option>
                          <option value="attribute">Attribute (Composite)</option>
                        </select>
                      </div>
                      <div className="rev-element-row">
                        <label>Belongs To:</label>
                        <select 
                          value={element.belongsTo || ''}
                          onChange={(e) => updateElement(element.id, 'belongsTo', e.target.value)}
                          className="rev-dropdown"
                        >
                          <option value="">Select {element.belongsToType || 'entity'}</option>
                          {element.belongsToType === 'entity' && belongsToOptions.entities.map(ent => (
                            <option key={ent.id} value={ent.name}>{ent.name}</option>
                          ))}
                          {element.belongsToType === 'relationship' && belongsToOptions.relationships.map(rel => (
                            <option key={rel.id} value={rel.name}>{rel.name}</option>
                          ))}
                          {element.belongsToType === 'attribute' && belongsToOptions.attributes.map(attr => (
                            <option key={attr.id} value={attr.name}>{attr.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Element Button */}
          {!showAddForm && (
            <button 
              className="rev-add-btn"
              onClick={() => setShowAddForm(true)}
            >
              + Add Element
            </button>
          )}

          {/* Add Element Form */}
          {showAddForm && (
            <div className="rev-add-form">
              <h3>Add New Element</h3>
              
              <input
                type="text"
                value={newElement.name}
                onChange={(e) => setNewElement({...newElement, name: e.target.value})}
                placeholder="Element name"
                className="rev-input"
              />

              <select 
                value={newElement.type}
                onChange={(e) => {
                  const type = e.target.value;
                  setNewElement({
                    ...newElement, 
                    type,
                    subType: type === 'entity' ? 'strong' : type === 'relationship' ? 'one-to-many' : 'regular',
                    belongsToType: type === 'attribute' ? 'entity' : undefined
                  });
                }}
                className="rev-dropdown"
              >
                <option value="entity">Entity</option>
                <option value="relationship">Relationship</option>
                <option value="attribute">Attribute</option>
              </select>

              {newElement.type === 'entity' && (
                <select 
                  value={newElement.subType}
                  onChange={(e) => setNewElement({...newElement, subType: e.target.value})}
                  className="rev-dropdown"
                >
                  <option value="strong">Strong</option>
                  <option value="weak">Weak</option>
                </select>
              )}

              {newElement.type === 'relationship' && (
                <>
                  <select 
                    value={newElement.subType}
                    onChange={(e) => setNewElement({...newElement, subType: e.target.value})}
                    className="rev-dropdown"
                  >
                    <option value="one-to-one">1:1</option>
                    <option value="one-to-many">1:N</option>
                    <option value="many-to-many">M:N</option>
                  </select>
                  <select 
                    value={newElement.from || ''}
                    onChange={(e) => setNewElement({...newElement, from: e.target.value})}
                    className="rev-dropdown"
                  >
                    <option value="">From entity</option>
                    {belongsToOptions.entities.map(ent => (
                      <option key={ent.id} value={ent.name}>{ent.name}</option>
                    ))}
                  </select>
                  <select 
                    value={newElement.to || ''}
                    onChange={(e) => setNewElement({...newElement, to: e.target.value})}
                    className="rev-dropdown"
                  >
                    <option value="">To entity</option>
                    {belongsToOptions.entities.map(ent => (
                      <option key={ent.id} value={ent.name}>{ent.name}</option>
                    ))}
                  </select>
                </>
              )}

              {newElement.type === 'attribute' && (
                <>
                  <select 
                    value={newElement.subType}
                    onChange={(e) => setNewElement({...newElement, subType: e.target.value})}
                    className="rev-dropdown"
                  >
                    <option value="primary_key">Primary Key</option>
                    <option value="foreign_key">Foreign Key</option>
                    <option value="regular">Regular</option>
                    <option value="derived">Derived</option>
                    <option value="multivalued">Multivalued</option>
                    <option value="composite">Composite</option>
                  </select>
                  <select 
                    value={newElement.belongsToType || 'entity'}
                    onChange={(e) => setNewElement({...newElement, belongsToType: e.target.value, belongsTo: ''})}
                    className="rev-dropdown"
                  >
                    <option value="entity">Belongs to Entity</option>
                    <option value="relationship">Belongs to Relationship</option>
                    <option value="attribute">Belongs to Attribute</option>
                  </select>
                  <select 
                    value={newElement.belongsTo || ''}
                    onChange={(e) => setNewElement({...newElement, belongsTo: e.target.value})}
                    className="rev-dropdown"
                  >
                    <option value="">Select {newElement.belongsToType}</option>
                    {newElement.belongsToType === 'entity' && belongsToOptions.entities.map(ent => (
                      <option key={ent.id} value={ent.name}>{ent.name}</option>
                    ))}
                    {newElement.belongsToType === 'relationship' && belongsToOptions.relationships.map(rel => (
                      <option key={rel.id} value={rel.name}>{rel.name}</option>
                    ))}
                    {newElement.belongsToType === 'attribute' && belongsToOptions.attributes.map(attr => (
                      <option key={attr.id} value={attr.name}>{attr.name}</option>
                    ))}
                  </select>
                </>
              )}

              <div className="rev-add-form-actions">
                <button 
                  className="rev-cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="rev-confirm-btn"
                  onClick={handleAddElement}
                >
                  Add Element
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="rev-form-actions">
            <button 
              type="button" 
              className="rev-cancel-action-btn" 
              onClick={handleCancel}
              disabled={isPublishing || isLoading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="rev-publish-btn" 
              onClick={handlePublishClick}
              disabled={isPublishing || isLoading || allElements.length === 0}
            >
              {(isPublishing || isLoading) ? 'Publishing...' : 'Confirm & Publish Exercise'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="rev-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="rev-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rev-modal-header">Delete Element?</div>
            <div className="rev-modal-body">
              Are you sure you want to delete "{elementToDelete?.name}"? This action cannot be undone.
            </div>
            <div className="rev-modal-actions">
              <button 
                className="rev-modal-btn rev-modal-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="rev-modal-btn rev-modal-btn-confirm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="rev-modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="rev-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rev-modal-header">Publish Exercise?</div>
            <div className="rev-modal-body">
              <p><strong>⚠️ WARNING:</strong> Once published, the AI detection cannot be changed.</p>
              <br />
              <p><strong>Total elements: {allElements.length}</strong></p>
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Entities: {allElements.filter(e => e.type === 'entity').length}</li>
                <li>Relationships: {allElements.filter(e => e.type === 'relationship').length}</li>
                <li>Attributes: {allElements.filter(e => e.type === 'attribute').length}</li>
              </ul>
              <br />
              <p>Are you sure you want to publish?</p>
            </div>
            <div className="rev-modal-actions">
              <button 
                className="rev-modal-btn rev-modal-btn-cancel"
                onClick={() => setShowPublishModal(false)}
              >
                Cancel
              </button>
              <button 
                className="rev-modal-btn rev-modal-btn-primary"
                onClick={confirmPublish}
              >
                Publish Exercise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`rev-notification ${notification.type}`}>
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* 🆕 Validation Error Modal */}
      <ValidationErrorModal
        isVisible={showValidationModal}
        errors={validationModalErrors}
        onClose={() => setShowValidationModal(false)}
      />
    </div>
  );
};

export default LecturerReviewERDComponent;