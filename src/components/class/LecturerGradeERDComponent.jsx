import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import '../../styles/review-erd.css';  // ← ADD THIS
import '../../styles/grade-erd.css';        // ← KEEP THIS (must come after)

const LecturerGradeERDComponent = () => {
  const { classId, exerciseId, submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [publishingGrade, setPublishingGrade] = useState(false);
  
  // Data states
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [allElements, setAllElements] = useState([]);
  const [gradingResult, setGradingResult] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false); // ✅ ADDED

  
  // UI states (MATCHING REVIEW PAGE)
  const [activeTab, setActiveTab] = useState('review');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newElement, setNewElement] = useState({
    name: '',
    type: 'entity',
    subType: 'strong',
    confidence: 100
  });
  const [elementToDelete, setElementToDelete] = useState(null);
  
  // Notification
  const [notification, setNotification] = useState(null);
  
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [classId, exerciseId, submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const submissionRef = doc(db, 'submissions', submissionId);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        showNotification('Submission not found', 'error');
        return;
      }
      
      const submission = { id: submissionSnap.id, ...submissionSnap.data() };
      setStudentSubmission(submission);

      // ✅ ADDED: Check if already published
      if (submission.status === 'published') {
        setIsReadOnly(true);
      }

      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      const exerciseSnap = await getDoc(exerciseRef);
      
      if (!exerciseSnap.exists()) {
        showNotification('Exercise not found', 'error');
        return;
      }
      
      const exercise = { id: exerciseSnap.id, ...exerciseSnap.data() };
      setExerciseData(exercise);

      if (submission.detectedERD?.elements) {
        // Add IDs if missing
        const elementsWithIds = submission.detectedERD.elements.map((el, idx) => ({
          ...el,
          id: el.id || `el_${Date.now()}_${idx}`
        }));
        setAllElements(elementsWithIds);
        
        if (submission.grade) {
          setGradingResult(submission.grade);
          console.log('✅ Loaded cached grade');
        } else {
          console.warn('⚠️ No cached grade, grading now...');
          await performAutoGrade(elementsWithIds, exercise);
        }
      } else {
        showNotification('No ERD elements detected in submission', 'error');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const performAutoGrade = async (studentElements, exercise) => {
    try {
      setGrading(true);
      console.log('🎓 Starting auto-grade...');

      const response = await fetch('https://ai-api-server-vmaz.onrender.com/autograde-erd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentElements: studentElements,
          correctAnswer: exercise.correctAnswer,
          rubricStructured: exercise.rubricStructured || null
        })
      });

      if (!response.ok) {
        throw new Error('Auto-grading failed');
      }

      const result = await response.json();
      setGradingResult(result);
      console.log('✅ Auto-grade complete:', result);

    } catch (error) {
      console.error('Error auto-grading:', error);
      showNotification('Auto-grading failed', 'error');
    } finally {
      setGrading(false);
    }
  };

  const handleRefreshGrade = async () => {
    if (!allElements.length || !exerciseData) return;
    await performAutoGrade(allElements, exerciseData);
    showNotification('Grade recalculated');
  };

  // MATCHING REVIEW PAGE FUNCTIONS
  const updateElement = (id, field, value) => {
    setAllElements(prev => prev.map(el => 
      el.id === id ? { ...el, [field]: value } : el
    ));
  };

  const handleDeleteClick = (element) => {
    setElementToDelete(element);
  };

  const confirmDelete = () => {
    if (elementToDelete) {
      setAllElements(prev => prev.filter(el => el.id !== elementToDelete.id));
      showNotification('Element deleted');
      setElementToDelete(null);
    }
  };

  const cancelDelete = () => {
    setElementToDelete(null);
  };

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

  const handleCancel = () => {
    navigate(-1);
  };

  const handlePublishGrade = async () => {
    if (!gradingResult) {
      showNotification('No grade to publish', 'error');
      return;
    }

    try {
      setPublishingGrade(true);

      const submissionRef = doc(db, 'submissions', submissionId);
      
      await updateDoc(submissionRef, {
        grade: gradingResult,
        detectedERD: { elements: allElements },
        gradedAt: serverTimestamp(),
        status: 'published'
      });

      showNotification('Grade published successfully!');
      setTimeout(() => {
        navigate(`/lecturer/class/${classId}/exercise/${exerciseId}/submissions`);
      }, 1500);

    } catch (error) {
      console.error('Error publishing grade:', error);
      showNotification('Failed to publish grade', 'error');
    } finally {
      setPublishingGrade(false);
    }
  };

  // Get options for dropdowns (MATCHING REVIEW)
  const getBelongsToOptions = () => {
    const entities = allElements.filter(el => el.type === 'entity');
    const relationships = allElements.filter(el => el.type === 'relationship');
    const attributes = allElements.filter(el => el.type === 'attribute');
    return { entities, relationships, attributes };
  };

  const belongsToOptions = getBelongsToOptions();
  
  // Display elements based on active tab
  const displayElements = activeTab === 'review' 
    ? allElements.filter(el => el.confidence < 95)
    : allElements;

  if (loading) {
    return (
      <div className="grade-loading-overlay">
        <div className="grade-loading-spinner"></div>
        <p className="grade-loading-text">Loading submission...</p>
      </div>
    );
  }

  if (!studentSubmission || !exerciseData) {
    return (
      <div className="rev-container">
        <div className="grade-error-state">
          <p>❌ Failed to load submission data</p>
          <button onClick={() => navigate(-1)} className="grade-back-button">Go Back</button>
        </div>
      </div>
    );
  }

  return (
  <div className="rev-container grade-container">
    <div className="grade-header-card">
      <h1 className="rev-title">
        {/* NEW: Left side wrapper for title and subtitle */}
        <div className="grade-header-left">
          <span className="grade-header-title">
            Grading: {studentSubmission.studentName || 'Student'}
          </span>
          {/* NEW: Added exercise title as subtitle */}
          <span className="grade-header-subtitle">
            {exerciseData.title}
          </span>
        </div>

        {/* NEW: Right side wrapper for stacked layout */}
        <div className="grade-header-right">
          <span className="grade-current-label">Current Grade</span>

          {/* NEW: Made score clickable, moved icon inside */}
          <button 
            className="grade-score-display"
            onClick={handleRefreshGrade}
            disabled={grading || isReadOnly} // ✅ ADDED || isReadOnly
            title="Refresh grade"
          >
            <span className="grade-refresh-icon">🔄</span>
            <span>
              {grading ? '...' : gradingResult ? `${gradingResult.totalScore}/${gradingResult.maxScore}` : '--/--'}
            </span>
          </button>
        </div>
      </h1>
    </div>
        
    <div className="rev-content">
      {/* Left: Student's ERD */}
      <div className="rev-image-section">
        <div className="grade-left-column">
          <div className="grade-image-container">
          <h2>Student's ERD Submission</h2>
          <div className="rev-image-display">
            {studentSubmission.fileURL ? (
              <img src={studentSubmission.fileURL} alt="Student ERD" />
            ) : (
              <div className="grade-image-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p>No image uploaded</p>
              </div>
           )}
      </div>
    </div>
  </div>
</div>

      {/* Right: Detected Elements - UNCHANGED */}
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
            Review ({allElements.filter(el => el.confidence < 95).length})
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
                  <p>🎉 All detected elements have high confidence (≥95%)!</p>
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
                    disabled={isReadOnly} // ✅ ADDED
                  />
                  <span className="rev-confidence">
                    {element.confidence}% confidence
                  </span>
                  <button 
                    className="rev-delete-btn"
                    onClick={() => handleDeleteClick(element)}
                    title="Delete element"
                    disabled={isReadOnly} // ✅ ADDED
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
                    disabled={isReadOnly} // ✅ ADDED
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
                      disabled={isReadOnly} // ✅ ADDED
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
                      disabled={isReadOnly} // ✅ ADDED
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
                      disabled={isReadOnly} // ✅ ADDED
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
                        disabled={isReadOnly} // ✅ ADDED
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
                        disabled={isReadOnly} // ✅ ADDED
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
                        disabled={isReadOnly} // ✅ ADDED
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
                        disabled={isReadOnly} // ✅ ADDED
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
        {!showAddForm && !isReadOnly && ( // ✅ ADDED !isReadOnly
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
            disabled={publishingGrade || loading}
          >
            Cancel
          </button>
          {!isReadOnly && ( // ✅ ADDED WRAPPER
            <button 
              type="button" 
              className="rev-publish-btn" 
              onClick={handlePublishGrade}
              disabled={publishingGrade || loading || allElements.length === 0}
            >
              {(publishingGrade || loading) ? 'Publishing...' : 'Done'}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* AI Feedback - Full Width Below Both Columns */}
    {gradingResult && (
      <div className="grade-feedback-section">
        <div className="grade-feedback-box">
          <h3>✨ AI Feedback</h3>
          
          {gradingResult.feedback?.correct?.length > 0 && (
            <div className="feedback-strengths">
              <h4>✅ Strengths</h4>
              <ul>
                {gradingResult.feedback.correct.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {gradingResult.feedback?.missing?.length > 0 && (
            <div className="feedback-missing">
              <h4>❌ Missing</h4>
              <ul>
                {gradingResult.feedback.missing.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {gradingResult.feedback?.incorrect?.length > 0 && (
            <div className="feedback-incorrect">
              <h4>⚠️ Needs Improvement</h4>
              <ul>
                {gradingResult.feedback.incorrect.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {gradingResult.overallComment && (
            <div className="feedback-overall">
              <p><strong>Overall:</strong> {gradingResult.overallComment}</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {elementToDelete && (
      <div className="rev-modal-overlay">
        <div className="rev-modal">
          <h3 className="rev-modal-header">Delete Element?</h3>
          <div className="rev-modal-body">
            <p>Are you sure you want to delete "{elementToDelete.name}"?</p>
          </div>
          <div className="rev-modal-actions">
            <button onClick={cancelDelete} className="rev-modal-btn rev-modal-btn-cancel">
              Cancel
            </button>
            <button onClick={confirmDelete} className="rev-modal-btn rev-modal-btn-confirm">
              Delete
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
  </div>
);
};

export default LecturerGradeERDComponent;