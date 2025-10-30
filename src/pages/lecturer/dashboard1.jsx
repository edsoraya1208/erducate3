// src/pages/lecturer/dashboard1.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  setDoc,  
  query, 
  where,
  orderBy 
} from 'firebase/firestore';

import { ref, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useUser } from '../../contexts/UserContext';
import LecturerDashboard from '../../components/dashboard/lecturer-dashboard';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const Dashboard1 = () => {
  // State management for classes and UI
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  
  // ✅ NEW: Validation error state
  const [validationError, setValidationError] = useState('');
  
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

  // ✅✅✅ UPDATED FUNCTION WITH INLINE VALIDATION ✅✅✅
  const handleCreateClass = async () => {
    console.log('🔍 VALIDATION CHECK - maxStudents value:', maxStudents);
    console.log('🔍 VALIDATION CHECK - maxStudents type:', typeof maxStudents);
    
    // Clear previous errors
    setValidationError('');
    
    // ✅ VALIDATION 1: Check if class name is filled
    if (!newClassName.trim()) {
      setValidationError('Please enter a class name.');
      return;
    }
    
    // ✅ VALIDATION 2: Check if max students is filled
    if (!maxStudents || maxStudents.trim() === '') {
      setValidationError('Please enter the maximum number of students.');
      return;
    }
    
    // ✅ VALIDATION 3: Convert to number and check if valid
    const studentCount = parseInt(maxStudents, 10);
    console.log('🔍 VALIDATION CHECK - studentCount after parseInt:', studentCount);
    
    if (isNaN(studentCount)) {
      setValidationError('Please enter a valid number for maximum students.');
      return;
    }
    
    // ✅ VALIDATION 4: Must be between 1 and 100
    if (studentCount < 1 || studentCount > 100) {
      console.log('❌ VALIDATION FAILED - studentCount out of range:', studentCount);
      setValidationError('Maximum number of students must be between 1 and 100.');
      return;
    }
    
    console.log('✅ All validations passed! Creating class...');
    
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
        maxStudents: studentCount,
        createdAt: new Date(),
        instructorId: user?.uid || "unknown",
        instructorName: user?.displayName || user?.email || "Unknown Instructor"
      };

      console.log('📋 Class data to be created:', newClass);
      console.log('📂 Collection path: classes');

      // Create class and get the document reference
      const classDocRef = await addDoc(collection(db, 'classes'), newClass);

      // Initialize class metrics for capacity tracking
      await setDoc(doc(db, 'classMetrics', classDocRef.id), { 
        studentCount: 0,
        lastUpdated: new Date()
      });

      console.log('✅ Class creation successful with metrics initialized!');
      await loadClasses();
      
      // Reset modal state
      setShowCreateModal(false);
      setNewClassName('');
      setMaxStudents('');
      setValidationError('');
      
      // ❌ REMOVED: alert(`Class "${newClassName}" created successfully with code: ${classCode}`);
      // You can see the new class appear in your dashboard immediately
      
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
      // ❌ REMOVED: alert(`Class code ${classCode} copied to clipboard!`);
      // The copy action is instant and doesn't need confirmation
      console.log('✅ Class code copied:', classCode);
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

  // Complete delete function that removes class and ALL associated data from Cloudinary
  const handleDeleteClass = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    const isDevelopment = import.meta.env.DEV;
    const API_BASE_URL = isDevelopment 
      ? 'https://erducate.vercel.app'
      : '';
    
    try {
      const classId = deleteModal.classId;
      const className = deleteModal.className;
      
      console.log('🗑️ Starting complete class deletion for:', classId);
      
      const exercisesRef = collection(db, 'classes', classId, 'exercises');
      const exercisesSnapshot = await getDocs(exercisesRef);
      
      console.log(`Found ${exercisesSnapshot.size} exercises to delete`);
      
      for (const exerciseDoc of exercisesSnapshot.docs) {
        const exerciseId = exerciseDoc.id;
        const exerciseData = exerciseDoc.data();
        
        console.log('Deleting exercise:', exerciseId);
        
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
        else if (exerciseData.answerScheme?.storageName) {
          console.log('⚠️ Found old Firebase Storage format for answer scheme - skipping Cloudinary deletion');
        }
        
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
        else if (exerciseData.rubric?.storageName) {
          console.log('⚠️ Found old Firebase Storage format for rubric - skipping Cloudinary deletion');
        }
        
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('classId', '==', classId),
          where('exerciseId', '==', exerciseId)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        console.log(`🔍 Found ${submissionsSnapshot.size} submissions to process`);
        
        for (const submissionDoc of submissionsSnapshot.docs) {
          const submissionData = submissionDoc.data();
          
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
          else if (submissionData.firebasePublicId) {
            console.log('⚠️ Found old Firebase Storage format for submission - skipping Cloudinary deletion');
          } else {
            console.log('⚠️ No publicId found for submission:', submissionDoc.id);
          }
        }
        
        const deleteSubmissionPromises = [];
        submissionsSnapshot.forEach((submissionDoc) => {
          deleteSubmissionPromises.push(deleteDoc(submissionDoc.ref));
        });
        await Promise.all(deleteSubmissionPromises);
        
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
        
        await deleteDoc(exerciseDoc.ref);
        
        console.log(`✅ Exercise ${exerciseId} completely deleted`);
      }
      
      const enrollmentsQuery = query(
        collection(db, 'studentClasses'),
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

      try {
        await deleteDoc(doc(db, 'classMetrics', classId));
        console.log('✅ Deleted class metrics');
      } catch (error) {
        console.log('⚠️ No class metrics to delete or error:', error);
      }
      
      await deleteDoc(doc(db, 'classes', classId));
      
      setClasses(classes.filter(cls => cls.id !== classId));
      
      console.log('🎉 Class and all associated data deleted completely!');
      
      setDeleteModal({ isOpen: false, classId: null, className: '', isDeleting: false });
      
      // ✅ KEPT: This alert is important - deletion is irreversible
      alert(`Class "${className}" and all its data deleted successfully.`);
      
    } catch (error) {
      console.error('❌ Error deleting class:', error);
      alert('Error deleting class. Please try again.');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({ isOpen: false, classId: null, className: '', isDeleting: false });
    }
  };

  const handleClassClick = (classItem) => {
    navigate(`/lecturer/class/${classItem.id}`, {
      state: { classData: classItem }
    });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewClassName('');
    setMaxStudents('');
    setValidationError(''); // ✅ Clear validation error when closing
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader 
        userType="lecturer"
        currentPage="dashboard"
        additionalNavItems={[]}
      />
      
      <LecturerDashboard 
        classes={classes}
        loading={loading}
        creating={creating}
        showCreateModal={showCreateModal}
        newClassName={newClassName}
        maxStudents={maxStudents}
        validationError={validationError} // ✅ NEW: Pass validation error
        deleteModal={deleteModal}
        getUserDisplayName={getUserDisplayName}
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