// src/pages/lecturer/GradeERDPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'; // ✅ updateDoc imported
import { db } from '../../config/firebase';
import LecturerGradeERDComponent from '../../components/class/LecturerGradeERDComponent';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const GradeERDPage = () => {
  // 1. HOOKS & STATE
  const { classId, exerciseId, submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [publishingGrade, setPublishingGrade] = useState(false);
  
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [allElements, setAllElements] = useState([]); 
  const [gradingResult, setGradingResult] = useState(null); // The LIVE grade (updates on refresh)
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // 🆕 THESIS DATA: Hidden storage for Initial AI Grade
  const [initialAiGrade, setInitialAiGrade] = useState(null);
  
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

      // 1. Fetch Student Submission
      const submissionRef = doc(db, 'submissions', submissionId);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        showNotification('Submission not found', 'error');
        return;
      }
      
      const submission = { id: submissionSnap.id, ...submissionSnap.data() };
      setStudentSubmission(submission);

      // 2. Fetch Exercise Details
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      const exerciseSnap = await getDoc(exerciseRef);
      
      if (!exerciseSnap.exists()) {
        showNotification('Exercise not found', 'error');
        return;
      }
      
      const exercise = { id: exerciseSnap.id, ...exerciseSnap.data() };
      setExerciseData(exercise);

      // 3. Initialize Elements
      let currentElements = [];
      if (submission.detectedERD?.elements) {
        currentElements = submission.detectedERD.elements.map((el, idx) => ({
          ...el,
          id: el.id || `el_${Date.now()}_${idx}`
        }));
        setAllElements(currentElements);
      } else {
        showNotification('No ERD elements detected', 'error');
        return;
      }

      // ============================================================
      // 🔥 THESIS DATA FIX: FORCE SAVE IMMEDIATELY
      // ============================================================
      
      // Scenario A: Data already exists (Safe)
      if (submission.initialAiGrade) {
        console.log('📊 Thesis Data: Loaded existing Initial AI Grade from DB');
        setInitialAiGrade(submission.initialAiGrade);
      } 
      // Scenario B: Data MISSING (Force Create & Save)
      else {
        console.log('⚠️ Thesis Data missing. Generating backfill...');
        let capturedInitialGrade = null;

        if (submission.grade) {
           // If student is ALREADY graded, we have to use their current grade as the baseline
           // (This fixes the "missing field" for your 3 existing students)
           console.log('Using existing grade as baseline.');
           capturedInitialGrade = submission.grade;
        } else {
           // If NEW student, run fresh AI detection
           console.log('Running fresh AI detection for baseline...');
           capturedInitialGrade = await performAutoGrade(currentElements, exercise);
        }

        // 🚨 CRITICAL STEP: Save to DB RIGHT NOW. Do not wait.
        if (capturedInitialGrade) {
            console.log('🔒 Saving missing Thesis Data to DB immediately...');
            setInitialAiGrade(capturedInitialGrade);
            
            // This writes to Firestore instantly
            await updateDoc(submissionRef, { 
                initialAiGrade: capturedInitialGrade 
            });
        }
      }

      // ============================================================
      // 4. DISPLAY LOGIC (What you see on screen)
      // ============================================================
      
      if (submission.status === 'published') {
        setIsReadOnly(true);
      }

      // If published, show the Final Grade (90). If new, show the Initial (75).
      if (submission.grade) {
        setGradingResult(submission.grade);
      } else if (initialAiGrade) {
        setGradingResult(initialAiGrade);
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
      setGradingResult(result); // Update UI
      console.log('✅ Auto-grade complete:', result);
      
      return result; // Return raw data for locking

    } catch (error) {
      console.error('Error auto-grading:', error);
      showNotification('Auto-grading failed', 'error');
      return null;
    } finally {
      setGrading(false);
    }
  };

  const handleRefreshGrade = async () => {
    if (isReadOnly) return;
    if (!allElements.length || !exerciseData) return;
    
    // Updates UI Grade (Final), leaves Initial Grade (Thesis) alone
    await performAutoGrade(allElements, exerciseData);
    showNotification('Grade recalculated');
  };

  const handlePublishGrade = async () => {
    if (isReadOnly) return;

    try {
      setPublishingGrade(true);
      const submissionRef = doc(db, 'submissions', submissionId);
      
      const updateData = {
        grade: gradingResult, // Final Grade (What student sees)
        detectedERD: { elements: allElements },
        gradedAt: serverTimestamp(),
        status: 'published'
      };

      // Ensure Initial Grade is preserved (Redundant safety check)
      if (initialAiGrade) {
        updateData.initialAiGrade = initialAiGrade;
      }

      await updateDoc(submissionRef, updateData);
      
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
      <LecturerGradeERDComponent 
        loading={loading}
        grading={grading}
        publishingGrade={publishingGrade}
        studentSubmission={studentSubmission}
        exerciseData={exerciseData}
        allElements={allElements}
        setAllElements={setAllElements}
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