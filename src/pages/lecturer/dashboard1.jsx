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
import { db, auth } from '../../config/firebase';
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

  // Delete class from Firebase and update state
  const handleDeleteClass = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      await deleteDoc(doc(db, 'classes', deleteModal.classId));
      setClasses(classes.filter(cls => cls.id !== deleteModal.classId));
      
      setDeleteModal({ isOpen: false, classId: null, className: '', isDeleting: false });
      alert(`Class "${deleteModal.className}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting class:', error);
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