// src/pages/student/submit-exercise.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc,
  query,
  where,
  getDocs 
} from 'firebase/firestore';

import { db, auth } from '../../config/firebase';
import { uploadToCloudinary } from '../../config/cloudinary';
import { useAuthState } from 'react-firebase-hooks/auth';
import StudentSubmitClass from '../../components/class/student-submit-exercise';
import DashboardHeader from '../../components/dashboard/dashboard-header';
import { setDoc } from 'firebase/firestore';

const SubmitExercise = () => {
  const { classId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [additionalComments, setAdditionalComments] = useState('');

  const [aiLoadingMessage, setAiLoadingMessage] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  
  const [existingSubmission, setExistingSubmission] = useState(null);
  // ❌ REMOVED: editCount, maxEdits (edit count feature disabled)
  // const [editCount, setEditCount] = useState(0);
  // const [maxEdits] = useState(2);

  const [submissionStatus, setSubmissionStatus] = useState(null);

  useEffect(() => {
    if (classId && exerciseId && user) {
      loadExerciseAndSubmissionData();
    }
  }, [classId, exerciseId, user]);

  const isPastDue = () => {
    if (!exercise?.dueDate) return false;
    const dueDate = exercise.dueDate.toDate ? exercise.dueDate.toDate() : new Date(exercise.dueDate);
    return new Date() > dueDate;
  };

  const loadExerciseAndSubmissionData = async () => {
    try {
      console.log('📚 Loading exercise and submission data for:', { classId, exerciseId, userId: user.uid });
      
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      const exerciseDoc = await getDoc(exerciseRef);
      
      if (!exerciseDoc.exists()) {
        console.log('❌ Exercise not found');
        setLoading(false);
        return;
      }

      const exerciseData = { id: exerciseDoc.id, ...exerciseDoc.data() };
      setExercise(exerciseData);
      console.log('✅ Exercise loaded:', exerciseData.title);
      
      const progressDocId = `${user.uid}_${classId}_${exerciseId}`;
      const progressRef = doc(db, 'studentProgress', progressDocId);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        const progressData = progressDoc.data();
        setExistingSubmission(progressData);
        // ❌ REMOVED: setEditCount(progressData.editCount || 0);
        setSubmitted(progressData.submitted || false);
        
        if (progressData.comments) {
          setAdditionalComments(progressData.comments);
        }
        
        console.log('📋 Found existing submission:', {
          submitted: progressData.submitted
        });
      } else {
        console.log('📝 No existing submission found');
        setExistingSubmission(null);
        // ❌ REMOVED: setEditCount(0);
        setSubmitted(false);
      }

      const status = await loadSubmissionStatus();
      setSubmissionStatus(status);
      console.log('📊 Submission status:', status);
        
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionStatus = async () => {
    try {
      const submissionsRef = collection(db, 'submissions');
      const statusQuery = query(
        submissionsRef,
        where('studentId', '==', user.uid),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const statusDocs = await getDocs(statusQuery);
      
      if (!statusDocs.empty) {
        const submissionData = statusDocs.docs[0].data();
        return submissionData.status;
      }
      return null;
    } catch (error) {
      console.error('Error loading submission status:', error);
      return null;
    }
  };

  const showValidationMessage = (text, type = 'error', duration = 4000) => {
    setValidationMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => {
        setValidationMessage(null);
      }, duration);
    }
  };

  const validateAndSetFile = (file) => {
    console.log('📁 File selected:', file.name, file.type, file.size);
    setValidationMessage(null);

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showValidationMessage('❌ Invalid file type. Please select PNG, JPEG, GIF, or WebP files only.', 'error');
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showValidationMessage('❌ File too large. Maximum size is 2MB.', 'error');
      return;
    }

    setSelectedFile(file);
    showValidationMessage('✅ File selected successfully!', 'success', 2000);
    console.log('✅ File validation passed');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationMessage(null);
    console.log('📁 File removed');
  };

  const handleCommentsChange = useCallback((value) => {
    setAdditionalComments(value);
  }, []);

  const isGradingLocked = () => {
    return submissionStatus === 'published' || 
           (existingSubmission?.feedback !== null && existingSubmission?.feedback !== undefined);
  };

  const handleSubmitExercise = async () => {
    setValidationMessage(null);

    if (isPastDue()) {
      showValidationMessage('❌ Cannot submit - assignment is past due date', 'error');
      return;
    }

    if (isGradingLocked()) {
      showValidationMessage(
        '❌ Cannot resubmit - your submission has been graded by the lecturer. Contact your instructor if you need to make changes.', 
        'error',
        6000
      );
      return;
    }

    if (!selectedFile) {
      showValidationMessage('❌ Please select a file to submit', 'error');
      return;
    }

    if (!user) {
      showValidationMessage('❌ You must be logged in to submit', 'error');
      return;
    }

    // ❌ REMOVED: Edit count validation
    // if (existingSubmission && editCount >= maxEdits) { ... }

    try {
      setUploading(true);
      console.log('📤 Starting exercise submission...');

      console.log('🚀 Uploading file via Vercel API...');
      const uploadData = await uploadToCloudinary(
        selectedFile, 
        'student-submissions',
        {
          studentId: user.uid,
          exerciseId: exerciseId,
          classId: classId
        }
      );
      
      console.log('✅ File uploaded via API:', uploadData.url);

      console.log('🤖 Calling ERD detection API...');
      setAiLoadingMessage('🤖 Analyzing your ERD diagram...\nPlease wait while AI detects elements');
      let detectedERD = null;
      
      try {
        const detectionResponse = await fetch('https://ai-api-server-vmaz.onrender.com/detect-erd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: uploadData.url })
        });

        if (!detectionResponse.ok) {
          console.error('❌ Detection API failed:', detectionResponse.statusText);
          setUploading(false);
          setAiLoadingMessage('');
          showValidationMessage(
            '❌ ERD detection failed. Please try again or contact your instructor if the problem persists.', 
            'error', 
            6000
          );
          return;
        }

        const detectionResult = await detectionResponse.json();
        
        if (detectionResult.isERD && detectionResult.elements && detectionResult.elements.length > 0) {
          detectedERD = {
            elements: detectionResult.elements,
            detectedAt: new Date(),
            isERD: true
          };
          console.log('✅ ERD detection successful:', detectedERD.elements.length, 'elements found');
        } else {
          console.warn('⚠️ No ERD elements detected:', detectionResult);
          setUploading(false);
          setAiLoadingMessage('');
          showValidationMessage(
            '❌ No ERD elements detected in your image. Please ensure you uploaded a valid ERD diagram and try again.', 
            'error', 
            6000
          );
          return;
        }
      } catch (detectionError) {
        console.error('❌ ERD detection error:', detectionError);
        setUploading(false);
        setAiLoadingMessage('');
        showValidationMessage(
          '❌ ERD detection service unavailable. Please try again in a few moments.', 
          'error', 
          6000
        );
        return;
      }

      let initialGrade = null;
      
      if (detectedERD?.elements?.length > 0 && exercise.correctAnswer) {
        try {
          console.log('🎓 Calling auto-grade API...');
          setAiLoadingMessage('🎓 Auto-grading your submission...\nAI is evaluating your ERD');
          const gradeResponse = await fetch('https://ai-api-server-vmaz.onrender.com/autograde-erd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentElements: detectedERD.elements,
              correctAnswer: exercise.correctAnswer,
              rubricStructured: exercise.rubricStructured || null
            })
          });
          
          if (!gradeResponse.ok) {
            console.error('❌ Auto-grade API failed:', gradeResponse.statusText);
            setUploading(false);
            setAiLoadingMessage('');
            showValidationMessage(
              '❌ Auto-grading failed. Please try again or contact your instructor if the problem persists.', 
              'error', 
              6000
            );
            return;
          }
          
          initialGrade = await gradeResponse.json();
          console.log('✅ Auto-grade successful:', initialGrade.totalScore);
          
        } catch (gradeError) {
          console.error('❌ Auto-grade error:', gradeError);
          setUploading(false);
          setAiLoadingMessage('');
          showValidationMessage(
            '❌ Auto-grading service unavailable. Please try again in a few moments.', 
            'error', 
            6000
          );
          return;
        }
      }

      console.log('✅ All validations passed - proceeding to save submission');

      const submissionsRef = collection(db, 'submissions');
      const existingQuery = query(
        submissionsRef,
        where('studentId', '==', user.uid),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const existingDocs = await getDocs(existingQuery);

      const submissionData = {
        studentId: user.uid,
        studentName: user.displayName || user.email || 'Unknown Student',
        studentEmail: user.email || '',
        classId: classId,
        exerciseId: exerciseId,
        exerciseTitle: exercise.title,
        fileURL: uploadData.url,
        fileName: uploadData.originalName,
        cloudinaryPublicId: uploadData.publicId,
        fileType: uploadData.fileType,
        fileSize: uploadData.fileSize,
        imageWidth: uploadData.width || null,
        imageHeight: uploadData.height || null,
        imageFormat: uploadData.format || null,
        comments: additionalComments.trim(),
        submittedAt: new Date(),
        uploadedAt: uploadData.createdAt,
        
        status: 'submitted',
        
        grade: initialGrade,
        autoGradedAt: initialGrade ? new Date() : null,
        hasAutoGrade: !!initialGrade,
        
        feedback: null,
        isOverwrite: uploadData.isOverwrite,
        predictableFileName: uploadData.predictableFileName,
        
        detectedERD: detectedERD
      };

      if (existingDocs.empty) {
        await addDoc(submissionsRef, submissionData);
        console.log('✅ New submission created successfully');
      } else {
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, 'submissions', existingDoc.id), {
          ...submissionData,
          resubmittedAt: new Date()
        });
        console.log('✅ Submission updated successfully');
      }

      // ❌ REMOVED: const newEditCount = existingSubmission ? (editCount + 1) : 0;
      
      const progressData = {
        studentId: user.uid,
        classId: classId,
        exerciseId: exerciseId,
        submitted: true,
        isCompleted: true,
        status: 'completed',
        fileUrl: uploadData.url,
        fileName: selectedFile.name,
        comments: additionalComments.trim(),
        submittedAt: new Date(),
        updatedAt: new Date(),
        // ❌ REMOVED: editCount, maxEdits
        isResubmission: existingSubmission ? true : false
      };

      const progressDocId = `${user.uid}_${classId}_${exerciseId}`;
      await setDoc(doc(db, 'studentProgress', progressDocId), progressData);
      console.log('✅ Progress saved');

      setExistingSubmission(progressData);
      // ❌ REMOVED: setEditCount(newEditCount);

      setSubmitted(true);
      setUploading(false);
      
      // ❌ REMOVED: remainingEdits calculation and display
      let successMsg = '🎉 Exercise submitted successfully!';
      
      showValidationMessage(successMsg, 'success', 6000);
      setAiLoadingMessage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        navigate(`/student/class/${classId}`);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error submitting exercise:', error);
      setUploading(false);
      setAiLoadingMessage('');
      
      if (error.message.includes('Network error')) {
        showValidationMessage('❌ Network error. Please check your connection.', 'error');
      } else if (error.message.includes('File too large')) {
        showValidationMessage('❌ File upload failed: File too large (max 2MB).', 'error');
      } else if (error.message.includes('Invalid file type')) {
        showValidationMessage('❌ Invalid file type. Please select an image file.', 'error');
      } else {
        showValidationMessage('❌ Submission failed. Please try again.', 'error');
      }
    }
  };

  const handleGoBack = () => {
    navigate(`/student/class/${classId}`);
  };

  const isSubmissionDisabled = () => {
    // ❌ REMOVED: editCount check
    return uploading || isPastDue();
  };

  const getSubmissionButtonText = () => {
    if (uploading) return 'Uploading...';
    if (isGradingLocked()) return 'Grade Published - Locked';
    if (isPastDue()) return 'Past Due Date';
    if (!existingSubmission) return 'Submit Exercise';
    
    // ❌ REMOVED: Edit count display
    // if (editCount >= maxEdits) return 'Maximum Edits Reached';
    // return `Resubmit (${maxEdits - editCount} edits left)`;
    
    return 'Resubmit Exercise';
  };

  const canEdit = () => {
    // ❌ REMOVED: editCount check
    return !isPastDue() && !isGradingLocked();
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader 
        userType="student"
        currentPage="submit-exercise"
        additionalNavItems={[]}
      />
      
      <StudentSubmitClass 
        exercise={exercise}
        loading={loading}
        selectedFile={selectedFile}
        dragOver={dragOver}
        uploading={uploading}
        additionalComments={additionalComments}
        submitted={submitted}
        validationMessage={validationMessage}
        existingSubmission={existingSubmission}
        // ❌ REMOVED: editCount, maxEdits props
        isSubmissionDisabled={isSubmissionDisabled()}
        submissionButtonText={getSubmissionButtonText()}
        canEdit={canEdit()}
        aiLoadingMessage={aiLoadingMessage}
        onFileSelect={handleFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onRemoveFile={handleRemoveFile}
        onCommentsChange={handleCommentsChange}
        onSubmitExercise={handleSubmitExercise}
        onGoBack={handleGoBack}
      />
    </div>
  );
};

export default SubmitExercise;