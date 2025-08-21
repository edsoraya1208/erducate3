// src/pages/student/dashboard.jsx
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
import StudentDashboard from '../../components/dashboard/student-dashboard';

const studentDashboard = () => {
  // State management for joined classes and UI
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  
  // Modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [leaveModal, setLeaveModal] = useState({
    isOpen: false,
    classId: null,
    className: '',
    isLeaving: false
  });

  // Hooks
  const [user, error] = useAuthState(auth);
  const { getUserDisplayName } = useUser();
  const navigate = useNavigate();

  // Fetch joined classes from Firebase for current student
  const loadJoinedClasses = async () => {
    try {
      setLoading(true);
      
      // Debug logs for troubleshooting
      console.log('📚 Loading joined classes for student:', user?.uid);
      console.log('🔍 Query: studentClasses where studentId ==', user?.uid || "");
      
      // Query the studentClasses collection to get classes this student has joined
      const studentClassesRef = collection(db, 'studentClasses');
      const q = query(studentClassesRef, where("studentId", "==", user?.uid || ""));
      const querySnapshot = await getDocs(q);
      
      const classIds = [];
      querySnapshot.forEach((doc) => {
        classIds.push(doc.data().classId);
      });
      
      console.log('🔗 Class IDs found:', classIds);
      
      // If student has joined classes, fetch the class details
      if (classIds.length > 0) {
        const classesRef = collection(db, 'classes');
        const classesQuery = query(classesRef, where("__name__", "in", classIds));
        const classesSnapshot = await getDocs(classesQuery);
        
        const joinedClassesData = [];
        classesSnapshot.forEach((doc) => {
          joinedClassesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('📊 Joined classes found:', joinedClassesData.length);
        console.log('📋 Joined classes data:', joinedClassesData);
        
        setJoinedClasses(joinedClassesData);
      } else {
        setJoinedClasses([]);
      }
    } catch (error) {
      console.error('❌ Error loading joined classes:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert('Error loading classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load joined classes when user is authenticated
  useEffect(() => {
    if (user) {
      loadJoinedClasses();
    }
  }, [user]);

  // Join a class using class code
  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      alert('Please enter a class code');
      return;
    }
    
    try {
      setJoining(true);
      
      // Debug logs
      console.log('🔥 Starting class join debug...');
      console.log('🔐 Auth state:', auth.currentUser);
      console.log('🆔 Student ID:', auth.currentUser?.uid);
      console.log('📝 Class code entered:', classCode.trim());
      
      // First, check if class exists with this code
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where("classCode", "==", classCode.trim().toUpperCase()));
      const classSnapshot = await getDocs(classQuery);
      
      if (classSnapshot.empty) {
        alert('Invalid class code. Please check and try again.');
        return;
      }
      
      const classData = classSnapshot.docs[0];
      const classInfo = { id: classData.id, ...classData.data() };
      
      console.log('✅ Class found:', classInfo);
      
      // Check if student is already enrolled in this class
      const studentClassesRef = collection(db, 'studentClasses');
      const enrollmentQuery = query(
        studentClassesRef, 
        where("studentId", "==", user?.uid || ""),
        where("classId", "==", classInfo.id)
      );
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      
      if (!enrollmentSnapshot.empty) {
        alert('You are already enrolled in this class.');
        return;
      }
      
      // Create enrollment record
      const enrollmentData = {
        studentId: user?.uid || "unknown",
        studentName: user?.displayName || user?.email || "Unknown Student",
        studentEmail: user?.email || "",
        classId: classInfo.id,
        classCode: classInfo.classCode,
        className: classInfo.title,
        joinedAt: new Date(),
        status: "active"
      };

      console.log('📋 Enrollment data to be created:', enrollmentData);

      await addDoc(collection(db, 'studentClasses'), enrollmentData);
      
      console.log('✅ Class join successful!');
      await loadJoinedClasses();
      
      // Reset modal state
      setShowJoinModal(false);
      setClassCode('');
      
      alert(`Successfully joined "${classInfo.title}"!`);
    } catch (error) {
      console.error('❌ Error joining class:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      alert('Error joining class. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Open leave confirmation modal
  const openLeaveModal = (classId, className) => {
    setLeaveModal({
      isOpen: true,
      classId,
      className,
      isLeaving: false
    });
  };

  // Leave class - remove enrollment record
  const handleLeaveClass = async () => {
    setLeaveModal(prev => ({ ...prev, isLeaving: true }));
    
    try {
      // Find and delete the enrollment record
      const studentClassesRef = collection(db, 'studentClasses');
      const enrollmentQuery = query(
        studentClassesRef, 
        where("studentId", "==", user?.uid || ""),
        where("classId", "==", leaveModal.classId)
      );
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      
      if (!enrollmentSnapshot.empty) {
        const enrollmentDoc = enrollmentSnapshot.docs[0];
        await deleteDoc(doc(db, 'studentClasses', enrollmentDoc.id));
        
        // Update local state
        setJoinedClasses(joinedClasses.filter(cls => cls.id !== leaveModal.classId));
        
        setLeaveModal({ isOpen: false, classId: null, className: '', isLeaving: false });
        alert(`Left "${leaveModal.className}" successfully.`);
      } else {
        alert('Enrollment record not found.');
      }
    } catch (error) {
      console.error('Error leaving class:', error);
      alert('Error leaving class. Please try again.');
      setLeaveModal(prev => ({ ...prev, isLeaving: false }));
    }
  };

  // Close leave modal if not currently leaving
  const closeLeaveModal = () => {
    if (!leaveModal.isLeaving) {
      setLeaveModal({ isOpen: false, classId: null, className: '', isLeaving: false });
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
    navigate(`/student/class/${classItem.id}`, {
      state: { classData: classItem }
    });
  };

  // Reset join modal state
  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setClassCode('');
  };

  return (
    <div className="dashboard-page">
      <StudentDashboard 
        // State props
        joinedClasses={joinedClasses}
        loading={loading}
        joining={joining}
        showJoinModal={showJoinModal}
        classCode={classCode}
        leaveModal={leaveModal}
        
        // User data
        getUserDisplayName={getUserDisplayName}
        
        // Event handlers
        onJoinClass={() => setShowJoinModal(true)}
        onCloseJoinModal={handleCloseJoinModal}
        onClassCodeChange={setClassCode}
        onSubmitJoinClass={handleJoinClass}
        onLeaveClass={openLeaveModal}
        onConfirmLeave={handleLeaveClass}
        onCloseLeaveModal={closeLeaveModal}
        onLogout={handleLogout}
        onClassClick={handleClassClick}
      />
    </div>
  );
};

export default studentDashboard;