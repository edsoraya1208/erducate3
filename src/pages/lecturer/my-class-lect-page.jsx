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
import DashboardHeader from '../../components/dashboard/dashboard-header'; // Import the new component

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

  const fetchStudents = async () => {
    try {
      console.log('Fetching students for classId:', classId);
      
      const enrollmentsQuery = query(
        collection(db, 'studentClasses'),
        where('classId', '==', classId)
      );
      const enrollmentSnapshot = await getDocs(enrollmentsQuery);
      
      console.log('Found enrollments:', enrollmentSnapshot.size);
      
      const studentsData = [];
      
      enrollmentSnapshot.forEach((enrollmentDoc) => {
        const enrollmentData = enrollmentDoc.data();
        console.log('Enrollment data:', enrollmentData);
        
        studentsData.push({
          id: enrollmentData.studentId,
          name: enrollmentData.studentName || enrollmentData.displayName || 'Unknown Student',
          email: enrollmentData.studentEmail || 'No email',
          completedExercises: enrollmentData.completedExercises || 0,
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

  // Fixed the publish exercise handler - this was causing the duplicate issue
  const handlePublishExercise = async (exerciseId) => {
    try {
      console.log('Publishing exercise:', exerciseId);
      
      // Update the existing exercise instead of creating a new one
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      await updateDoc(exerciseRef, {
        status: 'active',
        publishedAt: new Date(),
        updatedAt: new Date() // Track when it was last updated
      });
      
      console.log('Exercise published successfully');
      
      // Refresh exercises to show updated status immediately
      await fetchExercises();
      
    } catch (error) {
      console.error('Error publishing exercise:', error);
      throw error; // Rethrow to handle in component
    }
  };

  const handleEditExercise = (exerciseId) => {
  console.log('Edit exercise:', exerciseId);
  navigate(`/lecturer/create-exercise?classId=${classId}&draftId=${exerciseId}`);
};

  // Enhanced delete handler with better error handling
  const handleDeleteExercise = async (exerciseId) => {
    try {
      console.log('Deleting exercise:', exerciseId);
      
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      await deleteDoc(exerciseRef);
      
      console.log('Exercise deleted successfully');
      
      // Refresh exercises immediately after deletion
      await fetchExercises();
      
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

  // Enhanced logout with draft warning

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
      {/* REPLACED: Old header with shared component */}
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
        onPublishExercise={handlePublishExercise}
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