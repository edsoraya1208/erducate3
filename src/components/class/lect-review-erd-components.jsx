// Full file - only the ERDReviewPanel section changed
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
  const { classId, exerciseId } = passedData;
  
  const initialDetectedData = passedData.detectedData || detectedData;
  const initialAnswerScheme = passedData.exerciseData?.answerScheme?.url || answerSchemeUrl;
  const initialRubricText = passedData.exerciseData?.rubricText || rubricText;
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

  const [allElements, setAllElements] = useState(
    (initialDetectedData.elements || []).map((el, idx) => ({
      ...el,
      id: el.id || `el_${Date.now()}_${idx}`
    }))
  );
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePublish = async () => {
    if (!initialDetectedData?.elements || initialDetectedData.elements.length === 0) {
      showNotification('Cannot publish: No ERD elements detected', 'error');
      return;
    }

    if (initialRubricText && !initialRubricAnalysis?.isERDRubric) {
      showNotification('Cannot publish: Rubric analysis incomplete', 'error');
      return;
    }

    if (onPublish && !classId) {
      onPublish({ elements: allElements });
      return;
    }

    if (!classId || !exerciseId) {
      showNotification('Missing exercise information. Cannot publish.', 'error');
      return;
    }

    try {
      setIsPublishing(true);
      
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
      
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      
      const updateData = {
        status: 'active',
        correctAnswer: {
          elements: cleanedElements
        },
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (initialRubricAnalysis?.isERDRubric === true) {
        updateData.rubricStructured = {
          isERDRubric: initialRubricAnalysis.isERDRubric,
          totalPoints: initialRubricAnalysis.totalPoints || 0,
          criteria: initialRubricAnalysis.criteria || [],
          detectedAt: serverTimestamp()
        };
      }

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

        {/* ❌ REMOVED: showRefreshGrade prop */}
        <ERDReviewPanel
          allElements={allElements}
          setAllElements={setAllElements}
          isReadOnly={false}
          onPublish={handlePublish}
          onCancel={handleCancel}
          isPublishing={isPublishing}
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