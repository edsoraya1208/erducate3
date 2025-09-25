// src/pages/lecturer/dashboard1.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useUser } from '../../contexts/UserContext';
import LecturerDashboard from '../../components/dashboard/lecturer-dashboard';
import DashboardHeader from '../../components/dashboard/dashboard-header'; // Import the new component

const Dashboard1 = () => {
  // State management for classes and UI
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    classId: null,
    className: '',
    isDeleting: false
  });

  // Hooks
  const [user, error] = useAuthState(auth);
  const { getUserDisplayName } = useUser();
  const navigate = useNavigate();

  // Generate unique 8-character class code
  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Fetch classes from Firebase for current instructor
  const loadClasses = async () => {
    try {
      setLoading(true);
      
      console.log('📚 Loading classes for user:', user?.uid);
      console.log('🔍 Query: classes where instructorId ==', user?.uid || "");
      
      const classesRef = collection(db, 'classes');
      const q = query(classesRef, where("instructorId", "==", user?.uid || ""));
      const querySnapshot = await getDocs(q);
      
      const classesData = [];
      querySnapshot.forEach((doc) => {
        classesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('📊 Classes found:', classesData.length);
      console.log('📋 Classes data:', classesData);
      
      setClasses(classesData);
    } catch (error) {
      console.error('❌ Error loading classes:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert('Error loading classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load classes when user is authenticated
  useEffect(() => {
    if (user) {
      loadClasses();
    }
  }, [user]);

  // Create new class with generated code
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    
    try {
      setCreating(true);
      
      console.log('🔥 Starting class creation debug...');
      console.log('🔐 Auth state:', auth.currentUser);
      console.log('🆔 User ID:', auth.currentUser?.uid);
      console.log('📧 User email:', auth.currentUser?.email);
      console.log('👤 User authenticated:', !!auth.currentUser);
      console.log('🏗️ Firebase config check:');
      console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
      console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
      console.log('Database instance:', db);
      
      const classCode = generateClassCode();
      
      const newClass = {
        title: newClassName.trim(),
        classCode: classCode,
        description: "Share this code with students to join your class",
        maxStudents: maxStudents ? parseInt(maxStudents) : null,
        currentStudents: 0,
        createdAt: new Date(),
        instructorId: user?.uid || "unknown",
        instructorName: user?.displayName || user?.email || "Unknown Instructor"
      };

      console.log('📋 Class data to be created:', newClass);
      console.log('📂 Collection path: classes');

      await addDoc(collection(db, 'classes'), newClass);
      
      console.log('✅ Class creation successful!');
      await loadClasses();
      
      // Reset modal state
      setShowCreateModal(false);
      setNewClassName('');
      setMaxStudents('');
      
      alert(`Class "${newClassName}" created successfully with code: ${classCode}`);
    } catch (error) {
      console.error('❌ Error creating class:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      console.error('Error stack:', error.stack);
      alert('Error creating class. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Copy class code to clipboard
  const handleCopyCode = async (classCode) => {
    try {
      await navigator.clipboard.writeText(classCode);
      alert(`Class code ${classCode} copied to clipboard!`);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Error copying code to clipboard');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (classId, className) => {
    setDeleteModal({
      isOpen: true,
      classId,
      className,
      isDeleting: false
    });
  };

// UPDATED: Complete delete function that removes class and ALL associated data from Cloudinary
const handleDeleteClass = async () => {
  setDeleteModal(prev => ({ ...prev, isDeleting: true }));
  
  // 🌐 API URL setup (matching your cloudinary config pattern)
  const isDevelopment = import.meta.env.DEV;
  const API_BASE_URL = isDevelopment 
    ? 'https://erducate3.vercel.app'  // Your deployed API
    : '';
  
  try {
    const classId = deleteModal.classId;
    const className = deleteModal.className;
    
    console.log('🗑️ Starting complete class deletion for:', classId);
    
    // STEP 1: GET ALL EXERCISES IN THIS CLASS
    const exercisesRef = collection(db, 'classes', classId, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesRef);
    
    console.log(`Found ${exercisesSnapshot.size} exercises to delete`);
    
    // STEP 2: DELETE EACH EXERCISE AND ITS ASSOCIATED DATA
    for (const exerciseDoc of exercisesSnapshot.docs) {
      const exerciseId = exerciseDoc.id;
      const exerciseData = exerciseDoc.data();
      
      console.log('Deleting exercise:', exerciseId);
      
      // 🔥 NEW: Delete exercise files from CLOUDINARY (not Firebase Storage)
      // Delete answer scheme file
      if (exerciseData.answerScheme?.publicId) {
        try {
          console.log('🗑️ Deleting answer scheme from Cloudinary:', exerciseData.answerScheme.publicId);
          const response = await fetch(`${API_BASE_URL}/api/delete-exercise`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              publicId: exerciseData.answerScheme.publicId
            }),
            mode: 'cors',
            credentials: 'omit'
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('✅ Deleted answer scheme successfully');
          } else if (!result.wasNotFound) {
            console.error('❌ Answer scheme delete failed:', result.error);
          }
        } catch (error) {
          console.log('⚠️ Answer scheme delete failed:', error);
        }
      }
      // 🛡️ BACKWARDS COMPATIBILITY: Handle old Firebase Storage format
      else if (exerciseData.answerScheme?.storageName) {
        console.log('⚠️ Found old Firebase Storage format for answer scheme - skipping Cloudinary deletion');
      }
      
      // Delete rubric file  
      if (exerciseData.rubric?.publicId) {
        try {
          console.log('🗑️ Deleting rubric from Cloudinary:', exerciseData.rubric.publicId);
          const response = await fetch(`${API_BASE_URL}/api/delete-exercise`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              publicId: exerciseData.rubric.publicId
            }),
            mode: 'cors',
            credentials: 'omit'
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('✅ Deleted rubric successfully');
          } else if (!result.wasNotFound) {
            console.error('❌ Rubric delete failed:', result.error);
          }
        } catch (error) {
          console.log('⚠️ Rubric delete failed:', error);
        }
      }
      // 🛡️ BACKWARDS COMPATIBILITY: Handle old Firebase Storage format
      else if (exerciseData.rubric?.storageName) {
        console.log('⚠️ Found old Firebase Storage format for rubric - skipping Cloudinary deletion');
      }
      
      // 🔥 NEW: Delete student submission files from CLOUDINARY
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      console.log(`🔍 Found ${submissionsSnapshot.size} submissions to process`);
      
      for (const submissionDoc of submissionsSnapshot.docs) {
        const submissionData = submissionDoc.data();
        
        // 🔧 Use the correct Cloudinary field name
        const publicId = submissionData.cloudinaryPublicId;
        
        console.log('📄 Processing submission:', {
          docId: submissionDoc.id,
          cloudinaryPublicId: publicId,
          fileName: submissionData.fileName
        });
        
        if (publicId) {
          try {
            console.log('🗑️ Deleting student submission from Cloudinary:', publicId);
            const response = await fetch(`${API_BASE_URL}/api/delete-exercise`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                publicId: publicId
              }),
              mode: 'cors',
              credentials: 'omit'
            });
            
            const result = await response.json();
            if (result.success) {
              console.log('✅ Student submission deleted successfully');
            } else if (!result.wasNotFound) {
              console.error('❌ Student submission delete failed:', result.error);
            }
          } catch (error) {
            console.log('❌ Student submission file delete failed:', error);
          }
        }
        // 🛡️ BACKWARDS COMPATIBILITY: Handle old Firebase Storage format
        else if (submissionData.firebasePublicId) {
          console.log('⚠️ Found old Firebase Storage format for submission - skipping Cloudinary deletion');
        } else {
          console.log('⚠️ No publicId found for submission:', submissionDoc.id);
        }
      }
      
      // Delete submission records from Firestore
      const deleteSubmissionPromises = [];
      submissionsSnapshot.forEach((submissionDoc) => {
        deleteSubmissionPromises.push(deleteDoc(submissionDoc.ref));
      });
      await Promise.all(deleteSubmissionPromises);
      
      // Delete student progress records
      const progressQuery = query(
        collection(db, 'studentProgress'),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const progressSnapshot = await getDocs(progressQuery);
      const deleteProgressPromises = [];
      progressSnapshot.forEach((doc) => {
        deleteProgressPromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deleteProgressPromises);
      
      // Delete the exercise document itself
      await deleteDoc(exerciseDoc.ref);
      
      console.log(`✅ Exercise ${exerciseId} completely deleted`);
    }
    
    // STEP 3: DELETE ANY REMAINING CLASS-LEVEL DATA
    // Delete any student classes (enrollment) for this class
    const enrollmentsQuery = query(
      collection(db, 'studentClasses'), // or whatever collection you use for student-class relationships
      where('classId', '==', classId)
    );
    try {
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const deleteEnrollmentPromises = [];
      enrollmentsSnapshot.forEach((doc) => {
        deleteEnrollmentPromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deleteEnrollmentPromises);
      console.log('✅ Deleted class enrollments');
    } catch (error) {
      console.log('⚠️ No enrollments to delete or error:', error);
    }
    
    // STEP 4: FINALLY DELETE THE CLASS DOCUMENT
    await deleteDoc(doc(db, 'classes', classId));
    
    // Update local state
    setClasses(classes.filter(cls => cls.id !== classId));
    
    console.log('🎉 Class and all associated data deleted completely!');
    
    setDeleteModal({ isOpen: false, classId: null, className: '', isDeleting: false });
    alert(`Class "${className}" and all its data deleted successfully.`);
    
  } catch (error) {
    console.error('❌ Error deleting class:', error);
    alert('Error deleting class. Please try again.');
    setDeleteModal(prev => ({ ...prev, isDeleting: false }));
  }
};
  // Close delete modal if not currently deleting
  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({ isOpen: false, classId: null, className: '', isDeleting: false });
    }
  };

  // Navigate to specific class page
  const handleClassClick = (classItem) => {
    navigate(`/lecturer/class/${classItem.id}`, {
      state: { classData: classItem }
    });
  };

  // Reset create modal state
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewClassName('');
    setMaxStudents('');
  };

  return (
    <div className="dashboard-page">
      {/* REPLACED: Old header with shared component */}
      <DashboardHeader 
        userType="lecturer"
        currentPage="dashboard"
        additionalNavItems={[]}
      />
      
      <LecturerDashboard 
        // State props
        classes={classes}
        loading={loading}
        creating={creating}
        showCreateModal={showCreateModal}
        newClassName={newClassName}
        maxStudents={maxStudents}
        deleteModal={deleteModal}
        
        // User data
        getUserDisplayName={getUserDisplayName}
        
        // Event handlers
        onCreateClass={() => setShowCreateModal(true)}
        onCloseCreateModal={handleCloseCreateModal}
        onClassNameChange={setNewClassName}
        onMaxStudentsChange={setMaxStudents}
        onSubmitCreateClass={handleCreateClass}
        onCopyCode={handleCopyCode}
        onDeleteClass={openDeleteModal}
        onConfirmDelete={handleDeleteClass}
        onCloseDeleteModal={closeDeleteModal}
        onClassClick={handleClassClick}
      />
    </div>
  );
};

export default Dashboard1;