// 📝 UPDATED: Added draft exercise handling and delete functionality
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
  deleteDoc // 🆕 NEW: Added for delete functionality
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import LecturerMyClass from '../../components/class/lecturer-my-class';

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
  const [loading, setLoading] = useState(false);

  const [user] = useAuthState(auth);

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

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
      setLoading(true);
      const q = query(collection(db, 'classes', classId, 'exercises'));
      const querySnapshot = await getDocs(q);
      const exercisesData = [];
      
      querySnapshot.forEach((doc) => {
        exercisesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'exercises') {
      fetchExercises();
    } else {
      fetchStudents();
    }
  }, [activeTab, classId]);

  const handlePublishExercise = async (exerciseId) => {
    try {
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      await updateDoc(exerciseRef, {
        status: 'active',
        publishedAt: new Date()
      });
      fetchExercises();
    } catch (error) {
      console.error('Error publishing exercise:', error);
    }
  };

  // 🔄 UPDATED: Enhanced edit handler to navigate back to create page with draft data
  const handleEditExercise = (exerciseId) => {
    console.log('Edit exercise:', exerciseId);
    // 🆕 NEW: Navigate back to create exercise page with draft ID to load data
    navigate(`/lecturer/create-exercise?classId=${classId}&draftId=${exerciseId}`);
  };

  // 🆕 NEW: Delete exercise handler
  const handleDeleteExercise = async (exerciseId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this exercise? This action cannot be undone.');
    
    if (confirmDelete) {
      try {
        const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
        await deleteDoc(exerciseRef);
        console.log('Exercise deleted successfully');
        fetchExercises(); // Refresh the list
      } catch (error) {
        console.error('Error deleting exercise:', error);
        alert('Failed to delete exercise. Please try again.');
      }
    }
  };

  // 🆕 NEW: Handle clicking on draft exercise card to edit
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

  const handleDashboardClick = () => {
    navigate('/lecturer/dashboard1');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
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
        onDeleteExercise={handleDeleteExercise} // 🆕 NEW: Added delete handler
        onDraftExerciseClick={handleDraftExerciseClick} // 🆕 NEW: Added draft click handler
        onViewSubmissions={handleViewSubmissions}
        onNewExercise={handleNewExercise}
        onDashboardClick={handleDashboardClick}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default MyClassLectPage;