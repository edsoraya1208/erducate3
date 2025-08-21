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

const studentDashboard = () => {
  // State management for joined classes and UI
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  
  // ADDED: Mobile menu state for header
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  // ADDED: Header functions
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const onDashboardClick = () => {
    navigate('/student/dashboard');
    closeMobileMenu();
  };

  // Fetch joined classes from Firebase for current student
  const loadJoinedClasses = async () => {
  try {
    setLoading(true);
    
    console.log('📚 Loading joined classes for student:', user?.uid);
    
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
      
      // FIXED: Use documentId() instead of "__name__"
      const classesQuery = query(classesRef, where("__name__", "in", classIds));
      const classesSnapshot = await getDocs(classesQuery);
      
      // ALTERNATIVE FIX: If the above doesn't work, use this approach instead:
      // const joinedClassesData = [];
      // for (const classId of classIds) {
      //   const classDoc = await getDoc(doc(db, 'classes', classId));
      //   if (classDoc.exists()) {
      //     joinedClassesData.push({
      //       id: classDoc.id,
      //       ...classDoc.data()
      //     });
      //   }
      // }
      
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
    
    // FALLBACK: If the query fails, try individual document fetches
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

  // Join a class using class code
  const handleJoinClass = async () => {
  if (!classCode.trim()) {
    alert('Please enter a class code');
    return;
  }
  
  try {
    setJoining(true);
    
    // Enhanced debug logs
    console.log('🔥 === CLASS JOIN DEBUG START ===');
    console.log('🔐 Auth check:', {
      currentUser: !!auth.currentUser,
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      displayName: auth.currentUser?.displayName
    });
    
    // STEP 0: Verify user document exists
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
    
    // STEP 1: Check if class exists
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
    
    // STEP 2: Check existing enrollment
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
    
    // STEP 3: Create enrollment
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
    
    // STEP 4: Reload classes
    console.log('📋 STEP 4: Reloading classes...');
    try {
      await loadJoinedClasses();
      console.log('✅ Classes reloaded successfully');
    } catch (reloadError) {
      console.error('❌ Class reload failed:', reloadError);
      // Don't throw here, enrollment was successful
    }
    
    // STEP 5: Reset UI
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
    
    // More specific error messages
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
      {/* ADDED: Dashboard Header using your existing lecturer-shared-header.css */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <div className="logo-icon">
              <img 
                src="/logo.svg" 
                alt="ERDucate Logo" 
                className="custom-logo"
              />
            </div>
            <span className="brand-name">
              ERDucate
            </span>
          </div>
        </div>
        
        <div className="header-right">
          {/* Desktop Navigation */}
          <nav className="nav-items desktop-nav">
            <span className="nav-item" onClick={onDashboardClick}>Dashboard</span>
            <span className="nav-item">{getUserDisplayName()}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </nav>

          {/* Hamburger Button */}
          <button 
            className="hamburger-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></div>
          </button>

          {/* Mobile Navigation */}
          <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-nav-overlay" onClick={closeMobileMenu}></div>
            <div className="mobile-nav-content">
              <span 
                className="nav-item" 
                onClick={() => {
                  onDashboardClick();
                  closeMobileMenu();
                }}
              >
                Dashboard
              </span>
              <span className="nav-item">{getUserDisplayName()}</span>
              <button 
                className="logout-btn" 
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
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