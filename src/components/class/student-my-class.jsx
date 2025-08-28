import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import StudExerciseFilters from './stud-exercise-filters';
import StudExerciseList from './stud-exercise-list';
import '../../styles/my-class-stud.css';

// SMART CACHING - Respects browser refresh naturally
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const SESSION_KEY = `cache_session_${Date.now()}`;
const cache = {
  enrolledClasses: null,
  classData: new Map(),
  exercises: new Map(),
  progress: new Map(),
  timestamps: new Map(),
  sessionId: SESSION_KEY
};

const isCacheValid = (key) => {
  const timestamp = cache.timestamps.get(key);
  return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
};

const setCacheData = (key, data) => {
  cache.timestamps.set(key, Date.now());
  return data;
};

const StudentMyClass = ({ classId }) => {
  const [user] = useAuthState(auth);
  const [exercises, setExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [classData, setClassData] = useState(() => {
    if (classId) {
      return { 
        name: 'My Exercises',
        id: classId
      };
    }
    return null;
  });

  // Navigation-based cache invalidation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const lastActivity = localStorage.getItem('lastActivity');
        if (!lastActivity || Date.now() - parseInt(lastActivity) > 30000) {
          console.log('🔄 Auto-refreshing after being away');
          invalidateCache();
        }
      }
    };

    const handleBeforeUnload = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user, classId]);

  const fetchExercises = async () => {
    try {
      setExercisesLoading(true);
      setError('');
      
      if (classId) {
        // Single class view
        await fetchSingleClassExercises();
      } else {
        // All classes view
        await fetchAllClassesExercises();
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to load exercises');
    } finally {
      setExercisesLoading(false);
    }
  };

  const fetchSingleClassExercises = async () => {
    const cacheKey = `${user.uid}_${classId}`;
    
    if (isCacheValid(cacheKey) && cache.exercises.has(cacheKey)) {
      console.log('🚀 Using cached data for class', classId);
      setExercises(cache.exercises.get(cacheKey));
      const cachedClassData = cache.classData.get(classId);
      if (cachedClassData) {
        setClassData(cachedClassData);
      }
      return;
    }
    
    // Check enrollment and fetch class data
    const [enrollmentSnapshot, classDoc] = await Promise.all([
      getDocs(query(
        collection(db, 'studentClasses'),
        where('studentId', '==', user.uid),
        where('classId', '==', classId)
      )),
      getDoc(doc(db, 'classes', classId))
    ]);
    
    if (enrollmentSnapshot.empty) {
      setError('You are not enrolled in this class');
      setExercises([]);
      return;
    }
    
    const classDataFromDb = classDoc.exists() ? classDoc.data() : null;
    if (classDataFromDb) {
      const classInfo = { ...classDataFromDb, id: classId };
      setClassData(classInfo);
      cache.classData.set(classId, setCacheData(`class_${classId}`, classInfo));
    }
    
    // Get exercises and progress
    const [exercisesSnapshot, allProgressSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, 'classes', classId, 'exercises'),
        where('status', '==', 'active')
      )),
      getDocs(query(
        collection(db, 'studentProgress'),
        where('studentId', '==', user.uid),
        where('classId', '==', classId)
      ))
    ]);
    
    const progressMap = {};
    allProgressSnapshot.docs.forEach(doc => {
      const progressData = doc.data();
      progressMap[progressData.exerciseId] = progressData;
    });
    
    const allExercises = processExercises(exercisesSnapshot.docs, classId, classDataFromDb, progressMap);
    
    cache.exercises.set(cacheKey, setCacheData(cacheKey, allExercises));
    setExercises(allExercises);
  };

  const fetchAllClassesExercises = async () => {
    const allClassesCacheKey = `all_classes_${user.uid}`;
    
    if (isCacheValid(allClassesCacheKey) && cache.exercises.has(allClassesCacheKey)) {
      console.log('🚀 Using cached data for all classes');
      setExercises(cache.exercises.get(allClassesCacheKey));
      return;
    }
    
    const studentClassesSnapshot = await getDocs(query(
      collection(db, 'studentClasses'),
      where('studentId', '==', user.uid)
    ));
    
    const enrolledClassIds = studentClassesSnapshot.docs.map(doc => doc.data().classId);
    
    if (enrolledClassIds.length === 0) {
      setExercises([]);
      return;
    }
    
    // Get all progress for all classes
    const allProgressSnapshot = await getDocs(query(
      collection(db, 'studentProgress'),
      where('studentId', '==', user.uid)
    ));
    
    const progressMap = {};
    allProgressSnapshot.docs.forEach(doc => {
      const progressData = doc.data();
      const key = `${progressData.classId}_${progressData.exerciseId}`;
      progressMap[key] = progressData;
    });
    
    // Process each class in parallel
    const classPromises = enrolledClassIds.map(async (classId) => {
      try {
        const [classDoc, exercisesSnapshot] = await Promise.all([
          getDoc(doc(db, 'classes', classId)),
          getDocs(query(
            collection(db, 'classes', classId, 'exercises'),
            where('status', '==', 'active')
          ))
        ]);
        
        const classData = classDoc.exists() ? classDoc.data() : null;
        if (classData) {
          cache.classData.set(classId, setCacheData(`class_${classId}`, classData));
        }
        
        return processExercises(exercisesSnapshot.docs, classId, classData, progressMap, true);
      } catch (error) {
        console.warn(`Error fetching exercises for class ${classId}:`, error);
        return [];
      }
    });
    
    const classResults = await Promise.all(classPromises);
    const flatExercises = classResults.flat();
    
    sortExercises(flatExercises);
    
    cache.exercises.set(allClassesCacheKey, setCacheData(allClassesCacheKey, flatExercises));
    setExercises(flatExercises);
  };

  const processExercises = (exerciseDocs, classId, classData, progressMap, isAllClasses = false) => {
    return exerciseDocs.map(exerciseDoc => {
      const exerciseData = { 
        id: exerciseDoc.id, 
        classId: classId,
        className: classData?.name || classData?.title || 'Unknown Class',
        ...exerciseDoc.data() 
      };
      
      const progressKey = isAllClasses ? `${classId}_${exerciseDoc.id}` : exerciseDoc.id;
      const progress = progressMap[progressKey];
      
      exerciseData.progress = progress;
      exerciseData.isSubmitted = !!progress;
      
      exerciseData.isCompleted = !!(progress && (
        progress.status === 'completed' || 
        progress.isCompleted === true ||
        progress.submitted === true ||
        progress.fileUrl ||
        progress.submittedAt ||
        (progress.score !== undefined && progress.score !== null)
      ));
      
      exerciseData.resultsReady = !!(progress && (
        progress.score !== undefined && progress.score !== null ||
        progress.status === 'graded' ||
        progress.isGraded === true
      ));
      
      exerciseData.isPastDue = exerciseData.dueDate && exerciseData.dueDate.toDate 
        ? new Date() > exerciseData.dueDate.toDate() 
        : false;
        
      return exerciseData;
    });
  };

  const sortExercises = (exercises) => {
    exercises.sort((a, b) => {
      const dueDateA = a.dueDate?.toDate ? a.dueDate.toDate() : null;
      const dueDateB = b.dueDate?.toDate ? b.dueDate.toDate() : null;
      
      if (dueDateA && dueDateB) return dueDateA - dueDateB;
      if (dueDateA && !dueDateB) return -1;
      if (!dueDateA && dueDateB) return 1;
      
      const createdA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const createdB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      
      return createdA - createdB;
    });
  };

  const invalidateCache = () => {
    const cacheKey = classId ? `${user?.uid}_${classId}` : `all_classes_${user?.uid}`;
    cache.exercises.delete(cacheKey);
    cache.progress.delete(cacheKey);
    if (classId) {
      cache.classData.delete(classId);
    }
    cache.timestamps.delete(cacheKey);
    console.log('🗑️ Cache invalidated, refetching...');
    fetchExercises();
  };

  // Filter exercises
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        matchesStatus = exercise.isCompleted;
      } else if (statusFilter === 'not-started') {
        matchesStatus = !exercise.isCompleted;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  // Event handlers
  const handleStartExercise = (classId, exerciseId) => {
    window.location.href = `/student/class/${classId}/submit-exercise/${exerciseId}`;
  };

  const handleEditSubmission = (classId, exerciseId) => {
    window.location.href = `/student/class/${classId}/submit-exercise/${exerciseId}?edit=true`;
  };

  const handleViewResults = (classId, exerciseId) => {
    window.location.href = `/student/class/${classId}/exercise/${exerciseId}/results`;
  };

  const getSectionTitle = () => {
    if (!classId) {
      return 'Available Exercises';
    }
    return classData?.name || classData?.title || 'My Exercises';
  };

  if (error) {
    return (
      <div className="stud-mc-container">
        <div className="stud-mc-header">
          <h1 className="stud-mc-title">My Exercises</h1>
          <p className="stud-mc-subtitle">View available exercises and submit your answers</p>
        </div>
        <div className="stud-mc-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="stud-mc-container">
      <div className="stud-mc-header">
        <h1 className="stud-mc-title">My Exercises</h1>
        <p className="stud-mc-subtitle">View available exercises and submit your answers</p>
      </div>
  
      <div className="stud-mc-section">
        <StudExerciseFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          exerciseCount={filteredExercises.length}
        />
        
        {filteredExercises.length === 0 && !exercisesLoading ? (
          <div className="stud-mc-empty-state">
            {exercises.length === 0 ? (
              <div className="stud-mc-empty-content">
                <div className="stud-mc-empty-icon">📝</div>
                <h3>No exercises available</h3>
                <p>No exercises available{classId ? ' for this class' : '. Make sure you\'re enrolled in a class'}.</p>
              </div>
            ) : (
              <div className="stud-mc-empty-content">
                <div className="stud-mc-empty-icon">🔍</div>
                <h3>No exercises found</h3>
                <p>No exercises match your current search and filter criteria. Try adjusting your search term or filter.</p>
              </div>
            )}
          </div>
        ) : (
          <StudExerciseList
            exercises={filteredExercises}
            loading={exercisesLoading}
            showClassName={!classId}
            onStartExercise={handleStartExercise}
            onEditSubmission={handleEditSubmission}
            onViewResults={handleViewResults}
          />
        )}
      </div>
    </div>
  );
};

export default StudentMyClass;