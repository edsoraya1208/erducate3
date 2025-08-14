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
  getDoc 
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import LecturerMyClass from '../../components/class/lecturer-my-class';

const MyClassLectPage = () => {
  // Route parameters and navigation
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [classData, setClassData] = useState(location.state?.classData || null);
  const [activeTab, setActiveTab] = useState('exercises');
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Authentication
  const [user] = useAuthState(auth);

  // Helper function to get user display name
  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  // Fetch class data if not passed via state
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

  // Fetch exercises from Firebase
  const fetchExercises = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'exercises'), 
        where('classId', '==', classId)
      );
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

  // Fetch students from Firebase
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'enrollments'), 
        where('classId', '==', classId)
      );
      const querySnapshot = await getDocs(q);
      const studentsData = [];
      
      querySnapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'exercises') {
      fetchExercises();
    } else {
      fetchStudents();
    }
  }, [activeTab, classId]);

  // Publish exercise
  const handlePublishExercise = async (exerciseId) => {
    try {
      const exerciseRef = doc(db, 'exercises', exerciseId);
      await updateDoc(exerciseRef, {
        status: 'active',
        publishedAt: new Date()
      });
      fetchExercises();
    } catch (error) {
      console.error('Error publishing exercise:', error);
    }
  };

  // Edit exercise
  const handleEditExercise = (exerciseId) => {
    console.log('Edit exercise:', exerciseId);
    // navigate(`/lecturer/edit-exercise/${exerciseId}`);
  };

  // View submissions
  const handleViewSubmissions = (exerciseId) => {
    console.log('View submissions for:', exerciseId);
    // navigate(`/lecturer/exercise/${exerciseId}/submissions`);
  };

  // Create new exercise
  const handleNewExercise = () => {
    console.log('Create new exercise');
    navigate(`/lecturer/create-exercise?classId=${classId}`);
  };

  // Navigation handlers
  const handleDashboardClick = () => {
    navigate('/lecturer/dashboard1');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  // Filter exercises based on search and status
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exercise.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusClasses = {
      'completed': 'status-completed',
      'active': 'status-active',
      'draft': 'status-draft'
    };
    return statusClasses[status] || 'status-draft';
  };

  // Generate initials for student avatars
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
        onViewSubmissions={handleViewSubmissions}
        onNewExercise={handleNewExercise}
        onDashboardClick={handleDashboardClick}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default MyClassLectPage;