// src/components/class/lect-review-erd-components.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// ❌ REMOVED: Firebase imports (This component is now Pure UI)
// import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
// import { db } from '../../config/firebase';
import ERDReviewPanel from './ERDReviewPanel';
import '../../styles/review-erd.css';
import '../../styles/grade-erd.css';

const LecturerReviewERDComponent = ({ 
  detectedData, 
  answerSchemeUrl, 
  rubricText,
  rubricAnalysis,
  onPublish, 
  onCancel,
  isLoading 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const passedData = location.state || {};
  // Note: We still use location state for init, but we don't fetch data here.
  const { classId, exerciseId } = passedData;
  
  const initialDetectedData = passedData.detectedData || detectedData;
  const initialAnswerScheme = passedData.exerciseData?.answerScheme?.url || answerSchemeUrl;
  const initialRubricText = passedData.exerciseData?.rubricText || rubricText;
  const initialRubricAnalysis = passedData.rubricAnalysis || rubricAnalysis;

  // ... (Console logs kept as requested) ...
  console.log('🔍 Review Page Data Check:');
  console.log('  - detectedData:', initialDetectedData ? '✅ Present' : '❌ Missing');
  console.log('  - rubricText:', initialRubricText ? '✅ Present' : '❌ Missing');
  console.log('  - rubricAnalysis:', initialRubricAnalysis ? '✅ Present' : '❌ MISSING');
  if (initialRubricAnalysis) {
    console.log('    - isERDRubric:', initialRubricAnalysis.isERDRubric);
    console.log('    - totalPoints:', initialRubricAnalysis.totalPoints);
    console.log('    - criteria count:', initialRubricAnalysis.criteria?.length);
  }

  const [allElements, setAllElements] = useState(
    (initialDetectedData.elements || []).map((el, idx) => ({
      ...el,
      id: el.id || `el_${Date.now()}_${idx}`
    }))
  );
  
  // ❌ REMOVED: isPublishing state (The Page handles the loading state now via props)
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePublishClick = () => {
    // 1. VALIDATION (Kept here because it's UI feedback)
    if (!initialDetectedData?.elements || initialDetectedData.elements.length === 0) {
      showNotification('Cannot publish: No ERD elements detected', 'error');
      return;
    }

    if (initialRubricText && !initialRubricAnalysis?.isERDRubric) {
      showNotification('Cannot publish: Rubric analysis incomplete', 'error');
      return;
    }

    // 2. DATA CLEANING (Prepare the data for the Page)
    const cleanedElements = allElements.map(element => {
      const cleaned = {
        id: element.id,
        name: element.name,
        type: element.type,
        subType: element.subType,
        confidence: element.confidence
      };

      if (element.type === 'relationship') {
        cleaned.from = element.from;
        cleaned.to = element.to;
        if (element.cardinalityFrom) cleaned.cardinalityFrom = element.cardinalityFrom;
        if (element.cardinalityTo) cleaned.cardinalityTo = element.cardinalityTo;
      }

      if (element.type === 'attribute') {
        cleaned.belongsTo = element.belongsTo;
        cleaned.belongsToType = element.belongsToType;
      }

      return cleaned;
    });

    // 3. PREPARE FINAL OBJECT
    const publishData = {
      elements: cleanedElements,
      // Pass rubric data up if it exists
      rubricStructured: (initialRubricAnalysis?.isERDRubric === true) ? {
        isERDRubric: initialRubricAnalysis.isERDRubric,
        totalPoints: initialRubricAnalysis.totalPoints || 0,
        criteria: initialRubricAnalysis.criteria || [],
        // note: detectedAt will be added by serverTimestamp in the Page if needed
      } : null
    };

    // 4. SEND TO PARENT PAGE
    // ✅ CHANGED: We don't save to DB here. We just call the prop.
    if (onPublish) {
      onPublish(publishData); 
    } else {
      console.error("onPublish prop is missing!");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

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

            {initialRubricText && (
              <div className="grade-image-container" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Rubric</h3>
                <div className="rev-rubric-display">
                  <pre className="rubric-text">{initialRubricText}</pre>
                  
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

        <ERDReviewPanel
          allElements={allElements}
          setAllElements={setAllElements}
          isReadOnly={false}
          onPublish={handlePublishClick} // ✅ Changed to local handler
          onCancel={handleCancel}
          isPublishing={isLoading} // ✅ Uses prop from parent
          isLoading={isLoading}
          publishButtonText="Confirm & Publish Exercise"
        />
      </div>

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

export default LecturerReviewERDComponent;