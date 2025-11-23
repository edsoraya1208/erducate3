// Full file with changes marked
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ERDReviewPanel from './ERDReviewPanel';
import '../../styles/review-erd.css';
import '../../styles/grade-erd.css';

const LecturerGradeERDComponent = () => {
  const { classId, exerciseId, submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [publishingGrade, setPublishingGrade] = useState(false);
  
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [allElements, setAllElements] = useState([]);
  const [gradingResult, setGradingResult] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const [notification, setNotification] = useState(null);
  
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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

  const handlePublishGrade = async () => {
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

  const handleCancel = () => {
    navigate(-1);
  };

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
          <div className="grade-header-left">
            <span className="grade-header-title">
              Grading: {studentSubmission.studentName || 'Student'}
            </span>
            <span className="grade-header-subtitle">
              {exerciseData.title}
            </span>
          </div>

          {/* ✅ KEPT: Refresh button stays here in header card */}
          <div className="grade-header-right">
            <span className="grade-current-label">Current Grade</span>

            <button 
              className="grade-score-display"
              onClick={handleRefreshGrade}
              disabled={grading || isReadOnly}
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
        {/* Left: Image & Comments */}
        <div className="rev-image-section">
          <div className="grade-left-column">
            <h2>Student's ERD Submission</h2>
            
            <div className="grade-image-container">
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

              <div className="grade-student-comments">
                <h3>Student's Comments</h3>
                {studentSubmission.comments ? (
                  <div className="grade-comments-content">
                    <p>{studentSubmission.comments}</p>
                  </div>
                ) : (
                  <div className="grade-comments-empty">
                    <p>No comments provided</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ❌ REMOVED: showRefreshGrade, onRefreshGrade, gradingResult, grading props */}
        <ERDReviewPanel
          allElements={allElements}
          setAllElements={setAllElements}
          isReadOnly={isReadOnly}
          onPublish={handlePublishGrade}
          onCancel={handleCancel}
          isPublishing={publishingGrade}
          isLoading={loading}
          publishButtonText="Publish Grade"
        />
      </div>

      {/* AI Feedback */}
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