// src/pages/student/submit-exercise.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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


// ✅ UPDATED: Only need Firestore and auth now
import { db, auth } from '../../config/firebase';

// 🌤️ NEW: Import Cloudinary upload function (same as lecturer page)
import { uploadToCloudinary } from '../../config/cloudinary';

import { useAuthState } from 'react-firebase-hooks/auth';
import StudentSubmitClass from '../../components/class/student-submit-exercise';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const SubmitExercise = () => {
  // URL parameters and navigation (same as before)
  const { classId, exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Auth state (same as before)
  const [user] = useAuthState(auth);
  
  // Component state (same as before)
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [additionalComments, setAdditionalComments] = useState('');

  // Load exercise data when component mounts (UNCHANGED - this stays the same)
  useEffect(() => {
    if (classId && exerciseId) {
      loadExerciseData();
    }
  }, [classId, exerciseId]);

  /**
   * 📚 Load exercise data from Firebase (UNCHANGED)
   * Gets exercise details from the classes collection
   */
  const loadExerciseData = async () => {
  try {
    console.log('📚 Loading exercise data for:', { classId, exerciseId });
    
    // ADD THIS DEBUG CODE:
    const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
    console.log('🔍 Exercise document path:', exerciseRef.path);
    
    const exerciseDoc = await getDoc(exerciseRef);
    console.log('📄 Exercise doc exists:', exerciseDoc.exists());
    console.log('📄 Exercise doc data:', exerciseDoc.data());
    
    if (!exerciseDoc.exists()) {
      console.log('❌ Exercise not found');
      // ADD: List all exercises in this class
      const allExercisesQuery = query(collection(db, 'classes', classId, 'exercises'));
      const allExercisesSnapshot = await getDocs(allExercisesQuery);
      console.log('📋 All exercises in class:', allExercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title
      })));
      setLoading(false);
      return;
    }

    // If exercise exists, set it
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
   * 📁 Handle file selection from input (ENHANCED with better validation)
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  /**
   * 🛡️ Validate file and set it if valid (ENHANCED validation)
   */
  const validateAndSetFile = (file) => {
    // ✅ Check file type - must be an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPEG, GIF, WebP)');
      return;
    }

    // ✅ Check file size (10MB limit - Cloudinary free tier is generous!)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    // 🔒 Basic filename validation for security
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    if (sanitizedName !== file.name) {
      console.warn('Filename was sanitized for security');
    }

    console.log('✅ File selected and validated:', file.name);
    setSelectedFile(file);
  };

  /**
   * 🖱️ Handle drag over event (UNCHANGED)
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  /**
   * 🖱️ Handle drag leave event (UNCHANGED)
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  /**
   * 🖱️ Handle file drop (UNCHANGED)
   */
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  /**
   * 🗑️ Remove selected file (UNCHANGED)
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    console.log('📁 File removed');
  };

  /**
   * 🚀 Handle submission of exercise (MAJOR CHANGES HERE!)
   * This is where we switch from Firebase Storage to Cloudinary
   */
  const handleSubmitExercise = async () => {
    // ⚠️ Validation checks (same as before)
    if (!selectedFile) {
      alert('Please select a file to submit');
      return;
    }

    if (!user) {
      alert('You must be logged in to submit');
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Starting exercise submission...');

      // 🌤️ STEP 1: Upload file to Cloudinary (NEW!)
      console.log('☁️ Uploading file to Cloudinary...');
      
      // This uses the same uploadToCloudinary function from the lecturer page
      // It returns an object with url, publicId, originalName, etc.
      const cloudinaryData = await uploadToCloudinary(
        selectedFile, 
        'student-submissions' // folder name in Cloudinary
      );
      
      console.log('✅ File uploaded to Cloudinary:', cloudinaryData.url);

      // 🔍 STEP 2: Check if submission already exists (same as before)
      const submissionsRef = collection(db, 'submissions');
      const existingQuery = query(
        submissionsRef,
        where('studentId', '==', user.uid),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const existingDocs = await getDocs(existingQuery);

      // 📝 STEP 3: Create submission data (UPDATED with Cloudinary data)
      const submissionData = {
        // Student info (same as before)
        studentId: user.uid,
        studentName: user.displayName || user.email || 'Unknown Student',
        studentEmail: user.email || '',
        
        // Exercise info (same as before)
        classId: classId,
        exerciseId: exerciseId,
        exerciseTitle: exercise.title,
        
        // 🌤️ FILE DATA: Now using Cloudinary instead of Firebase Storage!
        fileURL: cloudinaryData.url,              // Main URL to view the image
        fileName: cloudinaryData.originalName,    // Original filename
        cloudinaryPublicId: cloudinaryData.publicId, // For future operations (delete, transform, etc.)
        fileType: cloudinaryData.fileType,        // MIME type
        fileSize: cloudinaryData.fileSize,        // File size in bytes
        
        // 🖼️ IMAGE-SPECIFIC DATA: Cloudinary gives us extra image info!
        imageWidth: cloudinaryData.width,         // Image width in pixels
        imageHeight: cloudinaryData.height,       // Image height in pixels
        imageFormat: cloudinaryData.format,       // Image format (jpg, png, etc.)
        
        // Other submission data (same as before)
        comments: additionalComments.trim(),
        submittedAt: new Date(),
        uploadedAt: cloudinaryData.createdAt,     // When it was uploaded to Cloudinary
        status: 'submitted',
        grade: null,
        feedback: null
      };

      // 💾 STEP 4: Save to Firestore (same logic as before)
      if (existingDocs.empty) {
        // Create new submission
        await addDoc(submissionsRef, submissionData);
        console.log('✅ New submission created');
        alert('Exercise submitted successfully!');
      } else {
        // Update existing submission
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, 'submissions', existingDoc.id), {
          ...submissionData,
          resubmittedAt: new Date()
        });
        console.log('✅ Submission updated');
        alert('Exercise resubmitted successfully!');
      }

      // Navigate back to class page
      navigate(`/student/class/${classId}`);
      
    } catch (error) {
      console.error('❌ Error submitting exercise:', error);
      
      // 🚨 Better error handling
      if (error.message.includes('Upload failed')) {
        alert(`File upload error: ${error.message}`);
      } else if (error.message.includes('Firestore')) {
        alert('Database error. File uploaded but submission not saved. Please contact support.');
      } else {
        alert('Error submitting exercise. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  /**
   * 🔙 Handle going back to class page (UNCHANGED)
   */
  const handleGoBack = () => {
    navigate(`/student/class/${classId}`);
  };

  // 🎨 RENDER: Same JSX structure as before
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