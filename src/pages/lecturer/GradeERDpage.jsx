// src/pages/lecturer/GradeERDPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import LecturerGradeERDComponent from '../../components/class/LecturerGradeERDComponent';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const GradeERDPage = () => {
  // 1. HOOKS & STATE (Moved from Component)
  const { classId, exerciseId, submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [publishingGrade, setPublishingGrade] = useState(false);
  
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [allElements, setAllElements] = useState([]); // Shared state for ERD elements
  const [gradingResult, setGradingResult] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const [notification, setNotification] = useState(null);
  
  // 2. LOGIC FUNCTIONS
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

  // Wrapper for the refresh button
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

  return (
    <div>
      <DashboardHeader 
        userType="lecturer"
        currentPage="grading"
      />
      {/* 3. RENDER PURE UI COMPONENT WITH PROPS */}
      <LecturerGradeERDComponent 
        loading={loading}
        grading={grading}
        publishingGrade={publishingGrade}
        studentSubmission={studentSubmission}
        exerciseData={exerciseData}
        allElements={allElements}
        setAllElements={setAllElements} // UI needs to update elements array
        gradingResult={gradingResult}
        isReadOnly={isReadOnly}
        notification={notification}
        onRefreshGrade={handleRefreshGrade}
        onPublish={handlePublishGrade}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default GradeERDPage;