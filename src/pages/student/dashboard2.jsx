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
  setDoc,  // NEW
  query, 
  where,
  orderBy,
  runTransaction,  // NEW
  increment  // NEW
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useUser } from '../../contexts/UserContext';
import StudentDashboard from '../../components/dashboard/student-dashboard';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const studentDashboard = () => {
  // State management for joined classes and UI
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  
  // Modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joinError, setJoinError] = useState('');
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
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadJoinedClasses();
    }
  }, [user]);

  // ✅✅✅ REPLACED FUNCTION - NOW USES TRANSACTION (ATOMIC) ✅✅✅
  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      setJoinError('Please enter a class code');
      return;
    }
    
    try {
      setJoining(true);
      setJoinError('');
      
      console.log('🔥 === CLASS JOIN DEBUG START (TRANSACTION VERSION) ===');
      console.log('🔐 Auth check:', {
        currentUser: !!auth.currentUser,
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email
      });
      
      console.log('📝 Class code:', classCode.trim().toUpperCase());
      
      // STEP 1: Find the class (outside transaction)
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
        setJoinError('Invalid class code. Please check and try again.');
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
      
      // STEP 2: Check if already enrolled (outside transaction)
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
      } catch (enrollmentError) {
        console.error('❌ Enrollment query failed:', enrollmentError);
        throw new Error(`Enrollment check failed: ${enrollmentError.message}`);
      }
      
      if (!enrollmentSnapshot.empty) {
        console.log('⚠️ Already enrolled in class');
        setJoinError('You are already enrolled in this class.');
        return;
      }
      
      // ✅✅✅ STEP 3: USE TRANSACTION FOR ATOMIC CAPACITY CHECK + ENROLLMENT ✅✅✅
      console.log('📋 STEP 3: Starting atomic transaction...');
      
      await runTransaction(db, async (transaction) => {
        // Get class metrics reference
        const metricsRef = doc(db, 'classMetrics', classInfo.id);
        const metricsDoc = await transaction.get(metricsRef);
        
        // Initialize metrics if doesn't exist (for old classes)
        if (!metricsDoc.exists()) {
          console.log('⚠️ No metrics found - initializing for legacy class');
          transaction.set(metricsRef, {
            studentCount: 0,
            lastUpdated: new Date()
          });
        }
        
        // Get current count from metrics
        const currentCount = metricsDoc.exists() ? (metricsDoc.data().studentCount || 0) : 0;
        const maxStudents = parseInt(classInfo.maxStudents) || 0;
        
        console.log('📊 🚨 TRANSACTION CAPACITY CHECK 🚨');
        console.log('Current students (from metrics):', currentCount);
        console.log('Max students allowed:', maxStudents);
        console.log('Has limit?:', maxStudents > 0);
        console.log('Is full?:', maxStudents > 0 && currentCount >= maxStudents);
        
        // ✅ ATOMIC CHECK: If full, abort transaction
        if (maxStudents > 0 && currentCount >= maxStudents) {
          console.log('🚫 CLASS IS FULL - TRANSACTION ABORTED');
          throw new Error(`CLASS_FULL:${currentCount}:${maxStudents}`);
        }
        
        console.log(`✅ Space available! Proceeding with enrollment...`);
        
        // Create enrollment data
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
        
        // Add enrollment document
        const enrollmentRef = doc(collection(db, 'studentClasses'));
        transaction.set(enrollmentRef, enrollmentData);
        
        // Increment student count atomically
        transaction.update(metricsRef, {
          studentCount: increment(1),
          lastUpdated: new Date()
        });
        
        console.log('✅ Transaction operations queued successfully');
      });
      
      console.log('🎉 Transaction committed successfully!');
      
      // STEP 4: Reload classes
      console.log('📋 STEP 4: Reloading classes...');
      try {
        await loadJoinedClasses();
        console.log('✅ Classes reloaded successfully');
      } catch (reloadError) {
        console.error('❌ Class reload failed:', reloadError);
      }
      
      // Close modal and clear state
      setShowJoinModal(false);
      setClassCode('');
      setJoinError('');
      
      console.log('🎉 === CLASS JOIN SUCCESS ===');
      
    } catch (error) {
      console.error('❌ === CLASS JOIN ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      // Handle custom CLASS_FULL error
      if (error.message && error.message.startsWith('CLASS_FULL:')) {
        const [, current, max] = error.message.split(':');
        setJoinError(`This class is full (${current}/${max} students). Please contact your lecturer.`);
      } else if (error.code === 'permission-denied') {
        setJoinError('Permission denied. Please check your account permissions.');
      } else if (error.code === 'unavailable') {
        setJoinError('Service temporarily unavailable. Please try again in a moment.');
      } else if (error.message.includes('Class lookup failed')) {
        setJoinError('Could not search for class. Please check your internet connection.');
      } else {
        setJoinError(`Error: ${error.message}`);
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

  // ✅ UPDATED: Now decrements classMetrics count
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
        
        // Delete enrollment
        await deleteDoc(doc(db, 'studentClasses', enrollmentDoc.id));
        
        // ✅ NEW: Decrement class metrics count
        try {
          const metricsRef = doc(db, 'classMetrics', leaveModal.classId);
          const metricsDoc = await getDoc(metricsRef);
          
          if (metricsDoc.exists()) {
            await setDoc(metricsRef, {
              studentCount: Math.max(0, (metricsDoc.data().studentCount || 1) - 1),
              lastUpdated: new Date()
            }, { merge: true });
            console.log('✅ Class metrics decremented');
          }
        } catch (metricsError) {
          console.log('⚠️ Could not update metrics (non-critical):', metricsError);
        }
        
        setJoinedClasses(joinedClasses.filter(cls => cls.id !== leaveModal.classId));
        
        setLeaveModal({ isOpen: false, classId: null, className: '', isLeaving: false });
      } else {
        setJoinError('Enrollment record not found.');
      }
    } catch (error) {
      console.error('Error leaving class:', error);
      setJoinError('Error leaving class. Please try again.');
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
    setJoinError('');
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader 
        userType="student"
        currentPage="dashboard"
        additionalNavItems={[]}
      />
      
      <StudentDashboard 
        joinedClasses={joinedClasses}
        loading={loading}
        joining={joining}
        showJoinModal={showJoinModal}
        classCode={classCode}
        joinError={joinError}
        leaveModal={leaveModal}
        getUserDisplayName={getUserDisplayName}
        onJoinClass={() => setShowJoinModal(true)}
        onCloseJoinModal={handleCloseJoinModal}
        onClassCodeChange={setClassCode}
        onSubmitJoinClass={handleJoinClass}  // ← CHECK THIS LINE
        onSubmitCreateClass={handleJoinClass}
        onLeaveClass={openLeaveModal}
        onConfirmLeave={handleLeaveClass}
        onCloseLeaveModal={closeLeaveModal}
        onClassClick={handleClassClick}
      />
    </div>
  );
};

export default studentDashboard;