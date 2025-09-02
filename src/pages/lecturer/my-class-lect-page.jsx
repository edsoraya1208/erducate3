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
import { ref, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebase';
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
  const [deletingExerciseId, setDeletingExerciseId] = useState(null);

  const [user] = useAuthState(auth);

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  // Add beforeunload handler for unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
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

  const fetchStudentCount = async () => {
    try {
      const enrollmentsQuery = query(
        collection(db, 'studentClasses'),
        where('classId', '==', classId)
      );
      const enrollmentSnapshot = await getDocs(enrollmentsQuery);
      
      // Create minimal student data for count display only
      const studentsData = [];
      enrollmentSnapshot.forEach((enrollmentDoc) => {
        const enrollmentData = enrollmentDoc.data();
        studentsData.push({
          id: enrollmentData.studentId,
          name: enrollmentData.studentName || enrollmentData.displayName || 'Unknown Student',
          email: enrollmentData.studentEmail || 'No email',
          completedExercises: 0,
          totalExercises: 0,
          enrolledAt: enrollmentData.enrolledAt || enrollmentData.createdAt
        });
      });
      
      setStudents(studentsData);
      
    } catch (error) {
      console.error('Error fetching student count:', error);
      setStudents([]);
    }
  };

  const fetchStudents = async () => {
    try {
      // Step 1: Get enrolled students
      const enrollmentsQuery = query(
        collection(db, 'studentClasses'),
        where('classId', '==', classId)
      );
      const enrollmentSnapshot = await getDocs(enrollmentsQuery);
      
      // Step 2: Get ALL active exercises count for this class
      const activeExercisesQuery = query(
        collection(db, 'classes', classId, 'exercises'),
        where('status', '==', 'active')
      );
      const activeExercisesSnapshot = await getDocs(activeExercisesQuery);
      const totalActiveExercises = activeExercisesSnapshot.size;
      
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
      
      const studentsData = [];
      
      enrollmentSnapshot.forEach((enrollmentDoc) => {
        const enrollmentData = enrollmentDoc.data();
        const studentId = enrollmentData.studentId;
        const completedCount = completionMap[studentId] || 0;
        
        studentsData.push({
          id: studentId,
          name: enrollmentData.studentName || enrollmentData.displayName || 'Unknown Student',
          email: enrollmentData.studentEmail || 'No email',
          completedExercises: completedCount,
          totalExercises: totalActiveExercises,
          enrolledAt: enrollmentData.enrolledAt || enrollmentData.createdAt
        });
      });
      
      setStudents(studentsData);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  useEffect(() => {
    if (classId) {
      const fetchInitialData = async () => {
        setLoading(true);
        try {
          if (activeTab === 'exercises') {
            await Promise.all([
              fetchExercises(),
              fetchStudentCount()
            ]);
          } else if (activeTab === 'students') {
            await Promise.all([
              fetchStudents(),
              fetchExercises()
            ]);
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchInitialData();
    }
  }, [classId, activeTab]);

  const handleEditExercise = (exerciseId) => {
    navigate(`/lecturer/create-exercise?classId=${classId}&draftId=${exerciseId}`);
  };

  const handleDeleteExercise = async (exerciseId) => {
    setDeletingExerciseId(exerciseId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual feedback delay
      
      // STEP 1: GET EXERCISE DATA FIRST
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      const exerciseSnap = await getDoc(exerciseRef);
      const exerciseData = exerciseSnap.data();
      
      // STEP 2: DELETE EXERCISE FILES
      if (exerciseData) {
        // Delete answer scheme file
        if (exerciseData.answerScheme?.storageName) {
          try {
            const answerSchemeRef = ref(storage, `answer-schemes/${exerciseData.answerScheme.storageName}`);
            await deleteObject(answerSchemeRef);
          } catch (error) {
            console.log('Answer scheme delete failed:', error);
          }
        }
        
        // Delete rubric file  
        if (exerciseData.rubric?.storageName) {
          try {
            const rubricRef = ref(storage, `rubrics/${exerciseData.rubric.storageName}`);
            await deleteObject(rubricRef);
          } catch (error) {
            console.log('Rubric delete failed:', error);
          }
        }
      }
      
      // STEP 3: DELETE STUDENT SUBMISSION FILES
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      for (const submissionDoc of submissionsSnapshot.docs) {
        const submissionData = submissionDoc.data();
        
        if (submissionData.firebasePublicId) {
          try {
            const filePath = submissionData.firebasePublicId;
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);
          } catch (error) {
            console.log('Student submission file delete failed:', error);
          }
        }
      }
      
      // STEP 4: DELETE THE EXERCISE DOCUMENT
      await deleteDoc(exerciseRef);
      
      // STEP 5: DELETE STUDENT PROGRESS RECORDS
      const progressQuery = query(
        collection(db, 'studentProgress'),
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId)
      );
      const progressSnapshot = await getDocs(progressQuery);
      const deleteProgressPromises = [];
      progressSnapshot.forEach((doc) => {
        deleteProgressPromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deleteProgressPromises);
      
      // STEP 6: DELETE SUBMISSION RECORDS
      const deleteSubmissionPromises = [];
      submissionsSnapshot.forEach((submissionDoc) => {
        deleteSubmissionPromises.push(deleteDoc(submissionDoc.ref));
      });
      await Promise.all(deleteSubmissionPromises);
      
      // Refresh data
      await fetchExercises();
      await fetchStudents();
      
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    } finally {
      setDeletingExerciseId(null);
    }
  };

  const handleDraftExerciseClick = (exerciseId) => {
    handleEditExercise(exerciseId);
  };

  const handleViewSubmissions = (exerciseId) => {
    // navigate(`/lecturer/exercise/${exerciseId}/submissions`);
  };

  const handleNewExercise = () => {
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
        deletingExerciseId={deletingExerciseId}
        
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