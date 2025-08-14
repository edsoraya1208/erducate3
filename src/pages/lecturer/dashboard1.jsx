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
      
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
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

      await addDoc(collection(db, 'classes'), newClass);
      await loadClasses();
      
      // Reset modal state
      setShowCreateModal(false);
      setNewClassName('');
      setMaxStudents('');
      
      alert(`Class "${newClassName}" created successfully with code: ${classCode}`);
    } catch (error) {
      console.error('Error creating class:', error);
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

  // Handle user logout with confirmation
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      try {
        await auth.signOut();
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
      }
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
        onLogout={handleLogout}
        onClassClick={handleClassClick}
      />
    </div>
  );
};

export default Dashboard1;
/**
 * USAGE NOTES:
 * 
 * 1. To use this page in your routing (with React Router):
 *    import Dashboard1 from './pages/lecturer/dashboard1';
 *    <Route path="/lecturer/dashboard" component={Dashboard1} />
 * 
 * 2. To add authentication:
 *    - Add useEffect to check if user is logged in
 *    - Redirect to login if not authenticated
 *    - Show loading spinner while checking auth
 * 
 * 3. To add data fetching:
 *    - Add useState for classes data
 *    - Add useEffect to fetch classes from API
 *    - Pass data as props to LecturerDashboard
 * 
 * 4. To add error handling:
 *    - Add try-catch in data fetching
 *    - Add error state management
 *    - Show error messages to user
 */