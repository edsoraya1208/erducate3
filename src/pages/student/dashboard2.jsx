// src/pages/student/dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  getDoc,  
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useUser } from '../../contexts/UserContext';
import StudentDashboard from '../../components/dashboard/student-dashboard';
import DashboardHeader from '../../components/dashboard/dashboard-header'; // Import the new component

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

  // All your existing Firebase functions remain the same...
  const loadJoinedClasses = async () => {
    try {
      setLoading(true);
      
      console.log('📚 Loading joined classes for student:', user?.uid);
      
      const studentClassesRef = collection(db, 'studentClasses');
      const q = query(studentClassesRef, where("studentId", "==", user?.uid || ""));
      const querySnapshot = await getDocs(q);
      
      const classIds = [];
      querySnapshot.forEach((doc) => {
        classIds.push(doc.data().classId);
      });
      
      console.log('🔗 Class IDs found:', classIds);
      
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
      
      if (classIds.length > 0) {
        console.log('🔄 Trying fallback method...');
        const joinedClassesData = [];
        for (const classId of classIds) {
          try {
            const classDoc = await getDoc(doc(db, 'classes', classId));
            if (classDoc.exists()) {
              joinedClassesData.push({
                id: classDoc.id,
                ...classDoc.data()
              });
            }
          } catch (docError) {
            console.error(`❌ Error fetching class ${classId}:`, docError);
          }
        }
        setJoinedClasses(joinedClassesData);
      } else {
        alert('Error loading classes. Please try again.');
      }
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

  // All your other functions (handleJoinClass, openLeaveModal, handleLeaveClass, etc.) 
  // remain exactly the same...
  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      alert('Please enter a class code');
      return;
    }
    
    try {
      setJoining(true);
      
      console.log('🔥 === CLASS JOIN DEBUG START ===');
      console.log('🔐 Auth check:', {
        currentUser: !!auth.currentUser,
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        displayName: auth.currentUser?.displayName
      });
      
      console.log('📋 STEP 0: Verifying user document...');
      try {
        const userDocRef = doc(db, 'users', user?.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          console.log('✅ User document found:', userDoc.data());
        } else {
          console.log('⚠️ User document missing - will create one');
          await ensureUserDocument(user);
        }
      } catch (userError) {
        console.error('❌ User document check failed:', userError);
      }
      
      console.log('📝 Class code:', classCode.trim().toUpperCase());
      console.log('🏗️ Firebase config check:', {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        hasDb: !!db
      });
      
      console.log('📋 STEP 1: Searching for class...');
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where("classCode", "==", classCode.trim().toUpperCase()));
      
      let classSnapshot;
      try {
        classSnapshot = await getDocs(classQuery);
        console.log('✅ Class query executed successfully');
        console.log('📊 Query result:', {
          empty: classSnapshot.empty,
          size: classSnapshot.size
        });
      } catch (queryError) {
        console.error('❌ Class query failed:', queryError);
        throw new Error(`Class lookup failed: ${queryError.message}`);
      }
      
      if (classSnapshot.empty) {
        console.log('❌ No class found with code:', classCode.trim().toUpperCase());
        alert('Invalid class code. Please check and try again.');
        return;
      }
      
      const classData = classSnapshot.docs[0];
      const classInfo = { id: classData.id, ...classData.data() };
      console.log('✅ Class found:', {
        id: classInfo.id,
        title: classInfo.title,
        classCode: classInfo.classCode,
        instructorId: classInfo.instructorId
      });
      
      console.log('📋 STEP 2: Checking existing enrollment...');
      const studentClassesRef = collection(db, 'studentClasses');
      const enrollmentQuery = query(
        studentClassesRef, 
        where("studentId", "==", user?.uid || ""),
        where("classId", "==", classInfo.id)
      );
      
      let enrollmentSnapshot;
      try {
        enrollmentSnapshot = await getDocs(enrollmentQuery);
        console.log('✅ Enrollment query executed successfully');
        console.log('📊 Enrollment check result:', {
          empty: enrollmentSnapshot.empty,
          size: enrollmentSnapshot.size
        });
      } catch (enrollmentError) {
        console.error('❌ Enrollment query failed:', enrollmentError);
        throw new Error(`Enrollment check failed: ${enrollmentError.message}`);
      }
      
      if (!enrollmentSnapshot.empty) {
        console.log('⚠️ Already enrolled in class');
        alert('You are already enrolled in this class.');
        return;
      }
      
      console.log('📋 STEP 3: Creating enrollment...');
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

      console.log('📋 Enrollment data:', enrollmentData);

      try {
        const docRef = await addDoc(collection(db, 'studentClasses'), enrollmentData);
        console.log('✅ Enrollment created with ID:', docRef.id);
      } catch (createError) {
        console.error('❌ Enrollment creation failed:', createError);
        throw new Error(`Failed to join class: ${createError.message}`);
      }
      
      console.log('📋 STEP 4: Reloading classes...');
      try {
        await loadJoinedClasses();
        console.log('✅ Classes reloaded successfully');
      } catch (reloadError) {
        console.error('❌ Class reload failed:', reloadError);
      }
      
      setShowJoinModal(false);
      setClassCode('');
      
      console.log('🎉 === CLASS JOIN SUCCESS ===');
      alert(`Successfully joined "${classInfo.title}"!`);
      
    } catch (error) {
      console.error('❌ === CLASS JOIN ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      console.error('Error stack:', error.stack);
      
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check your account permissions and try again.');
      } else if (error.code === 'unavailable') {
        alert('Service temporarily unavailable. Please try again in a moment.');
      } else if (error.message.includes('Class lookup failed')) {
        alert('Could not search for class. Please check your internet connection.');
      } else if (error.message.includes('Failed to join class')) {
        alert('Could not join class. Please check your permissions.');
      } else {
        alert(`Error joining class: ${error.message}`);
      }
    } finally {
      setJoining(false);
    }
  };

  const openLeaveModal = (classId, className) => {
    setLeaveModal({
      isOpen: true,
      classId,
      className,
      isLeaving: false
    });
  };

  const handleLeaveClass = async () => {
    setLeaveModal(prev => ({ ...prev, isLeaving: true }));
    
    try {
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

  const closeLeaveModal = () => {
    if (!leaveModal.isLeaving) {
      setLeaveModal({ isOpen: false, classId: null, className: '', isLeaving: false });
    }
  };

  const handleClassClick = (classItem) => {
    navigate(`/student/class/${classItem.id}`, {
      state: { classData: classItem }
    });
  };

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setClassCode('');
  };

  return (
    <div className="dashboard-page">
      {/* SIMPLIFIED: Just use the reusable header component */}
      <DashboardHeader 
        userType="student"
        currentPage="dashboard"
        additionalNavItems={[]} // Add any student-specific nav items here if needed
      />
      
      <StudentDashboard 
        // All your existing props remain the same
        joinedClasses={joinedClasses}
        loading={loading}
        joining={joining}
        showJoinModal={showJoinModal}
        classCode={classCode}
        leaveModal={leaveModal}
        getUserDisplayName={getUserDisplayName}
        onJoinClass={() => setShowJoinModal(true)}
        onCloseJoinModal={handleCloseJoinModal}
        onClassCodeChange={setClassCode}
        onSubmitJoinClass={handleJoinClass}
        onLeaveClass={openLeaveModal}
        onConfirmLeave={handleLeaveClass}
        onCloseLeaveModal={closeLeaveModal}
        onClassClick={handleClassClick}
      />
    </div>
  );
};

export default studentDashboard;