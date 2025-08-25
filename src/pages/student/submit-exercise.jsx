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
import { uploadToCloudinary } from '../../config/cloudinary';
import { useAuthState } from 'react-firebase-hooks/auth';
import StudentSubmitClass from '../../components/class/student-submit-exercise';
import DashboardHeader from '../../components/dashboard/dashboard-header';

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
  
  // 🆕 NEW: Submission and validation states
  const [submitted, setSubmitted] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);

  useEffect(() => {
    if (classId && exerciseId) {
      loadExerciseData();
    }
  }, [classId, exerciseId]);

  /**
   * 📚 Load exercise data from Firebase
   */
  const loadExerciseData = async () => {
    try {
      console.log('📚 Loading exercise data for:', { classId, exerciseId });
      
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
      
    } catch (error) {
      console.error('❌ Error loading exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🚨 Show validation message (green/red)
   */
  const showValidationMessage = (text, type = 'error', duration = 4000) => {
    setValidationMessage({ text, type });
    setTimeout(() => {
      setValidationMessage(null);
    }, duration);
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
   * 🛡️ Validate file and set it if valid - WITH VISUAL FEEDBACK
   */
  const validateAndSetFile = (file) => {
    // Clear any previous validation messages
    setValidationMessage(null);

    // ✅ Check file type
    if (!file.type.startsWith('image/')) {
      showValidationMessage('❌ Please select an image file (PNG, JPEG, GIF, WebP)', 'error');
      return;
    }

    // ✅ Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showValidationMessage('❌ File too large. Maximum size is 10MB', 'error');
      return;
    }

    // 🔒 Basic filename validation
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    if (sanitizedName !== file.name) {
      console.warn('Filename was sanitized for security');
    }

    console.log('✅ File selected and validated:', file.name);
    setSelectedFile(file);
    showValidationMessage(`✅ File "${file.name}" selected successfully`, 'success', 2000);
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
   * 🚀 Handle submission - WITH BETTER UX
   */
  const handleSubmitExercise = async () => {
    // Clear validation messages
    setValidationMessage(null);

    // ⚠️ Validation checks - WITH VISUAL FEEDBACK
    if (!selectedFile) {
      showValidationMessage('❌ Please select a file to submit', 'error');
      return;
    }

    if (!user) {
      showValidationMessage('❌ You must be logged in to submit', 'error');
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Starting exercise submission...');

      // 🌤️ STEP 1: Upload to Cloudinary
      console.log('☁️ Uploading file to Cloudinary...');
      const cloudinaryData = await uploadToCloudinary(
        selectedFile, 
        'student-submissions'
      );
      console.log('✅ File uploaded to Cloudinary:', cloudinaryData.url);

      // 🔍 STEP 2: Check for existing submission
      const submissionsRef = collection(db, 'submissions');
      const existingQuery = query(
        submissionsRef,
        where('studentId', '==', user.uid),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const existingDocs = await getDocs(existingQuery);

      // 📝 STEP 3: Create submission data
      const submissionData = {
        studentId: user.uid,
        studentName: user.displayName || user.email || 'Unknown Student',
        studentEmail: user.email || '',
        classId: classId,
        exerciseId: exerciseId,
        exerciseTitle: exercise.title,
        fileURL: cloudinaryData.url,
        fileName: cloudinaryData.originalName,
        cloudinaryPublicId: cloudinaryData.publicId,
        fileType: cloudinaryData.fileType,
        fileSize: cloudinaryData.fileSize,
        imageWidth: cloudinaryData.width,
        imageHeight: cloudinaryData.height,
        imageFormat: cloudinaryData.format,
        comments: additionalComments.trim(),
        submittedAt: new Date(),
        uploadedAt: cloudinaryData.createdAt,
        status: 'submitted',
        grade: null,
        feedback: null
      };

      // 💾 STEP 4: Save to Firestore
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

      // 🎉 SUCCESS STATE - Better UX
      setSubmitted(true);
      setUploading(false);
      
      // Show success message
      showValidationMessage('🎉 Exercise submitted successfully!', 'success', 3000);

      // Auto-navigate back after 3 seconds
      setTimeout(() => {
        navigate(`/student/class/${classId}`);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error submitting exercise:', error);
      setUploading(false);
      
      // 🚨 Better error handling with visual feedback
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
        
        // 🆕 NEW: Submission states
        submitted={submitted}
        validationMessage={validationMessage}
        
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