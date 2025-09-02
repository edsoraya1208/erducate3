// src/pages/student/submit-exercise.jsx
import React, { useState, useEffect } from 'react';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import StudentSubmitClass from '../../components/class/student-submit-exercise';
import DashboardHeader from '../../components/dashboard/dashboard-header';
import { setDoc } from 'firebase/firestore';

const SubmitExercise = () => {
  const { classId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  
  // Component state
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [additionalComments, setAdditionalComments] = useState('');
  
  // Submission and validation states
  const [submitted, setSubmitted] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  
  // Track existing submission data
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [editCount, setEditCount] = useState(0);
  const [maxEdits] = useState(2); // Maximum allowed edits

  useEffect(() => {
    if (classId && exerciseId && user) {
      loadExerciseAndSubmissionData();
    }
  }, [classId, exerciseId, user]);

  /**
   * 🆕 NEW: Helper function to check if due date has passed
   */
  const isPastDue = () => {
    if (!exercise?.dueDate) return false;
    const dueDate = exercise.dueDate.toDate ? exercise.dueDate.toDate() : new Date(exercise.dueDate);
    return new Date() > dueDate;
  };

  /**
   * 📚 Load exercise data AND check for existing submission
   */
  const loadExerciseAndSubmissionData = async () => {
    try {
      console.log('📚 Loading exercise and submission data for:', { classId, exerciseId, userId: user.uid });
      
      // Load exercise data
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
      
      // Check for existing submission in studentProgress
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

  /**
   * 🚨 Show validation message (green/red)
   */
  const showValidationMessage = (text, type = 'error', duration = 4000) => {
    setValidationMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => {
        setValidationMessage(null);
      }, duration);
    }
  };

  /**
   * 🛡️ Validate file and set it if valid - WITH VISUAL FEEDBACK
   */
  const validateAndSetFile = (file) => {
    console.log('📁 File selected:', file.name, file.type, file.size);

    // Clear any previous validation messages
    setValidationMessage(null);

    // ✅ File type validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showValidationMessage('❌ Invalid file type. Please select PNG, JPEG, GIF, or WebP files only.', 'error');
      return;
    }

    // ✅ File size validation (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showValidationMessage('❌ File too large. Maximum size is 2MB.', 'error');
      return;
    }

    // ✅ Success - file is valid
    setSelectedFile(file);
    showValidationMessage('✅ File selected successfully!', 'success', 2000);
    console.log('✅ File validation passed');
  };

  /**
   * 📁 Handle file selection
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  /**
   * 🖱️ Drag and drop handlers
   */
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

  /**
   * 🗑️ Remove selected file
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationMessage(null);
    console.log('📁 File removed');
  };

  /**
   * 🚀 Handle submission - WITH DUE DATE AND EDIT LIMIT ENFORCEMENT
   */
  const handleSubmitExercise = async () => {
    // Clear validation messages
    setValidationMessage(null);

    // 🆕 NEW: Check due date FIRST
    if (isPastDue()) {
      showValidationMessage('❌ Cannot submit - assignment is past due date', 'error');
      return;
    }

    // ⚠️ Validation checks
    if (!selectedFile) {
      showValidationMessage('❌ Please select a file to submit', 'error');
      return;
    }

    if (!user) {
      showValidationMessage('❌ You must be logged in to submit', 'error');
      return;
    }

    // Check edit limit BEFORE proceeding
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

      // STEP 1: Upload to Firebase Storage
      console.log('🔥 Uploading file to Firebase Storage...');
      const timestamp = Date.now();
      const fileName = `${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, `submissions/${user.uid}/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Create data object
      const uploadData = {
        url: downloadURL,
        originalName: selectedFile.name,
        publicId: `submissions/${user.uid}/${fileName}`,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        createdAt: new Date().toISOString(),
        width: null,
        height: null,
        format: selectedFile.name.split('.').pop()
      };
      console.log('✅ File uploaded to Firebase Storage:', uploadData.url);

      // STEP 2: Check for existing submission
      const submissionsRef = collection(db, 'submissions');
      const existingQuery = query(
        submissionsRef,
        where('studentId', '==', user.uid),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const existingDocs = await getDocs(existingQuery);

      // STEP 3: Create submission data
      const submissionData = {
        studentId: user.uid,
        studentName: user.displayName || user.email || 'Unknown Student',
        studentEmail: user.email || '',
        classId: classId,
        exerciseId: exerciseId,
        exerciseTitle: exercise.title,
        fileURL: uploadData.url,
        fileName: uploadData.originalName,
        firebasePublicId: uploadData.publicId,
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
        feedback: null
      };

      // STEP 4: Save to Firestore
      if (existingDocs.empty) {
        await addDoc(submissionsRef, submissionData);
        console.log('✅ New submission created successfully');
      } else {
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, 'submissions', existingDoc.id), {
          ...submissionData,
          resubmittedAt: new Date()
        });
        console.log('✅ Submission updated successfully (resubmission)');
      }

      // STEP 5: Save to studentProgress with proper edit counting
      const newEditCount = existingSubmission ? (editCount + 1) : 0;
      
      const progressData = {
        studentId: user.uid,
        classId: classId,
        exerciseId: exerciseId,
        submitted: true,
        isCompleted: true,
        status: 'completed',
        fileUrl: uploadData.url,
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

      // Update local state
      setExistingSubmission(progressData);
      setEditCount(newEditCount);

      // SUCCESS STATE
      setSubmitted(true);
      setUploading(false);
      
      // Show success message with edit info
      const isResubmission = existingSubmission !== null;
      const remainingEdits = maxEdits - newEditCount;
      
      let successMsg = '🎉 Exercise submitted successfully!';
      if (isResubmission && remainingEdits > 0) {
        successMsg += ` (${remainingEdits} edit${remainingEdits === 1 ? '' : 's'} remaining)`;
      } else if (isResubmission && remainingEdits === 0) {
        successMsg += ' (No more edits allowed)';
      }
      
      showValidationMessage(successMsg, 'success', 3000);

      // Scroll to top on success
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('❌ Error submitting exercise:', error);
      setUploading(false);
      
      // Better error handling with visual feedback
      if (error.message.includes('Upload failed')) {
        showValidationMessage('❌ File upload failed. Please try again.', 'error');
      } else if (error.message.includes('Firestore')) {
        showValidationMessage('❌ Database error. Please contact support.', 'error');
      } else {
        showValidationMessage('❌ Submission failed. Please try again.', 'error');
      }
    }
  };

  /**
   * 🔙 Handle going back
   */
  const handleGoBack = () => {
    navigate(`/student/class/${classId}`);
  };

  // 🔧 Check if submission is disabled
  const isSubmissionDisabled = () => {
    return uploading || isPastDue() || (existingSubmission && editCount >= maxEdits);
  };

  // 🔧 Get submission button text
  const getSubmissionButtonText = () => {
    if (uploading) return 'Uploading...';
    if (isPastDue()) return 'Past Due Date';
    if (!existingSubmission) return 'Submit Exercise';
    if (editCount >= maxEdits) return 'Maximum Edits Reached';
    return `Resubmit (${maxEdits - editCount} edit${maxEdits - editCount === 1 ? '' : 's'} left)`;
  };

  // 🔧 Check if editing is allowed
  const canEdit = () => {
    return !isPastDue() && (!existingSubmission || editCount < maxEdits);
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader 
        userType="student"
        currentPage="submit-exercise"
        additionalNavItems={[]}
      />
      
      <StudentSubmitClass 
        // Exercise data
        exercise={exercise}
        loading={loading}
        
        // File upload state
        selectedFile={selectedFile}
        dragOver={dragOver}
        uploading={uploading}
        
        // Form data
        additionalComments={additionalComments}
        
        // Submission states
        submitted={submitted}
        validationMessage={validationMessage}
        
        // 🆕 FIXED: Pass correct props that match UI component
        existingSubmission={existingSubmission}
        editCount={editCount}
        maxEdits={maxEdits}
        isSubmissionDisabled={isSubmissionDisabled()}
        submissionButtonText={getSubmissionButtonText()}
        canEdit={canEdit()} // 🆕 NEW: Pass editing permission
        
        // Event handlers
        onFileSelect={handleFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onRemoveFile={handleRemoveFile}
        onCommentsChange={setAdditionalComments}
        onSubmitExercise={handleSubmitExercise}
        onGoBack={handleGoBack}
      />
    </div>
  );
};

export default SubmitExercise;