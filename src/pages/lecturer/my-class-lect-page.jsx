// src/pages/lecturer/my-class-lect-page.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import LecturerMyClass from '../../components/class/lecturer-my-class';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const MyClassLectPage = () => {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState(location.state?.classData || null);
  const [activeTab, setActiveTab] = useState('exercises');
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isPublishedExercise, setIsPublishedExercise] = useState(false);

  const [user] = useAuthState(auth);

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  // Add beforeunload handler for unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if there are any draft exercises
      const hasDrafts = exercises.some(exercise => exercise.status === 'draft');
      
      if (hasDrafts) {
        e.preventDefault();
        e.returnValue = 'You have unsaved draft exercises. Are you sure you want to leave?';
        return 'You have unsaved draft exercises. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [exercises]);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classData && classId) {
        try {
          const classRef = doc(db, 'classes', classId);
          const classSnap = await getDoc(classRef);
          
          if (classSnap.exists()) {
            setClassData({
              id: classSnap.id,
              ...classSnap.data()
            });
          }
        } catch (error) {
          console.error('Error fetching class:', error);
        }
      }
    };

    fetchClassData();
  }, [classId, classData]);

  const fetchExercises = async () => {
    try {
      const q = query(collection(db, 'classes', classId, 'exercises'));
      const querySnapshot = await getDocs(q);
      const exercisesData = [];
      
      querySnapshot.forEach((doc) => {
        exercisesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort exercises by creation date (newest first) and then by status
      const sortedExercises = exercisesData.sort((a, b) => {
        // First sort by status priority: draft > active > completed
        const statusPriority = { draft: 3, active: 2, completed: 1 };
        const statusDiff = statusPriority[b.status] - statusPriority[a.status];
        
        if (statusDiff !== 0) return statusDiff;
        
        // Then sort by creation date (newest first)
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return bDate - aDate;
      });
      
      setExercises(sortedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  // 🔧 FIXED: Proper student completion counting
  const fetchStudents = async () => {
    try {
      console.log('Fetching students for classId:', classId);
      
      // Step 1: Get enrolled students
      const enrollmentsQuery = query(
        collection(db, 'studentClasses'),
        where('classId', '==', classId)
      );
      const enrollmentSnapshot = await getDocs(enrollmentsQuery);
      
      console.log('Found enrollments:', enrollmentSnapshot.size);
      
      // Step 2: Get ALL active exercises count for this class
      const activeExercisesQuery = query(
        collection(db, 'classes', classId, 'exercises'),
        where('status', '==', 'active')
      );
      const activeExercisesSnapshot = await getDocs(activeExercisesQuery);
      const totalActiveExercises = activeExercisesSnapshot.size;
      
      console.log('Total active exercises:', totalActiveExercises);
      
      // Step 3: Get completion data from studentProgress collection
      const progressQuery = query(
        collection(db, 'studentProgress'),
        where('classId', '==', classId)
      );
      const progressSnapshot = await getDocs(progressQuery);
      
      // Create a map of student completions
      const completionMap = {};
      progressSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.submitted && data.status === 'completed') {
          if (!completionMap[data.studentId]) {
            completionMap[data.studentId] = 0;
          }
          completionMap[data.studentId]++;
        }
      });
      
      console.log('Completion map:', completionMap);
      
      const studentsData = [];
      
      enrollmentSnapshot.forEach((enrollmentDoc) => {
        const enrollmentData = enrollmentDoc.data();
        const studentId = enrollmentData.studentId;
        const completedCount = completionMap[studentId] || 0;
        
        console.log(`Student ${studentId}: ${completedCount}/${totalActiveExercises} completed`);
        
        studentsData.push({
          id: studentId,
          name: enrollmentData.studentName || enrollmentData.displayName || 'Unknown Student',
          email: enrollmentData.studentEmail || 'No email',
          completedExercises: completedCount,
          totalExercises: totalActiveExercises,
          enrolledAt: enrollmentData.enrolledAt || enrollmentData.createdAt
        });
      });
      
      console.log('Final students data:', studentsData);
      setStudents(studentsData);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  // Fetch both students and exercises on initial load and tab change
  useEffect(() => {
    if (classId) {
      const fetchInitialData = async () => {
        setLoading(true);
        try {
          // Always fetch students for count display
          await fetchStudents();
          
          // Fetch exercises if we're on exercises tab
          if (activeTab === 'exercises') {
            await fetchExercises();
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchInitialData();
    }
  }, [classId, activeTab]);


  const handleEditExercise = (exerciseId) => {
    console.log('Edit exercise:', exerciseId);
    navigate(`/lecturer/create-exercise?classId=${classId}&draftId=${exerciseId}`);
  };

  // Enhanced delete handler with better error handling
  // Enhanced delete handler with cleanup of studentProgress records
const handleDeleteExercise = async (exerciseId) => {
  try {
    console.log('Deleting exercise:', exerciseId);
    
    // STEP 1: Delete the exercise document
    const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
    await deleteDoc(exerciseRef);
    
    // STEP 2: 🔧 NEW - Clean up studentProgress records for this exercise
    console.log('Cleaning up student progress records...');
    const progressQuery = query(
      collection(db, 'studentProgress'),
      where('classId', '==', classId),
      where('exerciseId', '==', exerciseId)
    );
    
    const progressSnapshot = await getDocs(progressQuery);
    console.log(`Found ${progressSnapshot.size} progress records to delete`);
    
    // Delete all matching studentProgress documents
    const deletePromises = [];
    progressSnapshot.forEach((progressDoc) => {
      deletePromises.push(deleteDoc(progressDoc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log('Student progress records cleaned up');
    
    // STEP 3: Also clean up submissions for this exercise
    console.log('Cleaning up submission records...');
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('classId', '==', classId),
      where('exerciseId', '==', exerciseId)
    );
    
    const submissionsSnapshot = await getDocs(submissionsQuery);
    console.log(`Found ${submissionsSnapshot.size} submission records to delete`);
    
    const deleteSubmissionPromises = [];
    submissionsSnapshot.forEach((submissionDoc) => {
      deleteSubmissionPromises.push(deleteDoc(submissionDoc.ref));
    });
    
    await Promise.all(deleteSubmissionPromises);
    console.log('Submission records cleaned up');
    
    console.log('Exercise deleted successfully with full cleanup');
    
    // STEP 4: Refresh both exercises and students after deletion
    await fetchExercises();
    await fetchStudents(); // This will now show correct counts
    
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error; // Rethrow to handle in component
  }
};

  const handleDraftExerciseClick = (exerciseId) => {
    handleEditExercise(exerciseId);
  };

  const handleViewSubmissions = (exerciseId) => {
    console.log('View submissions for:', exerciseId);
    // navigate(`/lecturer/exercise/${exerciseId}/submissions`);
  };

  const handleNewExercise = () => {
    console.log('Create new exercise');
    navigate(`/lecturer/create-exercise?classId=${classId}`);
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exercise.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusClasses = {
      'completed': 'status-completed',
      'active': 'status-active',
      'draft': 'status-draft'
    };
    return statusClasses[status] || 'status-draft';
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  return (
    <div className="my-class-page">
      <DashboardHeader 
        userType="lecturer"
        currentPage="class"
        additionalNavItems={[]}
      />
      
      <LecturerMyClass 
        // State props
        classData={classData}
        activeTab={activeTab}
        exercises={filteredExercises}
        students={students}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        loading={loading}
        
        // User data
        getUserDisplayName={getUserDisplayName}
        
        // Utility functions
        getStatusBadge={getStatusBadge}
        getInitials={getInitials}
        
        // Event handlers
        onTabChange={setActiveTab}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onEditExercise={handleEditExercise}
        onDeleteExercise={handleDeleteExercise}
        onDraftExerciseClick={handleDraftExerciseClick}
        onViewSubmissions={handleViewSubmissions}
        onNewExercise={handleNewExercise}
      />
    </div>
  );
};

export default MyClassLectPage;