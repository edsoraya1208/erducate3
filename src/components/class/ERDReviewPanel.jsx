// src/components/class/ERDReviewPanel.jsx
import React, { useState } from 'react';
import ValidationErrorModal from '../modals/ValidationErrorModal';

const ERDReviewPanel = ({ 
  allElements, 
  setAllElements, 
  isReadOnly = false,
  onPublish,
  onCancel,
  isPublishing = false,
  isLoading = false,
  publishButtonText = 'Confirm & Publish Exercise'
}) => {
  const [activeTab, setActiveTab] = useState('review');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newElement, setNewElement] = useState({
    name: '',
    type: 'entity',
    subType: 'strong',
    confidence: 100
  });
  const [elementToDelete, setElementToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [validationModalErrors, setValidationModalErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter for display based on active tab
  const displayElements = activeTab === 'review' 
    ? allElements.filter(el => el.confidence < 89)
    : allElements;

  // Update element by ID
  const updateElement = (id, field, value) => {
    setAllElements(prev => prev.map(el => 
      el.id === id ? { ...el, [field]: value } : el
    ));
  };

  // Delete element with confirmation
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

  // Add new element
  const handleAddElement = () => {
    if (!newElement.name.trim()) {
      showNotification('Please enter element name', 'error');
      return;
    }

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
    
    setNewElement({
      name: '',
      type: 'entity',
      subType: 'strong',
      confidence: 100
    });
    setShowAddForm(false);
    setActiveTab('all');
    showNotification('Element added successfully');
  };

  // Publish with validation
  const handlePublishClick = () => {
    if (isReadOnly) {
      showNotification('Grade already published', 'error');
      return;
    }

    // Validation
    const validationErrors = [];
    
    allElements.forEach((element, index) => {
      if (!element.name || !element.name.trim()) {
        validationErrors.push(`Element ${index + 1}: Name is required`);
      }

      if (element.type === 'relationship') {
        if (!element.from || element.from === '') {
          validationErrors.push(`"${element.name}": Must select a "From" entity`);
        }
        if (!element.to || element.to === '') {
          validationErrors.push(`"${element.name}": Must select a "To" entity`);
        }
      }

      if (element.type === 'attribute') {
        if (!element.belongsToType || element.belongsToType === '') {
          validationErrors.push(`"${element.name}": Must select "Belongs To Type"`);
        }
        if (!element.belongsTo || element.belongsTo === '') {
          validationErrors.push(`"${element.name}": Must select what it belongs to`);
        }
      }
    });

    if (validationErrors.length > 0) {
      setValidationModalErrors(validationErrors);
      setShowValidationModal(true);
      showNotification('Please complete all required fields', 'error');
      return;
    }

    setShowPublishModal(true);
  };

  const confirmPublish = () => {
    setShowPublishModal(false);
    if (onPublish) {
      onPublish();
    }
  };

  // Get options for "belongsTo" dropdown
  const getBelongsToOptions = () => {
    const entities = allElements.filter(el => el.type === 'entity');
    const relationships = allElements.filter(el => el.type === 'relationship');
    const attributes = allElements.filter(el => el.type === 'attribute');
    return { entities, relationships, attributes };
  };

  const belongsToOptions = getBelongsToOptions();

  return (
    <div className="rev-elements-section">
      {/* ❌ REMOVED: Refresh grade button section (was here before) */}

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
          Review ({allElements.filter(el => el.confidence < 89).length})
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
                <p>🎉 All detected elements have high confidence (≥89%)!</p>
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
                  disabled={isReadOnly}
                />
                <span className="rev-confidence">
                  {element.confidence}% confidence
                </span>
                <button 
                  className="rev-delete-btn"
                  onClick={() => handleDeleteClick(element)}
                  title="Delete element"
                  disabled={isReadOnly}
                >
                  ×
                </button>
              </div>

              <div className="rev-element-row">
                <label>Type:</label>
                <select 
                  value={element.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    updateElement(element.id, 'type', newType);
                    if (newType === 'entity') updateElement(element.id, 'subType', 'strong');
                    if (newType === 'relationship') updateElement(element.id, 'subType', 'strong');
                    if (newType === 'attribute') updateElement(element.id, 'subType', 'regular');
                  }}
                  className="rev-dropdown"
                  disabled={isReadOnly}
                >
                  <option value="entity">Entity</option>
                  <option value="relationship">Relationship</option>
                  <option value="attribute">Attribute</option>
                </select>
              </div>

              <div className="rev-element-row">
                <label>SubType:</label>
                {element.type === 'entity' && (
                  <select 
                    value={element.subType}
                    onChange={(e) => updateElement(element.id, 'subType', e.target.value)}
                    className="rev-dropdown"
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
                  >
                    <option value="strong">Strong</option>
                    <option value="weak">Weak</option>
                  </select>
                )}
                {element.type === 'attribute' && (
                  <select 
                    value={element.subType}
                    onChange={(e) => updateElement(element.id, 'subType', e.target.value)}
                    className="rev-dropdown"
                    disabled={isReadOnly}
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

              {element.type === 'relationship' && (
                <>
                  <div className="rev-element-row">
                    <label>From:</label>
                    <select 
                      value={element.from || ''}
                      onChange={(e) => updateElement(element.id, 'from', e.target.value)}
                      className="rev-dropdown"
                      disabled={isReadOnly}
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
                      disabled={isReadOnly}
                    >
                      <option value="">Select entity</option>
                      {belongsToOptions.entities.map(ent => (
                        <option key={ent.id} value={ent.name}>{ent.name}</option>
                      ))}
                    </select>
                  </div>
                  
                 <div className="rev-element-row">
                    <label>Cardinality From:</label>
                    <select 
                      value={element.cardinalityFrom || ''}
                      onChange={(e) => updateElement(element.id, 'cardinalityFrom', e.target.value || undefined)}
                      className="rev-dropdown"
                      disabled={isReadOnly}
                    >
                      <option value="0..1">0..1 (optional, at most one)</option>
                      <option value="1..1">1..1 (exactly one)</option>
                      <option value="0..M">0..M (optional, many)</option>
                      <option value="1..M">1..M (at least one, many)</option>
                    </select>
                  </div>
                  <div className="rev-element-row">
                    <label>Cardinality To:</label>
                    <select 
                      value={element.cardinalityTo || ''}
                      onChange={(e) => updateElement(element.id, 'cardinalityTo', e.target.value || undefined)}
                      className="rev-dropdown"
                      disabled={isReadOnly}
                    >
                      <option value="0..1">0..1 (optional, at most one)</option>
                      <option value="1..1">1..1 (exactly one)</option>
                      <option value="0..M">0..M (optional, many)</option>
                      <option value="1..M">1..M (at least one, many)</option>
                    </select>
                  </div>
                </>
              )}

              {element.type === 'attribute' && (
                <>
                  <div className="rev-element-row">
                    <label>Belongs To Type:</label>
                    <select 
                      value={element.belongsToType || 'entity'}
                      onChange={(e) => {
                        updateElement(element.id, 'belongsToType', e.target.value);
                        updateElement(element.id, 'belongsTo', '');
                      }}
                      className="rev-dropdown"
                      disabled={isReadOnly}
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
                      disabled={isReadOnly}
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

      {!showAddForm && !isReadOnly && (
        <button 
          className="rev-add-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Element
        </button>
      )}

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
                subType: type === 'entity' ? 'strong' : type === 'relationship' ? 'strong' : 'regular',
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
                <option value="strong">Strong</option>
                <option value="weak">Weak</option>
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
              
              <select 
                value={newElement.cardinalityFrom || '0..M'}
                onChange={(e) => setNewElement({...newElement, cardinalityFrom: e.target.value})}
                className="rev-dropdown"
              >
                <option value="0..1">0..1</option>
                <option value="1..1">1..1</option>
                <option value="0..M">0..M</option>
                <option value="1..M">1..M</option>
              </select>
              <select 
                value={newElement.cardinalityTo || '0..M'}
                onChange={(e) => setNewElement({...newElement, cardinalityTo: e.target.value})}
                className="rev-dropdown"
              >
                <option value="0..1">0..1</option>
                <option value="1..1">1..1</option>
                <option value="0..M">0..M</option>
                <option value="1..M">1..M</option>
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
          onClick={onCancel}
          disabled={isPublishing || isLoading}
        >
          Cancel
        </button>
        {!isReadOnly && (
          <button 
            type="button" 
            className="rev-publish-btn" 
            onClick={handlePublishClick}
            disabled={isPublishing || isLoading || allElements.length === 0}
          >
            {(isPublishing || isLoading) ? 'Publishing...' : publishButtonText}
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="rev-modal-overlay">
          <div className="rev-modal">
            <h3 className="rev-modal-header">Delete Element?</h3>
            <div className="rev-modal-body">
              <p>Are you sure you want to delete "{elementToDelete?.name}"?</p>
            </div>
            <div className="rev-modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="rev-modal-btn rev-modal-btn-cancel">
                Cancel
              </button>
              <button onClick={confirmDelete} className="rev-modal-btn rev-modal-btn-confirm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="rev-modal-overlay">
          <div className="rev-modal">
            <h3 className="rev-modal-header">Publish?</h3>
            <div className="rev-modal-body">
              <p>Are you sure you want to publish?</p>
              <p className="grade-modal-warning">Once published, you won't be able to edit it anymore.</p>
            </div>
            <div className="rev-modal-actions">
              <button onClick={() => setShowPublishModal(false)} className="rev-modal-btn rev-modal-btn-cancel">
                Cancel
              </button>
              <button onClick={confirmPublish} className="rev-modal-btn rev-modal-btn-confirm">
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Modal */}
      <ValidationErrorModal
        isVisible={showValidationModal}
        errors={validationModalErrors}
        onClose={() => setShowValidationModal(false)}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`rev-notification ${notification.type}`}>
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default ERDReviewPanel;