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
import { uploadToCloudinary } from '../../config/cloudinary'; // 🔄 Same import, new functionality
import { useAuthState } from 'react-firebase-hooks/auth';
import StudentSubmitClass from '../../components/class/student-submit-exercise';
import DashboardHeader from '../../components/dashboard/dashboard-header';
import { setDoc } from 'firebase/firestore';

const SubmitExercise = () => {
  const { classId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  
  // Component state (unchanged)
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [additionalComments, setAdditionalComments] = useState('');
  
  // Submission and validation states (unchanged)
  const [submitted, setSubmitted] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  
  // Track existing submission data (unchanged)
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [editCount, setEditCount] = useState(0);
  const [maxEdits] = useState(2);

  // 🔄 All existing useEffect and helper functions stay the same
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
        setEditCount(progressData.editCount || 0);
        setSubmitted(progressData.submitted || false);
        
        console.log('📋 Found existing submission:', {
          editCount: progressData.editCount || 0,
          submitted: progressData.submitted,
          maxEdits
        });
      } else {
        console.log('📝 No existing submission found');
        setExistingSubmission(null);
        setEditCount(0);
        setSubmitted(false);
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 All existing validation and UI functions stay the same
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

  /**
   * 🔄 UPDATED: Handle submission - Now uses API with metadata
   */
  const handleSubmitExercise = async () => {
    setValidationMessage(null);

    if (isPastDue()) {
      showValidationMessage('❌ Cannot submit - assignment is past due date', 'error');
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

    if (existingSubmission && editCount >= maxEdits) {
      showValidationMessage(
        `🚫 Maximum edit attempts (${maxEdits}) reached. You cannot resubmit this exercise.`, 
        'error'
      );
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Starting exercise submission...');

      // 🆕 STEP 1: Upload to Cloudinary via API with metadata
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
      console.log('🎯 Predictable filename:', uploadData.predictableFileName);
      console.log('🔄 Is overwrite:', uploadData.isOverwrite);

      // STEP 2: Check for existing submission (unchanged)
      const submissionsRef = collection(db, 'submissions');
      const existingQuery = query(
        submissionsRef,
        where('studentId', '==', user.uid),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const existingDocs = await getDocs(existingQuery);

      // STEP 3: Create submission data (unchanged)
      const submissionData = {
        studentId: user.uid,
        studentName: user.displayName || user.email || 'Unknown Student',
        studentEmail: user.email || '',
        classId: classId,
        exerciseId: exerciseId,
        exerciseTitle: exercise.title,
        fileURL: uploadData.url, // 🎯 Same URL every time for same student+exercise!
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
        grade: null,
        feedback: null,
        
        // 🆕 NEW: Add overwrite info
        isOverwrite: uploadData.isOverwrite,
        predictableFileName: uploadData.predictableFileName
      };

      // STEP 4: Save to Firestore (unchanged)
      if (existingDocs.empty) {
        await addDoc(submissionsRef, submissionData);
        console.log('✅ New submission created successfully');
      } else {
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, 'submissions', existingDoc.id), {
          ...submissionData,
          resubmittedAt: new Date()
        });
        console.log('✅ Submission updated successfully (resubmission with same URL!)');
      }

      // STEP 5: Save to studentProgress (unchanged)
      const newEditCount = existingSubmission ? (editCount + 1) : 0;
      
      const progressData = {
        studentId: user.uid,
        classId: classId,
        exerciseId: exerciseId,
        submitted: true,
        isCompleted: true,
        status: 'completed',
        fileUrl: uploadData.url, // 🎯 Same URL always!
        fileName: selectedFile.name,
        submittedAt: new Date(),
        updatedAt: new Date(),
        editCount: newEditCount,
        maxEdits: maxEdits,
        isResubmission: existingSubmission ? true : false
      };

      const progressDocId = `${user.uid}_${classId}_${exerciseId}`;
      await setDoc(doc(db, 'studentProgress', progressDocId), progressData);
      console.log('✅ Progress saved with editCount:', newEditCount);

      setExistingSubmission(progressData);
      setEditCount(newEditCount);

      // SUCCESS STATE
      setSubmitted(true);
      setUploading(false);
      
      const isResubmission = existingSubmission !== null;
      const remainingEdits = maxEdits - newEditCount;
      
      let successMsg = '🎉 Exercise submitted successfully!';
      if (isResubmission) {
        successMsg += ` (Same URL - overwrote previous file!)`;
        if (remainingEdits > 0) {
          successMsg += ` ${remainingEdits} edit${remainingEdits === 1 ? '' : 's'} remaining.`;
        }
      }
      
      showValidationMessage(successMsg, 'success', 4000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('❌ Error submitting exercise:', error);
      setUploading(false);
      
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

  // 🔄 All existing helper functions stay the same
  const handleGoBack = () => {
    navigate(`/student/class/${classId}`);
  };

  const isSubmissionDisabled = () => {
    return uploading || isPastDue() || (existingSubmission && editCount >= maxEdits);
  };

  const getSubmissionButtonText = () => {
    if (uploading) return 'Uploading...';
    if (isPastDue()) return 'Past Due Date';
    if (!existingSubmission) return 'Submit Exercise';
    if (editCount >= maxEdits) return 'Maximum Edits Reached';
    return `Resubmit (${maxEdits - editCount} edit${maxEdits - editCount === 1 ? '' : 's'} left)`;
  };

  const canEdit = () => {
    return !isPastDue() && (!existingSubmission || editCount < maxEdits);
  };

  // 🔄 Return statement unchanged
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
        editCount={editCount}
        maxEdits={maxEdits}
        isSubmissionDisabled={isSubmissionDisabled()}
        submissionButtonText={getSubmissionButtonText()}
        canEdit={canEdit()}
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